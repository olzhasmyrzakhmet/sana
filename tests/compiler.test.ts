import { describe, it, expect } from "vitest";
import { PlanSchema } from "@/lib/engine/planSchema";
import { compileSql } from "@/lib/engine/compiler";
import { getPack } from "@/lib/semantic/registry";

const auto = getPack("auto");

describe("compiler — безопасность и корректность", () => {
  it("собирает SQL из whitelist sqlExpr", () => {
    const plan = PlanSchema.parse({
      intent: "topn",
      metrics: ["revenue"],
      dimensions: ["dealer"],
      time: { mode: "all", grain: "month" },
    });
    const c = compileSql(plan, auto);
    expect(c.sql).toContain("SUM(s.revenue)");
    expect(c.sql).toContain("dl.name");
    expect(c.sql).toContain("FROM auto_sales s");
    expect(c.sql).toContain("JOIN dealers dl");
  });

  it("инъекция в filter.value НЕ попадает в текст SQL (параметризация)", () => {
    const evil = "Алматы'; DROP TABLE users;--";
    const plan = PlanSchema.parse({
      intent: "topn",
      metrics: ["revenue"],
      dimensions: ["dealer"],
      filters: [{ dim: "region", op: "=", value: evil }],
      time: { mode: "all", grain: "month" },
    });
    const c = compileSql(plan, auto);
    expect(c.sql).not.toContain("DROP TABLE");
    expect(c.sql).toContain("dl.region = ?");
    expect(c.args).toContain(evil);
  });

  it("IN-фильтр параметризует каждое значение", () => {
    const plan = PlanSchema.parse({
      intent: "breakdown",
      metrics: ["revenue"],
      dimensions: ["brand"],
      filters: [{ dim: "region", op: "in", value: ["Алматы", "Астана"] }],
      time: { mode: "all", grain: "month" },
    });
    const c = compileSql(plan, auto);
    expect(c.sql).toContain("dl.region IN (?, ?)");
    expect(c.args).toEqual(["Алматы", "Астана"]);
  });

  it("compare=prev_period строит второй запрос за предыдущий период", () => {
    const plan = PlanSchema.parse({
      intent: "kpi",
      metrics: ["revenue"],
      time: { mode: "last_n", n: 12, unit: "month", grain: "month" },
      compare: "prev_period",
    });
    const c = compileSql(plan, auto);
    expect(c.compareSql).toBeTruthy();
    expect(c.compareSql).toContain("SUM(s.revenue)");
  });

  it("trend добавляет временной бакет и сортировку по времени", () => {
    const plan = PlanSchema.parse({
      intent: "trend",
      metrics: ["revenue"],
      time: { mode: "last_n", n: 12, unit: "month", grain: "month" },
    });
    const c = compileSql(plan, auto);
    expect(c.timeCol).toBe("month");
    expect(c.sql).toContain("strftime('%Y-%m', s.d)");
    expect(c.sql).toContain('ORDER BY "month" ASC');
  });

  it("LIMIT жёстко ограничен ≤50 для topn", () => {
    const plan = PlanSchema.parse({
      intent: "topn",
      metrics: ["revenue"],
      dimensions: ["dealer"],
      limit: 50,
      time: { mode: "all", grain: "month" },
    });
    const c = compileSql(plan, auto);
    expect(c.sql).toContain("LIMIT 50");
  });
});
