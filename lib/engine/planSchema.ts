import { z } from "zod";
import type { Pack } from "../semantic/types";

// SPEC §5 — строгая схема JSON-плана. LLM обязан вернуть ровно это.
export const FilterSchema = z.object({
  dim: z.string(),
  op: z.enum(["=", "!=", "in", ">", "<", "between"]),
  value: z.union([z.string(), z.number(), z.array(z.any())]),
});

export const TimeSchema = z.object({
  mode: z.enum(["last_n", "range", "all"]),
  n: z.number().optional(),
  unit: z.enum(["day", "month", "quarter", "year"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  grain: z.enum(["day", "month", "quarter", "year"]).default("month"),
});

export const PlanSchema = z.object({
  intent: z.enum(["kpi", "trend", "topn", "breakdown", "compare", "table"]),
  metrics: z.array(z.string()).min(1).max(3),
  dimensions: z.array(z.string()).max(2).default([]),
  filters: z.array(FilterSchema).max(5).default([]),
  time: TimeSchema.default({ mode: "all", grain: "month" }),
  compare: z.enum(["prev_period", "yoy", "none"]).default("none"),
  sort: z
    .object({ by: z.string(), dir: z.enum(["asc", "desc"]) })
    .optional(),
  limit: z.number().max(50).default(12),
  clarify: z.string().nullable().default(null),
});

export type Plan = z.infer<typeof PlanSchema>;
export type Filter = z.infer<typeof FilterSchema>;

export class PlanError extends Error {
  code: "SCHEMA" | "REFS";
  details: string[];
  constructor(code: "SCHEMA" | "REFS", message: string, details: string[] = []) {
    super(message);
    this.name = "PlanError";
    this.code = code;
    this.details = details;
  }
}

/** Проверка ссылок плана на пак: каждый metric/dimension/filter.dim/sort.by обязан существовать. */
export function validatePlanRefs(plan: Plan, pack: Pack): string[] {
  const errors: string[] = [];
  const metricIds = new Set(Object.keys(pack.metrics));
  const dimIds = new Set(Object.keys(pack.dimensions));

  for (const m of plan.metrics) {
    if (!metricIds.has(m)) errors.push(`метрика '${m}' отсутствует в паке ${pack.id}`);
  }
  for (const d of plan.dimensions) {
    if (!dimIds.has(d)) errors.push(`измерение '${d}' отсутствует в паке ${pack.id}`);
  }
  for (const f of plan.filters) {
    if (!dimIds.has(f.dim))
      errors.push(`фильтр по '${f.dim}' отсутствует в паке ${pack.id}`);
  }
  if (plan.sort && !metricIds.has(plan.sort.by) && !dimIds.has(plan.sort.by)) {
    errors.push(`сортировка по '${plan.sort.by}' не найдена в паке ${pack.id}`);
  }
  return errors;
}

/**
 * Полный разбор: zod-схема → ссылки на пак. Бросает PlanError (→ 422 в API).
 * clarify-планы (пустые metrics с текстом уточнения) обрабатываются выше по стеку,
 * до вызова этой функции.
 */
export function parseAndValidatePlan(raw: unknown, pack: Pack): Plan {
  const parsed = PlanSchema.safeParse(raw);
  if (!parsed.success) {
    throw new PlanError(
      "SCHEMA",
      "План не соответствует схеме",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    );
  }
  const refErrors = validatePlanRefs(parsed.data, pack);
  if (refErrors.length > 0) {
    throw new PlanError("REFS", "План ссылается на неизвестные поля", refErrors);
  }
  return parsed.data;
}
