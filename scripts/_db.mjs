// Клиент libSQL для standalone-скриптов (seed, db-deploy).
// Тот же выбор драйвера, что и в lib/data/db.ts: web-клиент для удалённой Turso.
export async function makeClient() {
  const url = process.env.TURSO_DATABASE_URL ?? "";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL не задан. Заполните .env (локально) или окружение (прод).",
    );
  }
  const remote =
    url.startsWith("libsql://") ||
    url.startsWith("https://") ||
    url.startsWith("wss://") ||
    url.startsWith("http://");
  const mod = remote
    ? await import("@libsql/client/web")
    : await import("@libsql/client");
  return mod.createClient(authToken ? { url, authToken } : { url });
}
