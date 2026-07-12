import { NextResponse } from "next/server";
import { getDb, dbInfo } from "@/lib/data/db";

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

export async function GET() {
  const info = dbInfo();
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
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
    return NextResponse.json({ ok: true, db: info, commit, counts });
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
