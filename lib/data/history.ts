import { getDb } from "./db";

export interface AskRecord {
  userId: number | null;
  pack: string;
  question: string;
  planJson: string;
  sqlText: string;
  rowCount: number;
  durationMs: number;
}

/** Запись ask_history + audit_log — прод-пруф записи в БД. */
export async function recordAsk(rec: AskRecord): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.batch(
    [
      {
        sql: `INSERT INTO ask_history (user_id, pack, question, plan_json, sql_text, row_count, duration_ms, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [rec.userId, rec.pack, rec.question, rec.planJson, rec.sqlText, rec.rowCount, rec.durationMs, now],
      },
      {
        sql: `INSERT INTO audit_log (user_id, action, meta_json, created_at) VALUES (?, ?, ?, ?)`,
        args: [
          rec.userId,
          "ask",
          JSON.stringify({ pack: rec.pack, question: rec.question, rowCount: rec.rowCount }),
          now,
        ],
      },
    ],
    "write",
  );
}

export interface HistoryItem {
  id: number;
  pack: string;
  question: string;
  rowCount: number;
  durationMs: number;
  createdAt: string;
}

function toItem(r: Record<string, unknown>): HistoryItem {
  return {
    id: Number(r.id),
    pack: String(r.pack),
    question: String(r.question),
    rowCount: Number(r.row_count ?? 0),
    durationMs: Number(r.duration_ms ?? 0),
    createdAt: String(r.created_at),
  };
}

/** История: свои запросы пользователя (или все — для ANALYST). */
export async function listHistory(opts: { userId: number | null; all: boolean; limit?: number }): Promise<HistoryItem[]> {
  const db = await getDb();
  const limit = Math.min(100, opts.limit ?? 25);
  if (opts.all) {
    const r = await db.execute({
      sql: `SELECT id, pack, question, row_count, duration_ms, created_at FROM ask_history ORDER BY created_at DESC LIMIT ?`,
      args: [limit],
    });
    return (r.rows as Record<string, unknown>[]).map(toItem);
  }
  const r = await db.execute({
    sql: `SELECT id, pack, question, row_count, duration_ms, created_at FROM ask_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    args: [opts.userId, limit],
  });
  return (r.rows as Record<string, unknown>[]).map(toItem);
}

export interface LandingStats {
  questions: number;
  dataRows: number;
  medianMs: number;
}

/** Живые счётчики витрины (НЕ нули). */
export async function landingStats(): Promise<LandingStats> {
  const db = await getDb();
  const q = await db.execute("SELECT COUNT(*) AS n FROM ask_history");
  const questions = Number((q.rows[0] as Record<string, unknown>).n);

  let dataRows = 0;
  for (const t of ["auto_sales", "retail_sales", "bank_facts"]) {
    try {
      const r = await db.execute(`SELECT COUNT(*) AS n FROM ${t}`);
      dataRows += Number((r.rows[0] as Record<string, unknown>).n);
    } catch {
      /* таблицы может не быть */
    }
  }

  const durs = await db.execute(
    "SELECT duration_ms FROM ask_history WHERE duration_ms IS NOT NULL ORDER BY duration_ms",
  );
  const values = (durs.rows as Record<string, unknown>[]).map((r) => Number(r.duration_ms));
  const medianMs = values.length ? values[Math.floor(values.length / 2)] : 0;

  return { questions, dataRows, medianMs };
}
