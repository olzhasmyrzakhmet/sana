import { NextResponse } from "next/server";
import { landingStats } from "@/lib/data/history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await landingStats();
    return NextResponse.json({ ok: true, stats });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
