import type { Pack } from "../semantic/types";
import type { Plan } from "./planSchema";

// RBAC применяется СЕРВЕРОМ после планирования (SPEC §9). Содержимое вопроса не может обойти
// scope: мы удаляем любой пользовательский фильтр по rbac-измерению и ставим свой.
export function applyRbac(
  plan: Plan,
  pack: Pack,
  scope: Record<string, unknown> | null | undefined,
): { scoped: boolean; value: string | null } {
  if (scope && pack.rbacDimension && pack.dimensions[pack.rbacDimension]) {
    const v = scope[pack.rbacDimension];
    if (typeof v === "string" || typeof v === "number") {
      plan.filters = [
        ...plan.filters.filter((f) => f.dim !== pack.rbacDimension),
        { dim: pack.rbacDimension, op: "=", value: v },
      ];
      return { scoped: true, value: String(v) };
    }
  }
  return { scoped: false, value: null };
}
