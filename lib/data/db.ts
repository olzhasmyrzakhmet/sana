import type { Client } from "@libsql/client";

/**
 * Единый libSQL-клиент SANA.
 *
 * Драйвер выбирается по схеме URL:
 *  - libsql:// | https:// | wss://  → web-клиент (@libsql/client/web, чистый fetch,
 *    без нативных бинарников) — работает и локально, и на Vercel, и на win32-arm64.
 *  - file: / прочее                → нативный клиент (@libsql/client). Нужен prebuilt
 *    libsql; на win32-arm64 недоступен, поэтому локально работаем против удалённой Turso.
 *
 * «Правда только на проде»: один драйвер и один диалект для локали и прода — Turso.
 * Никакого better-sqlite3 и файлового SQLite как основного пути записи.
 */

const url = process.env.TURSO_DATABASE_URL ?? "";
const authToken = process.env.TURSO_AUTH_TOKEN;

const globalForDb = globalThis as unknown as { __sanaDb?: Promise<Client> };

function isRemote(u: string) {
  return (
    u.startsWith("libsql://") ||
    u.startsWith("https://") ||
    u.startsWith("wss://") ||
    u.startsWith("http://")
  );
}

async function createDbClient(): Promise<Client> {
  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL не задан. Локально и на проде укажите libsql://…-адрес Turso.",
    );
  }
  if (isRemote(url)) {
    const { createClient } = await import("@libsql/client/web");
    return createClient(authToken ? { url, authToken } : { url });
  }
  const { createClient } = await import("@libsql/client");
  return createClient(authToken ? { url, authToken } : { url });
}

/** Ленивый singleton клиента (кэш между hot-reload'ами в dev). */
export function getDb(): Promise<Client> {
  if (!globalForDb.__sanaDb) {
    globalForDb.__sanaDb = createDbClient();
  }
  return globalForDb.__sanaDb;
}

/** Диагностика адаптера без утечки токена. */
export function dbInfo() {
  return {
    adapter: "libsql",
    mode: isRemote(url) ? "turso-remote" : url ? "libsql-file" : "unconfigured",
    hasAuthToken: Boolean(authToken),
    urlHint: url ? url.replace(/\?.*$/, "").replace(/\/\/[^@]*@/, "//") : "(empty)",
  };
}
