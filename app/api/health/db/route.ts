import { NextResponse } from "next/server";
import { getDb, dbInfo } from "@/lib/data/db";
import { getLastAiError, probeAi } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PROBE_TABLES = [
  "users",
  "dealers",
  "models",
  "auto_sales",
  "retail_sales",
  "bank_facts",
  "ask_history",
] as const;

export async function GET(req: Request) {
  const info = dbInfo();
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
  const wantProbe = new URL(req.url).searchParams.get("probe") === "ai";
  try {
    const db = await getDb();
    const counts: Record<string, number | null> = {};
    for (const t of PROBE_TABLES) {
      try {
        const r = await db.execute(`SELECT COUNT(*) AS n FROM ${t}`);
        counts[t] = Number(r.rows[0].n);
      } catch {
        counts[t] = null; // таблицы ещё нет — не валим весь health
      }
    }
    const ai: Record<string, unknown> = {
      provider: process.env.AI_PROVIDER ?? "mock",
      hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      model: process.env.AI_PROVIDER === "gemini"
        ? (process.env.GEMINI_MODEL ?? "gemini-2.0-flash-lite")
        : (process.env.AI_MODEL ?? ""),
      lastError: getLastAiError(),
    };
    if (wantProbe) ai.probe = await probeAi(); // активный тест живого AI (?probe=ai)
    return NextResponse.json({ ok: true, db: info, commit, counts, ai });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        db: info,
        commit,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
