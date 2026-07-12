import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getUserByEmail, toPublic } from "@/lib/data/users";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Некорректные данные входа" }, { status: 400 });
    }
    const u = await getUserByEmail(parsed.data.email);
    if (!u || !bcrypt.compareSync(parsed.data.password, u.password_hash)) {
      return NextResponse.json({ ok: false, error: "Неверный логин или пароль" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true, user: toPublic(u) });
    res.cookies.set(SESSION_COOKIE, signSession(u.id), sessionCookieOptions());
    return res;
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
