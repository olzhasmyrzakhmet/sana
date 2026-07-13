// Ядро сида: используется и CLI (seed.mjs), и авто-сидом в билде (seed-if-empty.mjs).
import bcrypt from "bcryptjs";
import { ddlStatements } from "./schema.mjs";
import {
  DEALERS,
  MODELS,
  STORES,
  CATEGORIES,
  BRANCHES,
  BANK_PRODUCTS,
  USERS,
  DEMO_PASSWORD,
} from "./seed-data.mjs";

async function ensureSchema(db) {
  for (const sql of ddlStatements) await db.execute(sql);
}

async function seedUsers(db) {
  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const stmts = USERS.map((u) => ({
    sql: `INSERT INTO users (email, password_hash, name, role, scope_json)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(email) DO UPDATE SET
            password_hash = excluded.password_hash,
            name = excluded.name,
            role = excluded.role,
            scope_json = excluded.scope_json`,
    args: [u.email, hash, u.name, u.role, u.scope_json],
  }));
  await db.batch(stmts, "write");
}

async function upsert(db, table, rows, columns) {
  if (rows.length === 0) return;
  const placeholders = columns.map(() => "?").join(", ");
  const stmts = rows.map((r) => ({
    sql: `INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
    args: columns.map((c) => r[c]),
  }));
  await db.batch(stmts, "write");
}

async function seedReference(db) {
  await upsert(db, "dealers", DEALERS, ["id", "name", "city", "region"]);
  await upsert(db, "models", MODELS, ["id", "brand", "model", "segment", "price_class"]);
  await upsert(db, "stores", STORES, ["id", "name", "city", "region"]);
  await upsert(db, "categories", CATEGORIES, ["id", "name"]);
  await upsert(db, "branches", BRANCHES, ["id", "name", "city", "region"]);
  await upsert(db, "bank_products", BANK_PRODUCTS, ["id", "name", "type"]);
}

export async function counts(db) {
  const tables = [
    "users", "dealers", "models", "stores", "categories", "branches",
    "bank_products", "auto_sales", "retail_sales", "bank_facts", "ask_history",
  ];
  const out = {};
  for (const t of tables) {
    const r = await db.execute(`SELECT COUNT(*) AS n FROM ${t}`);
    out[t] = Number(r.rows[0].n);
  }
  return out;
}

export async function seedAll(db) {
  await ensureSchema(db);
  await seedUsers(db);
  await seedReference(db);
  const { seedFacts } = await import("./seed-facts.mjs");
  await seedFacts(db);
}
