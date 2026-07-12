import { describe, it, expect } from "vitest";
import { PlanSchema } from "@/lib/engine/planSchema";
import { selectChart } from "@/lib/engine/chartSelector";
import { getPack } from "@/lib/semantic/registry";

const auto = getPack("auto");
const p = (o: object) => PlanSchema.parse(o);

describe("chartSelector — 6 форм", () => {
  it("одно число → kpi", () => {
    const spec = selectChart(
      { rows: [{ revenue: 100 }], groupCols: [], metricCols: ["revenue"] },
      p({ intent: "kpi", metrics: ["revenue"] }),
      auto,
    );
    expect(spec.type).toBe("kpi");
  });

  it("тренд по времени → line", () => {
    const spec = selectChart(
      {
        rows: [{ month: "2026-01", revenue: 10 }],
        groupCols: ["month"],
        metricCols: ["revenue"],
        timeCol: "month",
      },
      p({ intent: "trend", metrics: ["revenue"] }),
      auto,
    );
    expect(spec.type).toBe("line");
    expect(spec.x).toBe("month");
  });

  it("топ-N категорий (≤8) → bar", () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({ dealer: `D${i}`, revenue: i }));
    const spec = selectChart(
      { rows, groupCols: ["dealer"], metricCols: ["revenue"] },
      p({ intent: "topn", metrics: ["revenue"], dimensions: ["dealer"] }),
      auto,
    );
    expect(spec.type).toBe("bar");
    expect(spec.category).toBe("dealer");
  });

  it("breakdown с малым числом категорий → donut", () => {
    const rows = Array.from({ length: 4 }, (_, i) => ({ brand: `B${i}`, revenue: i + 1 }));
    const spec = selectChart(
      { rows, groupCols: ["brand"], metricCols: ["revenue"] },
      p({ intent: "breakdown", metrics: ["revenue"], dimensions: ["brand"] }),
      auto,
    );
    expect(spec.type).toBe("donut");
  });

  it("два измерения → stacked-bar", () => {
    const rows = [{ region: "Алматы", brand: "B", revenue: 1 }];
    const spec = selectChart(
      { rows, groupCols: ["region", "brand"], metricCols: ["revenue"] },
      p({ intent: "breakdown", metrics: ["revenue"], dimensions: ["region", "brand"] }),
      auto,
    );
    expect(spec.type).toBe("stacked-bar");
  });

  it("много категорий (>8) → table", () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ model: `M${i}`, revenue: i }));
    const spec = selectChart(
      { rows, groupCols: ["model"], metricCols: ["revenue"] },
      p({ intent: "topn", metrics: ["revenue"], dimensions: ["model"], limit: 20 }),
      auto,
    );
    expect(spec.type).toBe("table");
  });
});
