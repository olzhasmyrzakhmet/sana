import { describe, it, expect } from "vitest";
import { PlanSchema } from "@/lib/engine/planSchema";
import { computeDeltas } from "@/lib/engine/deltas";
import { getPack } from "@/lib/semantic/registry";

const auto = getPack("auto");

describe("deltas — эталонные числа", () => {
  it("тренд: total=сумма, дельта последней точки к предыдущей", () => {
    const rows = [
      { month: "2026-01", revenue: 10 },
      { month: "2026-02", revenue: 20 },
      { month: "2026-03", revenue: 30 },
    ];
    const d = computeDeltas(
      { rows, groupCols: ["month"], timeCol: "month" },
      PlanSchema.parse({ intent: "trend", metrics: ["revenue"] }),
      auto,
    );
    expect(d.total).toBe(60);
    expect(d.compareTotal).toBe(20);
    expect(d.deltaAbs).toBe(10);
    expect(d.deltaPct).toBe(50);
    expect(d.direction).toBe("up");
    expect(d.good).toBe(true); // revenue вверх — хорошо
    expect(d.series).toHaveLength(3);
  });

  it("topn: топ-вклад и доля", () => {
    const rows = [
      { dealer: "A", revenue: 50 },
      { dealer: "B", revenue: 30 },
      { dealer: "C", revenue: 20 },
    ];
    const d = computeDeltas(
      { rows, groupCols: ["dealer"] },
      PlanSchema.parse({ intent: "topn", metrics: ["revenue"], dimensions: ["dealer"] }),
      auto,
    );
    expect(d.total).toBe(100);
    expect(d.topContributor?.label).toBe("A");
    expect(d.topContributor?.value).toBe(50);
    expect(d.topContributor?.share).toBe(50);
  });

  it("AVG-метрика: total = среднее, а не сумма", () => {
    const rows = [
      { month: "2026-01", avg_discount: 10 },
      { month: "2026-02", avg_discount: 20 },
    ];
    const d = computeDeltas(
      { rows, groupCols: ["month"], timeCol: "month" },
      PlanSchema.parse({ intent: "trend", metrics: ["avg_discount"] }),
      auto,
    );
    expect(d.total).toBe(15);
    // скидка выросла → это «плохо» (goodDirection down)
    expect(d.direction).toBe("up");
    expect(d.good).toBe(false);
  });
});
