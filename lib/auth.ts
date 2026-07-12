import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getUserById, toPublic, type PublicUser } from "./data/users";

// Cookie-сессия на HMAC (без таблицы sessions). SPEC §9.
export const SESSION_COOKIE = "sana_session";
const SECRET = process.env.SESSION_SECRET || "dev-secret-sana";

export function signSession(userId: number): string {
  const payload = Buffer.from(String(userId)).toString("base64url");
  const mac = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function verifySession(token: string): number | null {
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const id = parseInt(Buffer.from(payload, "base64url").toString(), 10);
  return Number.isFinite(id) ? id : null;
}

/** Текущий пользователь из cookie (или null). Для серверных компонентов и роутов. */
export async function getSessionUser(): Promise<PublicUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const id = verifySession(token);
  if (id === null) return null;
  const u = await getUserById(id);
  return u ? toPublic(u) : null;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  };
}
