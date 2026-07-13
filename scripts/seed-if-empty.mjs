// Авто-сид в билде: сеет ТОЛЬКО если БД пустая (быстрый COUNT). Идемпотентно, без таймаутов
// на повторных деплоях. node scripts/seed-if-empty.mjs
import { loadEnv } from "./_env.mjs";
import { makeClient } from "./_db.mjs";
import { ddlStatements } from "./schema.mjs";
import { seedAll, counts } from "./seed-core.mjs";

async function main() {
  loadEnv();
  if (!process.env.TURSO_DATABASE_URL) {
    console.log("[seed-if-empty] TURSO_DATABASE_URL не задан — пропуск (preview-билд?).");
    return;
  }
  const db = await makeClient();
  for (const sql of ddlStatements) await db.execute(sql); // схема на месте
  const r = await db.execute("SELECT COUNT(*) AS n FROM auto_sales");
  const n = Number(r.rows[0].n);
  if (n > 0) {
    console.log(`[seed-if-empty] данные уже есть (auto_sales=${n}) — пропуск сида.`);
    return;
  }
  console.log("[seed-if-empty] БД пустая — сею…");
  await seedAll(db);
  console.table(await counts(db));
}

main().catch((err) => {
  // Не валим билд из-за сида (схема уже применена db-deploy); логируем.
  console.error("[seed-if-empty] предупреждение:", err?.message ?? err);
});
