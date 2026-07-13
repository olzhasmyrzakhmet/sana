import type { Pack, Grain } from "../semantic/types";
import type { Plan } from "./planSchema";

// SPEC §6 (шаг 3). Компилятор собирает SQL ТОЛЬКО из whitelist sqlExpr пака.
// Значения фильтров — всегда параметры (?), пользовательский текст НИКОГДА не попадает в SQL.

export type SqlValue = string | number;

export interface CompiledQuery {
  sql: string;
  args: SqlValue[];
  compareSql?: string;
  compareArgs?: SqlValue[];
  groupCols: string[];
  metricCols: string[];
  timeCol?: string;
}

type WindowKind = "current" | "prev" | "yoy";

function baseTableName(factTable: string): string {
  return factTable.trim().split(/\s+/)[0];
}
function dateColumn(timeField: string): string {
  const parts = timeField.split(".");
  return parts[parts.length - 1];
}

function timeBucketExpr(timeField: string, grain: Grain): string {
  switch (grain) {
    case "day":
      return `strftime('%Y-%m-%d', ${timeField})`;
    case "quarter":
      return `strftime('%Y', ${timeField}) || '-Q' || ((CAST(strftime('%m', ${timeField}) AS INTEGER) + 2) / 3)`;
    case "year":
      return `strftime('%Y', ${timeField})`;
    case "month":
    default:
      return `strftime('%Y-%m', ${timeField})`;
  }
}

/** Единицы для date()-модификаторов. quarter моделируем как месяцы×3. */
function unitInfo(unit: Plan["time"]["unit"], n: number) {
  switch (unit) {
    case "day":
      return { word: "days", count: n, align: [] as string[] };
    case "year":
      return { word: "years", count: n, align: ["start of year"] };
    case "quarter":
      return { word: "months", count: n * 3, align: ["start of month"] };
    case "month":
    default:
      return { word: "months", count: n, align: ["start of month"] };
  }
}

/**
 * Временное окно как SQL-фрагмент. Все смещения — целые числа (безопасно инлайнятся).
 * Для range — параметры from/to. Для all — пусто. compare (prev/yoy) — только для last_n.
 */
function timeWhere(
  plan: Plan,
  pack: Pack,
  kind: WindowKind,
): { frag: string; args: SqlValue[] } | null {
  const tf = pack.timeField;
  const time = plan.time;

  if (time.mode === "all") return kind === "current" ? { frag: "", args: [] } : null;

  if (time.mode === "range") {
    if (kind !== "current") return null; // compare для range в MVP не строим
    const args: SqlValue[] = [];
    const parts: string[] = [];
    if (time.from) {
      parts.push(`${tf} >= ?`);
      args.push(time.from);
    }
    if (time.to) {
      parts.push(`${tf} <= ?`);
      args.push(time.to);
    }
    return { frag: parts.join(" AND "), args };
  }

  // last_n
  const n = Math.max(1, Math.min(120, Math.floor(time.n ?? 12)));
  const { word, count, align } = unitInfo(time.unit, n);
  const anchor = `(SELECT MAX(${dateColumn(tf)}) FROM ${baseTableName(pack.factTable)})`;
  const mods = (offset: number) =>
    [...align, `'-${offset} ${word}'`].map((m) => (m.startsWith("'") ? m : `'${m}'`)).join(", ");
  const loCurrent = `date(${anchor}, ${mods(count - 1)})`;

  if (kind === "current") {
    return { frag: `${tf} >= ${loCurrent} AND ${tf} <= ${anchor}`, args: [] };
  }
  if (kind === "prev") {
    const loPrev = `date(${anchor}, ${mods(2 * count - 1)})`;
    return { frag: `${tf} >= ${loPrev} AND ${tf} < ${loCurrent}`, args: [] };
  }
  // yoy: то же окно, сдвинутое на год назад
  const loYoy = `date(${loCurrent}, '-1 years')`;
  const hiYoy = `date(${anchor}, '-1 years')`;
  return { frag: `${tf} >= ${loYoy} AND ${tf} <= ${hiYoy}`, args: [] };
}

const OP_SQL: Record<Plan["filters"][number]["op"], string> = {
  "=": "=",
  "!=": "!=",
  ">": ">",
  "<": "<",
  in: "IN",
  between: "BETWEEN",
};

