import { getDb } from "./db";

export type Role = "CEO" | "REGION" | "ANALYST";

export interface DbUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  scope: Record<string, unknown> | null;
  password_hash: string;
}

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  scope: Record<string, unknown> | null;
}

function rowToUser(r: Record<string, unknown>): DbUser {
  let scope: Record<string, unknown> | null = null;
  if (r.scope_json && typeof r.scope_json === "string") {
    try {
      scope = JSON.parse(r.scope_json);
    } catch {
      scope = null;
    }
  }
  return {
    id: Number(r.id),
    email: String(r.email),
    name: String(r.name),
    role: String(r.role) as Role,
    scope,
    password_hash: String(r.password_hash),
  };
}

export function toPublic(u: DbUser): PublicUser {
  return { id: u.id, email: u.email, name: u.name, role: u.role, scope: u.scope };
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT id, email, name, role, scope_json, password_hash FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });
  if (r.rows.length === 0) return null;
  return rowToUser(r.rows[0] as Record<string, unknown>);
}

export async function getUserById(id: number): Promise<DbUser | null> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT id, email, name, role, scope_json, password_hash FROM users WHERE id = ? LIMIT 1",
    args: [id],
  });
  if (r.rows.length === 0) return null;
  return rowToUser(r.rows[0] as Record<string, unknown>);
}
