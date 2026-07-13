import { getPack } from "../semantic/registry";
import { mockPlan, templateInsight } from "../ai/mock";
import { parseAndValidatePlan } from "../engine/planSchema";
import { runPlan, type Kpi } from "../engine/answer";
import type { ChartSpec } from "../engine/chartSelector";
import type { Row } from "../engine/runner";

export interface LiveExample {
  question: string;
  kpis: Kpi[];
  chart: ChartSpec;
  rows: Row[];
  metricDefs: { id: string; title: string; sqlExpr: string; format: "money" | "number" | "percent" }[];
  insightSummary: string;
  rowCount: number;
  durationMs: number;
  sql: string;
  planHuman: string;
}

/** Реальный предрендеренный ответ из Turso для витрины (детерминированно, без AI). */
export async function getLiveExample(
  question = "Какая выручка по месяцам за последний год?",
): Promise<LiveExample | null> {
  const pack = getPack("auto");
  const raw = mockPlan(question, pack);
  if (!raw) return null;
  const plan = parseAndValidatePlan(raw, pack);
  const ran = await runPlan(plan, pack);
  if (!ran.result.rowCount) return null;
  const insight = templateInsight(question, ran.deltas, pack, "ru");
  return {
    question,
    kpis: ran.kpis,
    chart: ran.chart,
    rows: ran.result.rows,
    metricDefs: ran.metricDefs,
    insightSummary: insight.summary,
    rowCount: ran.result.rowCount,
    durationMs: ran.result.durationMs,
    sql: ran.compiled.sql,
    planHuman: ran.planHuman,
  };
}
