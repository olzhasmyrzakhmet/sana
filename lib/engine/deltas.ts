import type { Pack } from "../semantic/types";
import type { Plan } from "./planSchema";
import type { Row } from "./runner";

// SPEC §6 (шаг 5). Детерминированный расчёт итога, дельты и топ-вклада.
// LLM НИЧЕГО не считает — только формулирует по этим числам.

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface DeltaResult {
  primaryMetric: string;
  primaryFormat: Pack["metrics"][string]["format"];
  total: number;
  compareTotal: number | null;
  deltaAbs: number | null;
  deltaPct: number | null;
  direction: "up" | "down" | "flat" | null;
  good: boolean | null;
  topContributor: { label: string; value: number; share: number } | null;
  series: SeriesPoint[];
  count: number;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isAdditive(sqlExpr: string): boolean {
  return sqlExpr.trim().toUpperCase().startsWith("SUM(");
}

function aggregate(values: number[], additive: boolean): number {
  if (values.length === 0) return 0;
  if (additive) return values.reduce((a, b) => a + b, 0);
  return values.reduce((a, b) => a + b, 0) / values.length; // среднее для AVG-метрик
}

export function computeDeltas(
  args: {
    rows: Row[];
    compareRows?: Row[];
    groupCols: string[];
    timeCol?: string;
  },
  plan: Plan,
  pack: Pack,
): DeltaResult {
  const { rows, compareRows, groupCols, timeCol } = args;
  const primaryMetric = plan.metrics[0];
  const metric = pack.metrics[primaryMetric];
  const additive = isAdditive(metric.sqlExpr);

  const values = rows.map((r) => num(r[primaryMetric]));
  const total = aggregate(values, additive);

  // series
  const labelCol = timeCol ?? groupCols[0];
  const series: SeriesPoint[] = labelCol
    ? rows.map((r) => ({ label: String(r[labelCol] ?? ""), value: num(r[primaryMetric]) }))
    : [];

  // дельта
  let compareTotal: number | null = null;
  let deltaAbs: number | null = null;
  let deltaPct: number | null = null;

  if (compareRows && compareRows.length > 0) {
    compareTotal = aggregate(
      compareRows.map((r) => num(r[primaryMetric])),
      additive,
    );
  } else if (timeCol && series.length >= 2) {
    // без compare-запроса: последняя точка против предыдущей
    compareTotal = series[series.length - 2].value;
  }

  if (compareTotal !== null) {
    const current = timeCol && series.length >= 1 && !compareRows
      ? series[series.length - 1].value
      : total;
    deltaAbs = current - compareTotal;
    deltaPct = compareTotal !== 0 ? (deltaAbs / Math.abs(compareTotal)) * 100 : null;
  }

  let direction: DeltaResult["direction"] = null;
  let good: boolean | null = null;
  if (deltaAbs !== null) {
    const eps = Math.abs(total) * 1e-6;
    direction = deltaAbs > eps ? "up" : deltaAbs < -eps ? "down" : "flat";
    if (metric.goodDirection && direction !== "flat") {
      good = direction === metric.goodDirection;
    }
  }

  // топ-вклад (для нетрендовых разрезов)
  let topContributor: DeltaResult["topContributor"] = null;
  if (!timeCol && groupCols.length > 0 && series.length > 0) {
    const top = [...series].sort((a, b) => b.value - a.value)[0];
    const sum = additive ? values.reduce((a, b) => a + b, 0) : 0;
    topContributor = {
      label: top.label,
      value: top.value,
      share: sum > 0 ? (top.value / sum) * 100 : 0,
    };
  }

  return {
    primaryMetric,
    primaryFormat: metric.format,
    total,
    compareTotal,
    deltaAbs,
    deltaPct,
    direction,
    good,
    topContributor,
    series,
    count: rows.length,
  };
}
