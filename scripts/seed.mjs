// Идемпотентный сид SANA. node/tsx scripts/seed.mjs
// Фаза 0.3: пользователи + справочники. Факты (~75k строк) добавляются в фазе 1.2.
import bcrypt from "bcryptjs";
import { loadEnv } from "./_env.mjs";
import { makeClient } from "./_db.mjs";
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
  await upsert(db, "models", MODELS, [
    "id",
    "brand",
    "model",
    "segment",
    "price_class",
  ]);
  await upsert(db, "stores", STORES, ["id", "name", "city", "region"]);
  await upsert(db, "categories", CATEGORIES, ["id", "name"]);
  await upsert(db, "branches", BRANCHES, ["id", "name", "city", "region"]);
  await upsert(db, "bank_products", BANK_PRODUCTS, ["id", "name", "type"]);
}

async function counts(db) {
  const tables = [
    "users",
    "dealers",
    "models",
    "stores",
    "categories",
    "branches",
    "bank_products",
    "auto_sales",
    "retail_sales",
    "bank_facts",
    "ask_history",
  ];
  const out = {};
  for (const t of tables) {
    const r = await db.execute(`SELECT COUNT(*) AS n FROM ${t}`);
    out[t] = Number(r.rows[0].n);
  }
  return out;
}

async function main() {
  loadEnv();
  const db = await makeClient();
  await ensureSchema(db);
  await seedUsers(db);
  await seedReference(db);

  // --- Факты: добавляются в фазе 1.2 (scripts/seed-facts.mjs) ---
  try {
    const mod = await import("./seed-facts.mjs");
    await mod.seedFacts(db);
  } catch (e) {
    if (e?.code === "ERR_MODULE_NOT_FOUND") {
      console.log("[seed] seed-facts.mjs ещё нет — факты будут в фазе 1.2");
    } else {
      throw e;
    }
  }

  console.table(await counts(db));
  console.log("[seed] готово (идемпотентно).");
}

main().catch((err) => {
  console.error("[seed] ОШИБКА:", err?.message ?? err);
  process.exit(1);
});
