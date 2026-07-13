import type { Pack } from "../semantic/types";
import { loc } from "../semantic/types";
import type { Plan } from "./planSchema";
import { compileSql, type CompiledQuery } from "./compiler";
import { run, type RunResult, type Row } from "./runner";
import { computeDeltas, type DeltaResult } from "./deltas";
import { selectChart, type ChartSpec } from "./chartSelector";
import { formatValue } from "../format";

// Общая сборка ответа (компиляция → выполнение → дельты → график → KPI → таблица).
// Используется и /api/ask, и живым примером на витрине — единый путь, одни числа.

export interface Kpi {
  id: string;
  title: string;
  format: "money" | "number" | "percent";
  value: string;
  raw: number;
  deltaPct: number | null;
  direction: "up" | "down" | "flat" | null;
  good: boolean | null;
}

export interface RanPlan {
  compiled: CompiledQuery;
  result: RunResult;
  deltas: DeltaResult;
  chart: ChartSpec;
  kpis: Kpi[];
  table: { columns: { key: string; title: string; kind: "dim" | "metric"; format?: "money" | "number" | "percent" }[]; rows: Row[] };
  metricDefs: { id: string; title: string; sqlExpr: string; format: "money" | "number" | "percent" }[];
  planHuman: string;
}

function additive(sqlExpr: string) {
  return sqlExpr.trim().toUpperCase().startsWith("SUM(");
}
function aggMetric(rows: Row[], id: string, isAdd: boolean): number {
  const vals = rows.map((r) => Number(r[id]) || 0);
  if (!vals.length) return 0;
  const sum = vals.reduce((a, b) => a + b, 0);
  return isAdd ? sum : sum / vals.length;
}
function dimTitle(pack: Pack, key: string): string {
  const d = pack.dimensions[key];
  return d ? loc(d.title) : key;
}

export function describePlan(plan: Plan, pack: Pack): string {
  const metrics = plan.metrics.map((m) => loc(pack.metrics[m].title)).join(", ");
  const intentRu: Record<string, string> = {
    kpi: "Итоговое значение",
    trend: "Динамика",
    topn: `Топ-${plan.limit}`,
    breakdown: "Разбивка",
    compare: "Сравнение",
    table: "Таблица",
  };
  const dims = plan.dimensions.map((d) => loc(pack.dimensions[d].title));
  const timeStr =
    plan.time.mode === "last_n"
      ? `за последние ${plan.time.n ?? 12} (${plan.time.unit ?? "month"})`
      : plan.time.mode === "range"
        ? `за период ${plan.time.from ?? "?"}–${plan.time.to ?? "?"}`
        : "за всё время";
  const parts = [intentRu[plan.intent] ?? plan.intent, `«${metrics}»`];
  if (plan.intent === "trend")
    parts.push(`по ${plan.time.grain === "quarter" ? "кварталам" : plan.time.grain === "year" ? "годам" : "месяцам"}`);
  if (dims.length) parts.push(`по ${dims.join(", ")}`);
  parts.push(timeStr);
  return parts.join(" ");
}

export async function runPlan(plan: Plan, pack: Pack): Promise<RanPlan> {
  const compiled = compileSql(plan, pack);
  const result = await run(compiled);
  const deltas = computeDeltas(
    { rows: result.rows, compareRows: result.compareRows, groupCols: compiled.groupCols, timeCol: compiled.timeCol },
    plan,
    pack,
  );
  const chart = selectChart(
    { rows: result.rows, groupCols: compiled.groupCols, metricCols: compiled.metricCols, timeCol: compiled.timeCol },
    plan,
    pack,
  );
  const kpis: Kpi[] = plan.metrics.map((id, i) => {
    const m = pack.metrics[id];
    const isAdd = additive(m.sqlExpr);
    const total = i === 0 ? deltas.total : aggMetric(result.rows, id, isAdd);
    return {
      id,
      title: loc(m.title),
      format: m.format,
      value: formatValue(total, m.format),
      raw: total,
      deltaPct: i === 0 ? deltas.deltaPct : null,
      direction: i === 0 ? deltas.direction : null,
      good: i === 0 ? deltas.good : null,
    };
  });
  const table = {
    columns: [
      ...compiled.groupCols.map((c) => ({ key: c, title: dimTitle(pack, c), kind: "dim" as const })),
      ...compiled.metricCols.map((c) => ({
        key: c,
        title: loc(pack.metrics[c].title),
        format: pack.metrics[c].format,
        kind: "metric" as const,
      })),
    ],
    rows: result.rows,
  };
  const metricDefs = plan.metrics.map((id) => ({
    id,
    title: loc(pack.metrics[id].title),
    sqlExpr: pack.metrics[id].sqlExpr,
    format: pack.metrics[id].format,
  }));
  return { compiled, result, deltas, chart, kpis, table, metricDefs, planHuman: describePlan(plan, pack) };
}
