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

  it("чепуха и низкоуверенные вопросы → null (→ clarify, НЕ случайный план)", () => {
    const auto = listPacks()[0];
    expect(mockPlan("приготовь плов", auto)).toBeNull();
    expect(mockPlan("который час", auto)).toBeNull();
    // Разговорный вопрос не из списка: упоминает «дилер», но без метрики/намерения/периода →
    // уверенного совпадения нет → clarify, а не уверенная разбивка выручки.
    expect(mockPlan("Слушай, а какой дилер у нас хуже всех просел этой весной и почему так вышло?", auto)).toBeNull();
    expect(mockPlan("покажи что-нибудь интересное про продавцов", auto)).toBeNull();
    // Разговорные вопросы с ОДНИМ словом-метрикой/намерением → clarify, не уверенный тотал:
    expect(mockPlan("стоит ли переживать за продажи?", auto)).toBeNull();
    expect(mockPlan("где у нас вообще дела идут лучше всего сейчас?", auto)).toBeNull();
    expect(mockPlan("как думаешь, всё нормально с выручкой?", auto)).toBeNull();
  });

  it("вопрос с сущностью, которую роутер не умеет (регион-значение/сезон/месяц) → clarify", () => {
    const auto = listPacks()[0];
    // Пример жюри: Алматы (фильтр по значению) + весна (сезон) — роутер их игнорирует → clarify
    expect(mockPlan("Покажи как менялась прибыль дилеров Алматы этой весной", auto)).toBeNull();
    expect(mockPlan("Выручка по дилерам в Астане", auto)).toBeNull();
    expect(mockPlan("Продажи в марте 2026", auto)).toBeNull();
    expect(mockPlan("Что было летом с продажами?", auto)).toBeNull();
  });

  it("казахский топ-вопрос → topn/units", () => {
    const auto = listPacks()[0];
    const raw = mockPlan("Өткен айдағы ең көп сатылған модель қандай?", auto);
    const plan = parseAndValidatePlan(raw, auto);
    expect(plan.metrics).toContain("units");
    expect(["topn", "breakdown"]).toContain(plan.intent);
  });
});
