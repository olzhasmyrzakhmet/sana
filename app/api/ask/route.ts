import { NextResponse } from "next/server";
import { z } from "zod";
import { getPack, isPackId } from "@/lib/semantic/registry";
import { loc, type Pack } from "@/lib/semantic/types";
import type { Plan } from "@/lib/engine/planSchema";
import { compileSql } from "@/lib/engine/compiler";
import { run } from "@/lib/engine/runner";
import { computeDeltas } from "@/lib/engine/deltas";
import { selectChart } from "@/lib/engine/chartSelector";
import { applyRbac } from "@/lib/engine/rbac";
import { planFromQuestion, makeInsight, makeFollowups } from "@/lib/ai/provider";
import { recordAsk } from "@/lib/data/history";
import { getSessionUser } from "@/lib/auth";
import { formatValue } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ question: z.string().min(1).max(500), pack: z.string() });

function additive(sqlExpr: string) {
  return sqlExpr.trim().toUpperCase().startsWith("SUM(");
}
function aggMetric(rows: Record<string, unknown>[], id: string, isAdd: boolean): number {
  const vals = rows.map((r) => Number(r[id]) || 0);
  if (!vals.length) return 0;
  const sum = vals.reduce((a, b) => a + b, 0);
  return isAdd ? sum : sum / vals.length;
}

function dimTitle(pack: Pack, key: string): string {
  const d = pack.dimensions[key];
  return d ? loc(d.title) : key;
}

function describePlan(plan: Plan, pack: Pack): string {
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
  if (plan.intent === "trend") parts.push(`по ${plan.time.grain === "quarter" ? "кварталам" : plan.time.grain === "year" ? "годам" : "месяцам"}`);
  if (dims.length) parts.push(`по ${dims.join(", ")}`);
  parts.push(timeStr);
  return parts.join(" ");
}

export async function POST(req: Request) {
  let question = "";
  let packId = "";
  try {
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Ожидается {question, pack}" }, { status: 400 });
    }
    question = parsed.data.question;
    packId = parsed.data.pack;
    if (!isPackId(packId)) {
      return NextResponse.json({ ok: false, error: `Неизвестный пак: ${packId}` }, { status: 400 });
    }
    const pack = getPack(packId);
    const user = await getSessionUser();

    // 1. План (Anthropic → repair → mock → clarify)
    const planResult = await planFromQuestion(question, pack);
    if (planResult.kind === "clarify") {
      return NextResponse.json({
        ok: true,
        clarify: planResult.clarify,
        suggestions: planResult.suggestions,
        engine: planResult.engine,
        scoped: false,
      });
    }
    const plan = planResult.plan;

    // 2. RBAC: сервер добавляет фильтр из scope (не LLM)
    const rbac = applyRbac(plan, pack, user?.scope);
    const scoped = rbac.scoped;
    const scopedValue = rbac.value;

    // 3-4. Компиляция + выполнение
    const compiled = compileSql(plan, pack);
    const result = await run(compiled);

    // 5. Дельты (детерминированно)
    const deltas = computeDeltas(
      { rows: result.rows, compareRows: result.compareRows, groupCols: compiled.groupCols, timeCol: compiled.timeCol },
      plan,
      pack,
    );

    // 6. График
    const chart = selectChart(
      { rows: result.rows, groupCols: compiled.groupCols, metricCols: compiled.metricCols, timeCol: compiled.timeCol },
      plan,
      pack,
    );

    // 7-8. Вывод + follow-ups (AI или шаблон)
    const [insight, followups] = await Promise.all([
      makeInsight(question, deltas, pack),
      makeFollowups(question, plan, pack),
    ]);

    // KPI-строка
    const kpis = plan.metrics.map((id, i) => {
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

    // Таблица (fallback всегда)
    const columns = [
      ...compiled.groupCols.map((c) => ({ key: c, title: dimTitle(pack, c), kind: "dim" as const })),
      ...compiled.metricCols.map((c) => ({
        key: c,
        title: loc(pack.metrics[c].title),
        format: pack.metrics[c].format,
        kind: "metric" as const,
      })),
    ];

    // TrustPanel: определения использованных метрик (whitelist SQL — безопасно показывать)
    const metricDefs = plan.metrics.map((id) => ({
      id,
      title: loc(pack.metrics[id].title),
      sqlExpr: pack.metrics[id].sqlExpr,
      format: pack.metrics[id].format,
    }));

    // 9. Запись истории + audit (прод-пруф записи)
    let recorded = false;
    try {
      await recordAsk({
        userId: user?.id ?? null,
        pack: packId,
        question,
        planJson: JSON.stringify(plan),
        sqlText: compiled.sql,
        rowCount: result.rowCount,
        durationMs: result.durationMs,
      });
      recorded = true;
    } catch {
      /* не валим ответ, если запись не удалась */
    }

    return NextResponse.json({
      ok: true,
      engine: planResult.engine,
      scoped,
      scopedRegion: scopedValue,
      plan,
      planHuman: describePlan(plan, pack),
      sql: compiled.sql,
      rows: result.rows,
      rowCount: result.rowCount,
      durationMs: result.durationMs,
      chart,
      kpis,
      deltas,
      table: { columns, rows: result.rows },
      insight,
      followups,
      metricDefs,
      recorded,
    });
  } catch (e) {
    // НИКОГДА пустой 500 — всегда JSON-тело
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e), question, pack: packId },
      { status: 500 },
    );
  }
}
