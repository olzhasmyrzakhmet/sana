import { NextResponse } from "next/server";
import { computeInsights } from "@/lib/engine/anomalies";
import { isPackId } from "@/lib/semantic/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pack = url.searchParams.get("pack") ?? "auto";
    if (!isPackId(pack)) {
      return NextResponse.json({ ok: false, error: `Неизвестный пак: ${pack}`, insights: [] }, { status: 400 });
    }
    const insights = await computeInsights(pack);
    return NextResponse.json({ ok: true, pack, insights });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e), insights: [] },
      { status: 500 },
    );
  }
}
