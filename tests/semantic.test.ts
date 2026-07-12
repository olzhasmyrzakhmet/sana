import { describe, it, expect } from "vitest";
import { getPack, listPacks, packManifest, isPackId } from "@/lib/semantic/registry";

describe("semantic registry", () => {
  it("отдаёт пак auto с обязательными полями", () => {
    const p = getPack("auto");
    expect(p.id).toBe("auto");
    expect(p.factTable).toContain("auto_sales");
    expect(Object.keys(p.metrics)).toContain("revenue");
    expect(p.rbacDimension).toBe("region");
  });

  it("все 3 пака валидны, ≥12 RU и ≥6 KK sampleQuestions", () => {
    for (const p of listPacks()) {
      expect(p.sampleQuestions.length).toBeGreaterThanOrEqual(12);
      const kk = p.sampleQuestions.filter((q) => q.kk).length;
      expect(kk).toBeGreaterThanOrEqual(6);
      // defaultMetric существует
      expect(p.metrics[p.defaultMetric]).toBeDefined();
      // каждая метрика/измерение имеют sqlExpr
      for (const m of Object.values(p.metrics)) expect(m.sqlExpr.length).toBeGreaterThan(0);
      for (const d of Object.values(p.dimensions)) expect(d.sqlExpr.length).toBeGreaterThan(0);
    }
  });

  it("manifest не содержит SQL", () => {
    const man = packManifest(getPack("auto"));
    expect(JSON.stringify(man)).not.toContain("SUM(");
  });

  it("isPackId различает валидные/невалидные", () => {
    expect(isPackId("auto")).toBe(true);
    expect(isPackId("crypto")).toBe(false);
  });
});
