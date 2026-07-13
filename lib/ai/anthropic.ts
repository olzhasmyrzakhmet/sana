import Anthropic from "@anthropic-ai/sdk";
import { planSystemPrompt, INSIGHT_SYSTEM, followupsSystem, PLAN_SCHEMA_HINT } from "./prompts";

// Тонкий адаптер Anthropic. Вызывается ТОЛЬКО когда есть ключ (проверка в provider.ts).
// model из env, max_tokens 2000. Без temperature/thinking (новые модели их отвергают).

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}
const MODEL = process.env.AI_MODEL || "claude-sonnet-4-6";

async function complete(system: string, user: string): Promise<string> {
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 2000,
    system,
    messages: [{ role: "user", content: user }],
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/** Достаёт первый JSON-объект из текста (снимает markdown-заборы). */
function extractJson(text: string): unknown {
  let t = text.trim();
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

export async function anthropicPlanRaw(
  question: string,
  manifestJson: string,
  repairHint?: string,
): Promise<unknown> {
  const system = planSystemPrompt(manifestJson, PLAN_SCHEMA_HINT);
  const user = repairHint
    ? `${question}\n\nПредыдущий ответ был невалиден: ${repairHint}. Верни ИСПРАВЛЕННЫЙ валидный JSON-план без markdown.`
    : question;
  const text = await complete(system, user);
  return extractJson(text);
}

export async function anthropicInsightRaw(
  question: string,
  numbersJson: string,
  lang: "ru" | "kk",
): Promise<{ summary: string; bullets: string[]; nextCheck: string }> {
  const langNote = lang === "kk" ? " Вопрос был на казахском — ответь по-казахски." : "";
  const text = await complete(
    INSIGHT_SYSTEM + langNote,
    `Вопрос: ${question}\nЧисла: ${numbersJson}`,
  );
  const obj = extractJson(text) as { summary?: string; bullets?: string[]; nextCheck?: string };
  return {
    summary: String(obj.summary ?? ""),
    bullets: Array.isArray(obj.bullets) ? obj.bullets.map(String).slice(0, 3) : [],
    nextCheck: String(obj.nextCheck ?? ""),
  };
}

/** Быстрый пробник живости для /api/health/db?probe=ai. */
export async function anthropicProbe(): Promise<void> {
  await complete("Ответь строго JSON.", 'Верни {"ok":true}');
}

export async function anthropicFollowupsRaw(
  planJson: string,
  manifestIds: string,
): Promise<string[]> {
  const text = await complete(followupsSystem(manifestIds), `План и результат: ${planJson}`);
  const obj = extractJson(text) as { items?: unknown };
  return Array.isArray(obj.items) ? obj.items.map(String).slice(0, 3) : [];
}
