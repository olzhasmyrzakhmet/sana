import { describe, it, expect } from "vitest";
import { PlanSchema } from "@/lib/engine/planSchema";
import { applyRbac } from "@/lib/engine/rbac";
import { compileSql } from "@/lib/engine/compiler";
import { getPack } from "@/lib/semantic/registry";

const auto = getPack("auto");

describe("rbac — scope добавляется сервером и не обходится вопросом", () => {
  it("REGION scope добавляет фильтр по региону в SQL", () => {
    const plan = PlanSchema.parse({
      intent: "topn",
      metrics: ["revenue"],
      dimensions: ["dealer"],
      time: { mode: "all", grain: "month" },
    });
    const r = applyRbac(plan, auto, { region: "Алматы" });
    expect(r.scoped).toBe(true);
    expect(r.value).toBe("Алматы");
    const c = compileSql(plan, auto);
    expect(c.sql).toContain("dl.region = ?");
    expect(c.args).toContain("Алматы");
  });

  it("пользовательский фильтр по региону перезаписывается scope (нельзя обойти)", () => {
    const plan = PlanSchema.parse({
      intent: "topn",
      metrics: ["revenue"],
      dimensions: ["dealer"],
      filters: [{ dim: "region", op: "=", value: "Астана" }], // как будто LLM подсунул
      time: { mode: "all", grain: "month" },
    });
    applyRbac(plan, auto, { region: "Алматы" });
    const regionFilters = plan.filters.filter((f) => f.dim === "region");
    expect(regionFilters).toHaveLength(1);
    expect(regionFilters[0].value).toBe("Алматы");
    const c = compileSql(plan, auto);
    expect(c.args).toContain("Алматы");
    expect(c.args).not.toContain("Астана");
  });

  it("без scope (CEO) фильтр не добавляется", () => {
    const plan = PlanSchema.parse({
      intent: "topn",
      metrics: ["revenue"],
      dimensions: ["dealer"],
      time: { mode: "all", grain: "month" },
    });
    const r = applyRbac(plan, auto, null);
    expect(r.scoped).toBe(false);
    expect(plan.filters).toHaveLength(0);
  });
});
