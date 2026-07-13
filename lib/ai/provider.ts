import type { Pack } from "../semantic/types";
import { parseAndValidatePlan, PlanError, type Plan } from "../engine/planSchema";
import { packManifest } from "../semantic/registry";
import { mockPlan, templateInsight, templateFollowups, detectLang } from "./mock";
import type { DeltaResult } from "../engine/deltas";

export type Engine = "anthropic" | "gemini" | "fallback";
type AiMode = "anthropic" | "gemini" | "none";

function aiMode(): AiMode {
  const p = process.env.AI_PROVIDER;
  if (p === "gemini" && process.env.GEMINI_API_KEY) return "gemini";
  if (p === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "none";
}

// Диагностика: последняя ошибка AI-провайдера (для /api/health/db).
let lastAiError: string | null = null;
export function getLastAiError(): string | null {
  return lastAiError;
}

interface Adapter {
  planRaw: (q: string, manifest: string, repair?: string) => Promise<unknown>;
  insightRaw: (q: string, numbers: string, lang: "ru" | "kk") => Promise<{ summary: string; bullets: string[]; nextCheck: string }>;
  followupsRaw: (planJson: string, ids: string) => Promise<string[]>;
}

async function getAdapter(mode: AiMode): Promise<Adapter> {
  if (mode === "gemini") {
    const m = await import("./gemini");
    return { planRaw: m.geminiPlanRaw, insightRaw: m.geminiInsightRaw, followupsRaw: m.geminiFollowupsRaw };
  }
  const m = await import("./anthropic");
  return { planRaw: m.anthropicPlanRaw, insightRaw: m.anthropicInsightRaw, followupsRaw: m.anthropicFollowupsRaw };
}

/** Активный пробник живости AI для health?probe=ai. */
export async function probeAi(): Promise<{ mode: AiMode; ok: boolean; error?: string; model?: string }> {
  const mode = aiMode();
  if (mode === "none") return { mode, ok: false, error: "провайдер/ключ не настроены" };
  try {
    if (mode === "gemini") {
      const m = await import("./gemini");
      await m.geminiProbe();
      return { mode, ok: true, model: process.env.GEMINI_MODEL || "gemini-2.0-flash" };
    }
    const m = await import("./anthropic");
    await m.anthropicProbe();
    return { mode, ok: true, model: process.env.AI_MODEL || "claude-sonnet-4-6" };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    lastAiError = err;
    return { mode, ok: false, error: err };
  }
}

export type PlanResult =
  | { kind: "plan"; plan: Plan; engine: Engine; note?: string }
  | { kind: "clarify"; clarify: string; suggestions: string[]; engine: Engine; note?: string };

function suggestions(pack: Pack): string[] {
  return pack.sampleQuestions.slice(0, 3).map((s) => s.ru);
}
function defaultClarify(): string {
  return "Уточните вопрос: какой показатель, разрез и за какой период вас интересуют? Например:";
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
  const mode = aiMode();
  const engine: Engine = mode === "gemini" ? "gemini" : "anthropic";

  if (mode !== "none") {
    try {
      const ad = await getAdapter(mode);
      const raw = await ad.planRaw(question, manifestJson);
      const clarify = extractClarify(raw);
      if (clarify) return { kind: "clarify", clarify, suggestions: suggestions(pack), engine };
      try {
        const plan = parseAndValidatePlan(raw, pack);
        return { kind: "plan", plan, engine };
      } catch (e) {
        const hint = e instanceof PlanError ? e.details.join("; ") : String(e);
        const raw2 = await ad.planRaw(question, manifestJson, hint);
        const clarify2 = extractClarify(raw2);
        if (clarify2) return { kind: "clarify", clarify: clarify2, suggestions: suggestions(pack), engine };
        const plan = parseAndValidatePlan(raw2, pack);
        return { kind: "plan", plan, engine };
      }
    } catch (e) {
      lastAiError = e instanceof Error ? e.message : String(e);
      console.error("[ai] провайдер недоступен, резервный режим:", lastAiError);
      aiNote = "резервный режим: AI-провайдер временно недоступен";
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
  const mode = aiMode();
  if (mode !== "none") {
    try {
      const ad = await getAdapter(mode);
      const numbers = JSON.stringify({
        metric: deltas.primaryMetric,
        total: deltas.total,
        deltaPct: deltas.deltaPct,
        direction: deltas.direction,
        topContributor: deltas.topContributor,
        series: deltas.series.slice(0, 12),
      });
      const r = await ad.insightRaw(question, numbers, lang);
      if (r.summary) return r;
    } catch (e) {
      lastAiError = e instanceof Error ? e.message : String(e);
    }
  }
  return templateInsight(question, deltas, pack, lang);
}

export async function makeFollowups(question: string, plan: Plan, pack: Pack): Promise<string[]> {
  const mode = aiMode();
  if (mode !== "none") {
    try {
      const ad = await getAdapter(mode);
      const ids = [...Object.keys(pack.metrics), ...Object.keys(pack.dimensions)].join(",");
      const r = await ad.followupsRaw(JSON.stringify(plan), ids);
      if (r.length) return r.slice(0, 3);
    } catch (e) {
      lastAiError = e instanceof Error ? e.message : String(e);
    }
  }
  return templateFollowups(pack, plan.dimensions);
}
