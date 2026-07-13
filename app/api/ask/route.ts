import { NextResponse } from "next/server";
import { z } from "zod";
import { getPack, isPackId } from "@/lib/semantic/registry";
import { planFromQuestion, makeInsight, makeFollowups } from "@/lib/ai/provider";
import { applyRbac } from "@/lib/engine/rbac";
import { runPlan } from "@/lib/engine/answer";
import { recordAsk } from "@/lib/data/history";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ question: z.string().min(1).max(500), pack: z.string() });

export async function POST(req: Request) {
  let question = "";
  let packId = "";
  try {
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Ожидается {question, pack}" }, { status: 400 });
    }
    question = parsed.data.question;
    packId = parsed.data.pack;
    if (!isPackId(packId)) {
      return NextResponse.json({ ok: false, error: `Неизвестный пак: ${packId}` }, { status: 400 });
    }
    const pack = getPack(packId);
    const user = await getSessionUser();

    // 1. План (Anthropic → repair → mock → clarify)
    const planResult = await planFromQuestion(question, pack);
    if (planResult.kind === "clarify") {
      return NextResponse.json({
        ok: true,
        clarify: planResult.clarify,
        suggestions: planResult.suggestions,
        engine: planResult.engine,
        engineNote: planResult.note ?? null,
        scoped: false,
      });
    }
    const plan = planResult.plan;

    // 2. RBAC: сервер добавляет фильтр из scope (не LLM)
    const rbac = applyRbac(plan, pack, user?.scope);

    // 3-6. Компиляция → выполнение → дельты → график → KPI → таблица
    const ran = await runPlan(plan, pack);

    // 7-8. Вывод + follow-ups (AI или шаблон)
    const [insight, followups] = await Promise.all([
      makeInsight(question, ran.deltas, pack),
      makeFollowups(question, plan, pack),
    ]);

    // 9. Запись истории + audit (прод-пруф записи)
    let recorded = false;
    try {
      await recordAsk({
        userId: user?.id ?? null,
        pack: packId,
        question,
        planJson: JSON.stringify(plan),
        sqlText: ran.compiled.sql,
        rowCount: ran.result.rowCount,
        durationMs: ran.result.durationMs,
      });
      recorded = true;
    } catch {
      /* не валим ответ, если запись не удалась */
    }

    return NextResponse.json({
      ok: true,
      engine: planResult.engine,
      engineNote: planResult.note ?? null,
      scoped: rbac.scoped,
      scopedRegion: rbac.value,
      plan,
      planHuman: ran.planHuman,
      sql: ran.compiled.sql,
      rows: ran.result.rows,
      rowCount: ran.result.rowCount,
      durationMs: ran.result.durationMs,
      chart: ran.chart,
      kpis: ran.kpis,
      deltas: ran.deltas,
      table: ran.table,
      insight,
      followups,
      metricDefs: ran.metricDefs,
      recorded,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e), question, pack: packId },
      { status: 500 },
    );
  }
}
