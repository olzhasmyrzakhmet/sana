import { planSystemPrompt, INSIGHT_SYSTEM, followupsSystem, PLAN_SCHEMA_HINT } from "./prompts";

// Адаптер Google Gemini (бесплатный tier, generativelanguage API) на fetch — без SDK.
// Промпты те же (SPEC §7). responseMimeType: application/json → чистый JSON.

function key(): string {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY не задан");
  return k;
}

// Цепочка бесплатных моделей (flash-lite/8b — выше free-квота). На 404 пробуем следующую.
function modelChain(): string[] {
  const preferred = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";
  const chain = [
    preferred,
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-flash",
  ].filter(Boolean) as string[];
  return [...new Set(chain)];
}

let workingModel: string | null = null;
export function geminiWorkingModel(): string | null {
  return workingModel;
}

// Circuit breaker: при исчерпании квоты (429) не долбим API каждый запрос — короткий кулдаун,
// в течение которого сразу уходим в безопасный резерв (быстро, без латентности).
let cooldownUntil = 0;

async function callModel(model: string, system: string, user: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key() },
    signal: AbortSignal.timeout(14000), // не висим: 14с на вызов → иначе безопасный резерв
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 2000, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    const err = new Error(`Gemini ${res.status} (${model}): ${t.slice(0, 200)}`);
    (err as { status?: number }).status = res.status;
    throw err;
  }
  const j = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    promptFeedback?: { blockReason?: string };
  };
  if (j.promptFeedback?.blockReason) throw new Error(`Gemini blocked: ${j.promptFeedback.blockReason}`);
  const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("Gemini: пустой ответ");
  return text;
}

async function complete(system: string, user: string): Promise<string> {
  if (Date.now() < cooldownUntil) throw new Error("Gemini: кулдаун после 429 (квота)");
  // Рабочая модель — первой; пробуем максимум 3 модели, чтобы ограничить латентность.
  const chain = [...new Set(workingModel ? [workingModel, ...modelChain()] : modelChain())].slice(0, 3);
  let lastErr: unknown = null;
  let saw429 = false;
  for (const model of chain) {
    try {
      const out = await callModel(model, system, user);
      workingModel = model;
      return out;
    } catch (e) {
      lastErr = e;
      const status = (e as { status?: number }).status;
      if (model === workingModel) workingModel = null;
      if (status === 429) saw429 = true;
      // 404 (нет модели) / 429 (квота этой модели) → пробуем следующую; иное — пробрасываем.
      if (status === 404 || status === 429) continue;
      throw e;
    }
  }
  // Все попытки 429 → короткий кулдаун, чтобы не долбить исчерпанную квоту.
  if (saw429) cooldownUntil = Date.now() + 30_000;
  throw lastErr instanceof Error ? lastErr : new Error("Gemini: модели недоступны");
}

function extractJson(text: string): unknown {
  let t = text.trim();
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

export async function geminiPlanRaw(question: string, manifestJson: string, repairHint?: string): Promise<unknown> {
  const system = planSystemPrompt(manifestJson, PLAN_SCHEMA_HINT);
  const user = repairHint
    ? `${question}\n\nПредыдущий ответ был невалиден: ${repairHint}. Верни ИСПРАВЛЕННЫЙ валидный JSON-план.`
    : question;
  return extractJson(await complete(system, user));
}

export async function geminiInsightRaw(
  question: string,
  numbersJson: string,
  lang: "ru" | "kk",
): Promise<{ summary: string; bullets: string[]; nextCheck: string }> {
  const langNote = lang === "kk" ? " Вопрос был на казахском — ответь по-казахски." : "";
  const obj = extractJson(await complete(INSIGHT_SYSTEM + langNote, `Вопрос: ${question}\nЧисла: ${numbersJson}`)) as {
    summary?: string;
    bullets?: string[];
    nextCheck?: string;
  };
  return {
    summary: String(obj.summary ?? ""),
    bullets: Array.isArray(obj.bullets) ? obj.bullets.map(String).slice(0, 3) : [],
    nextCheck: String(obj.nextCheck ?? ""),
  };
}

export async function geminiFollowupsRaw(planJson: string, manifestIds: string): Promise<string[]> {
  const obj = extractJson(await complete(followupsSystem(manifestIds), `План и результат: ${planJson}`)) as {
    items?: unknown;
  };
  return Array.isArray(obj.items) ? obj.items.map(String).slice(0, 3) : [];
}

/** Быстрый пробник живости провайдера для /api/health/db?probe=ai. */
export async function geminiProbe(): Promise<void> {
  await complete("Ответь строго JSON.", 'Верни {"ok":true}');
}
