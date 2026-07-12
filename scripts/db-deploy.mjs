// Идемпотентная миграция схемы SANA. Запускается в Vercel buildCommand и локально.
// node scripts/db-deploy.mjs
import { loadEnv } from "./_env.mjs";
import { makeClient } from "./_db.mjs";
import { ddlStatements } from "./schema.mjs";

async function main() {
  loadEnv();
  const db = await makeClient();
  let ok = 0;
  for (const sql of ddlStatements) {
    await db.execute(sql);
    ok++;
  }
  // Быстрая проверка соединения.
  const probe = await db.execute("SELECT 1 AS one");
  console.log(
    `[db-deploy] схема применена: ${ok} операций; select 1 => ${probe.rows[0].one}`,
  );
}

main().catch((err) => {
  console.error("[db-deploy] ОШИБКА:", err?.message ?? err);
  process.exit(1);
});
