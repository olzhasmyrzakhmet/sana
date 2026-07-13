import type { Pack } from "../semantic/types";
import { parseAndValidatePlan, PlanError, type Plan } from "../engine/planSchema";
import { packManifest } from "../semantic/registry";
import { mockPlan, templateInsight, templateFollowups, detectLang } from "./mock";
import type { DeltaResult } from "../engine/deltas";

export type Engine = "anthropic" | "fallback";

function useAnthropic(): boolean {
  return process.env.AI_PROVIDER === "anthropic" && !!process.env.ANTHROPIC_API_KEY;
}

export type PlanResult =
  | { kind: "plan"; plan: Plan; engine: Engine; note?: string }
  | { kind: "clarify"; clarify: string; suggestions: string[]; engine: Engine; note?: string };

function suggestions(pack: Pack): string[] {
  return pack.sampleQuestions.slice(0, 3).map((s) => s.ru);
}
function defaultClarify(): string {
  return "Уточните вопрос: какой показатель и за какой период вас интересует?";
}

function extractClarify(raw: unknown): string | null {
  if (raw && typeof raw === "object" && "clarify" in raw) {
    const c = (raw as { clarify?: unknown }).clarify;
    const metrics = (raw as { metrics?: unknown }).metrics;
    if (typeof c === "string" && c.trim() && (!Array.isArray(metrics) || metrics.length === 0)) {
      return c.trim();
    }
  }
  return null;
}

export async function planFromQuestion(question: string, pack: Pack): Promise<PlanResult> {
  const manifestJson = JSON.stringify(packManifest(pack));
  let aiNote: string | undefined;

  if (useAnthropic()) {
    try {
      const { anthropicPlanRaw } = await import("./anthropic");
      const raw = await anthropicPlanRaw(question, manifestJson);
      const clarify = extractClarify(raw);
      if (clarify) return { kind: "clarify", clarify, suggestions: suggestions(pack), engine: "anthropic" };
      try {
        const plan = parseAndValidatePlan(raw, pack);
        return { kind: "plan", plan, engine: "anthropic" };
      } catch (e) {
        // репар: 1 повтор с текстом ошибки
        const hint = e instanceof PlanError ? e.details.join("; ") : String(e);
        const raw2 = await anthropicPlanRaw(question, manifestJson, hint);
        const clarify2 = extractClarify(raw2);
        if (clarify2) return { kind: "clarify", clarify: clarify2, suggestions: suggestions(pack), engine: "anthropic" };
        const plan = parseAndValidatePlan(raw2, pack);
        return { kind: "plan", plan, engine: "anthropic" };
      }
    } catch (e) {
      // сеть/ключ/кредиты/повторный фейл — уходим в резервный режим, но НЕ молча
      aiNote = e instanceof Error ? e.message : String(e);
      console.error("[ai] anthropic недоступен, резервный режим:", aiNote);
    }
  }

  const rawMock = mockPlan(question, pack);
  if (rawMock) {
    try {
      const plan = parseAndValidatePlan(rawMock, pack);
      return { kind: "plan", plan, engine: "fallback", note: aiNote };
    } catch {
      /* mock дал невалидный план — clarify */
    }
  }
  return { kind: "clarify", clarify: defaultClarify(), suggestions: suggestions(pack), engine: "fallback", note: aiNote };
}

export async function makeInsight(
  question: string,
  deltas: DeltaResult,
  pack: Pack,
): Promise<{ summary: string; bullets: string[]; nextCheck: string }> {
  const lang = detectLang(question);
  if (useAnthropic()) {
    try {
      const { anthropicInsightRaw } = await import("./anthropic");
      const numbers = JSON.stringify({
        metric: deltas.primaryMetric,
        total: deltas.total,
        deltaPct: deltas.deltaPct,
        direction: deltas.direction,
        topContributor: deltas.topContributor,
        series: deltas.series.slice(0, 12),
      });
      const r = await anthropicInsightRaw(question, numbers, lang);
      if (r.summary) return r;
    } catch {
      /* fall to template */
    }
  }
  return templateInsight(question, deltas, pack, lang);
}

export async function makeFollowups(
  question: string,
  plan: Plan,
  pack: Pack,
): Promise<string[]> {
  if (useAnthropic()) {
    try {
      const { anthropicFollowupsRaw } = await import("./anthropic");
      const ids = [...Object.keys(pack.metrics), ...Object.keys(pack.dimensions)].join(",");
      const r = await anthropicFollowupsRaw(JSON.stringify(plan), ids);
      if (r.length) return r.slice(0, 3);
    } catch {
      /* fall to template */
    }
  }
  return templateFollowups(pack, plan.dimensions);
}
