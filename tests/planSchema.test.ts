import { describe, it, expect } from "vitest";
import { PlanSchema, parseAndValidatePlan, PlanError } from "@/lib/engine/planSchema";
import { getPack } from "@/lib/semantic/registry";

const auto = getPack("auto");

describe("planSchema", () => {
  it("валидный план проходит и получает дефолты", () => {
    const plan = parseAndValidatePlan(
      { intent: "topn", metrics: ["revenue"], dimensions: ["dealer"] },
      auto,
    );
    expect(plan.limit).toBe(12);
    expect(plan.compare).toBe("none");
    expect(plan.time.grain).toBe("month");
    expect(plan.filters).toEqual([]);
  });

  it("пустые metrics → SCHEMA-ошибка", () => {
    const r = PlanSchema.safeParse({ intent: "kpi", metrics: [] });
    expect(r.success).toBe(false);
  });

  it("метрика вне пака → REFS-ошибка (422)", () => {
    try {
      parseAndValidatePlan({ intent: "kpi", metrics: ["profit_margin"] }, auto);
      throw new Error("должно было бросить");
    } catch (e) {
      expect(e).toBeInstanceOf(PlanError);
      expect((e as PlanError).code).toBe("REFS");
    }
  });

  it("измерение вне пака → REFS-ошибка", () => {
    expect(() =>
      parseAndValidatePlan(
        { intent: "topn", metrics: ["revenue"], dimensions: ["weather"] },
        auto,
      ),
    ).toThrow(PlanError);
  });

  it("невалидный intent → SCHEMA-ошибка", () => {
    const r = PlanSchema.safeParse({ intent: "predict", metrics: ["revenue"] });
    expect(r.success).toBe(false);
  });
});
