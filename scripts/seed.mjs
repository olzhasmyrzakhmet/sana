// Идемпотентный сид SANA (полный). node scripts/seed.mjs
import { loadEnv } from "./_env.mjs";
import { makeClient } from "./_db.mjs";
import { seedAll, counts } from "./seed-core.mjs";

async function main() {
  loadEnv();
  const db = await makeClient();
  await seedAll(db);
  console.table(await counts(db));
  console.log("[seed] готово (идемпотентно).");
}

main().catch((err) => {
  console.error("[seed] ОШИБКА:", err?.message ?? err);
  process.exit(1);
});
