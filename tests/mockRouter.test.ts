import { describe, it, expect } from "vitest";
import { listPacks } from "@/lib/semantic/registry";
import { mockPlan } from "@/lib/ai/mock";
import { parseAndValidatePlan } from "@/lib/engine/planSchema";

describe("mockRouter — все sampleQuestions резолвятся в валидный план", () => {
  for (const pack of listPacks()) {
    describe(`пак ${pack.id}`, () => {
      for (const sq of pack.sampleQuestions) {
        const variants = [sq.ru, sq.kk].filter(Boolean) as string[];
        for (const q of variants) {
          it(`«${q}»`, () => {
            const raw = mockPlan(q, pack);
            expect(raw, `mock не разобрал: ${q}`).not.toBeNull();
            const plan = parseAndValidatePlan(raw, pack);
            expect(plan.metrics.length).toBeGreaterThanOrEqual(1);
          });
        }
      }
    });
  }

  it("чепуха → mockPlan вернул null (→ clarify выше по стеку)", () => {
    const auto = listPacks()[0];
    expect(mockPlan("приготовь плов", auto)).toBeNull();
    expect(mockPlan("который час", auto)).toBeNull();
  });

  it("казахский топ-вопрос → topn/units", () => {
    const auto = listPacks()[0];
    const raw = mockPlan("Өткен айдағы ең көп сатылған модель қандай?", auto);
    const plan = parseAndValidatePlan(raw, auto);
    expect(plan.metrics).toContain("units");
    expect(["topn", "breakdown"]).toContain(plan.intent);
  });
});
