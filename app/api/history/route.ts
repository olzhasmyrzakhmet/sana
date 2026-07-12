import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listHistory } from "@/lib/data/history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    const all = user?.role === "ANALYST";
    const items = await listHistory({ userId: user?.id ?? null, all });
    return NextResponse.json({ ok: true, items, all });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e), items: [] },
      { status: 500 },
    );
  }
}