function buildFilters(plan: Plan, pack: Pack): { frag: string; args: SqlValue[] } {
  const parts: string[] = [];
  const args: SqlValue[] = [];
  for (const f of plan.filters) {
    const dim = pack.dimensions[f.dim];
    if (!dim) throw new Error(`compiler: измерение '${f.dim}' не в паке`);
    const expr = dim.sqlExpr;
    if (f.op === "in") {
      const vals = Array.isArray(f.value) ? f.value : [f.value];
      if (vals.length === 0) continue;
      parts.push(`${expr} IN (${vals.map(() => "?").join(", ")})`);
      for (const v of vals) args.push(v as SqlValue);
    } else if (f.op === "between") {
      const vals = Array.isArray(f.value) ? f.value : [];
      if (vals.length !== 2) throw new Error("compiler: between требует [a,b]");
      parts.push(`${expr} BETWEEN ? AND ?`);
      args.push(vals[0] as SqlValue, vals[1] as SqlValue);
    } else {
      // скалярные операторы: если пришёл массив (LLM ошибся) — берём первый скаляр, не роняем запрос
      const v = Array.isArray(f.value) ? f.value[0] : f.value;
      parts.push(`${expr} ${OP_SQL[f.op]} ?`);
      args.push(v as SqlValue);
    }
  }
  return { frag: parts.join(" AND "), args };
}

function buildQuery(
  plan: Plan,
  pack: Pack,
  kind: WindowKind,
): { sql: string; args: SqlValue[]; groupCols: string[]; metricCols: string[]; timeCol?: string } | null {
  // метрики
  const metricCols: string[] = [];
  const selectParts: string[] = [];
  for (const mId of plan.metrics) {
    const m = pack.metrics[mId];
    if (!m) throw new Error(`compiler: метрика '${mId}' не в паке`);
    selectParts.push(`${m.sqlExpr} AS "${mId}"`);
    metricCols.push(mId);
  }

  // группировки (kpi — без группировки)
  const groupCols: string[] = [];
  const groupExprs: string[] = [];
  let timeCol: string | undefined;

  if (plan.intent !== "kpi") {
    const hasTimeDim = plan.dimensions.some(
      (d) => pack.dimensions[d]?.kind === "time",
    );
    if (plan.intent === "trend" && !hasTimeDim) {
      const alias = plan.time.grain;
      const expr = timeBucketExpr(pack.timeField, plan.time.grain);
      selectParts.unshift(`${expr} AS "${alias}"`);
      groupCols.unshift(alias);
      groupExprs.unshift(expr);
      timeCol = alias;
    }
    for (const dId of plan.dimensions) {
      const d = pack.dimensions[dId];
      if (!d) throw new Error(`compiler: измерение '${dId}' не в паке`);
      selectParts.push(`${d.sqlExpr} AS "${dId}"`);
      groupCols.push(dId);
      groupExprs.push(d.sqlExpr);
      if (d.kind === "time" && !timeCol) timeCol = dId;
    }
  }

  // FROM + JOIN (whitelist)
  const from = `FROM ${pack.factTable}${pack.joins
    .map((j) => ` JOIN ${j.table} ON ${j.on}`)
    .join("")}`;

  // WHERE
  const tw = timeWhere(plan, pack, kind);
  if (!tw) return null; // окно для этого kind не строится
  const filt = buildFilters(plan, pack);
  const whereParts = [tw.frag, filt.frag].filter((s) => s && s.length > 0);
  const where = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
  const args = [...tw.args, ...filt.args];

  // GROUP BY
  const groupBy = groupExprs.length ? `GROUP BY ${groupExprs.join(", ")}` : "";

  // ORDER BY
  let orderBy = "";
  if (plan.sort) {
    orderBy = `ORDER BY "${plan.sort.by}" ${plan.sort.dir.toUpperCase()}`;
  } else if (timeCol) {
    orderBy = `ORDER BY "${timeCol}" ASC`;
  } else if (groupCols.length) {
    orderBy = `ORDER BY "${plan.metrics[0]}" DESC`;
  }

  // LIMIT
  let limit = "";
  if (plan.intent === "trend") {
    limit = "LIMIT 60"; // тренды не режем topN-лимитом
  } else if (plan.intent !== "kpi") {
    limit = `LIMIT ${Math.max(1, Math.min(50, Math.floor(plan.limit)))}`;
  }

  const sql = [`SELECT ${selectParts.join(", ")}`, from, where, groupBy, orderBy, limit]
    .filter((s) => s.length > 0)
    .join("\n");

  return { sql, args, groupCols, metricCols, timeCol };
}

export function compileSql(plan: Plan, pack: Pack): CompiledQuery {
  const main = buildQuery(plan, pack, "current");
  if (!main) throw new Error("compiler: не удалось построить основной запрос");

  let compareSql: string | undefined;
  let compareArgs: SqlValue[] | undefined;
  if (plan.compare === "prev_period" || plan.compare === "yoy") {
    const kind: WindowKind = plan.compare === "yoy" ? "yoy" : "prev";
    const cmp = buildQuery(plan, pack, kind);
    if (cmp) {
      compareSql = cmp.sql;
      compareArgs = cmp.args;
    }
  }

  return {
    sql: main.sql,
    args: main.args,
    compareSql,
    compareArgs,
    groupCols: main.groupCols,
    metricCols: main.metricCols,
    timeCol: main.timeCol,
  };
}
