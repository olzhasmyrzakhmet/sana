import type { Pack } from "../semantic/types";
import type { Plan } from "./planSchema";
import type { Row } from "./runner";

// SPEC §6 (шаг 6). Детерминированный выбор типа графика по форме результата.
export type ChartType = "kpi" | "line" | "bar" | "donut" | "stacked-bar" | "table";

export interface ChartSpec {
  type: ChartType;
  /** Ось X / категория. */
  x?: string;
  /** Метрики-серии (для line/kpi). */
  series?: string[];
  /** Категория (для bar/donut). */
  category?: string;
  /** Второе измерение (для stacked-bar). */
  stack?: string;
  /** Ключ значения (для bar/donut/stacked). */
  valueKey?: string;
}

function isAdditive(sqlExpr: string): boolean {
  return sqlExpr.trim().toUpperCase().startsWith("SUM(");
}

export function selectChart(
  args: { rows: Row[]; groupCols: string[]; metricCols: string[]; timeCol?: string },
  plan: Plan,
  pack: Pack,
): ChartSpec {
  const { rows, groupCols, metricCols, timeCol } = args;
  const catCols = groupCols.filter((c) => c !== timeCol);
  const singleMetric = metricCols.length === 1;
  const primaryAdditive = isAdditive(pack.metrics[metricCols[0]].sqlExpr);

  // KPI: одно число (нет группировок)
  if (plan.intent === "kpi" || groupCols.length === 0) {
    return { type: "kpi", series: metricCols };
  }

  // Тренд → линия (x = время)
  if (timeCol) {
    // время + категория → многосерийная линия по времени (можно stacked-bar, но линия читаемее)
    return { type: "line", x: timeCol, series: catCols.length ? undefined : metricCols, category: catCols[0], valueKey: metricCols[0] };
  }

  // Два категориальных измерения → stacked bar
  if (catCols.length >= 2 && singleMetric) {
    return { type: "stacked-bar", x: catCols[0], stack: catCols[1], valueKey: metricCols[0] };
  }

  // Доля от целого (breakdown, аддитивная метрика, ≤6 категорий) → donut
  if (
    plan.intent === "breakdown" &&
    singleMetric &&
    primaryAdditive &&
    rows.length <= 6
  ) {
    return { type: "donut", category: catCols[0], valueKey: metricCols[0] };
  }

  // topn/breakdown, 1 метрика, ≤8 категорий → горизонтальный bar
  if (singleMetric && rows.length <= 8) {
    return { type: "bar", category: catCols[0], valueKey: metricCols[0] };
  }

  // всё прочее → таблица (таблица доступна всегда как fallback)
  return { type: "table" };
}
