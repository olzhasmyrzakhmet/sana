import { getDb } from "../data/db";
import type { CompiledQuery } from "./compiler";

export type Row = Record<string, string | number | null>;

export interface RunResult {
  rows: Row[];
  rowCount: number;
  durationMs: number;
  compareRows?: Row[];
}

function coerce(v: unknown): string | number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number" || typeof v === "string") return v;
  return String(v);
}

function normalize(res: { columns: string[]; rows: unknown[] }): Row[] {
  return (res.rows as Array<Record<string, unknown>>).map((r) => {
    const obj: Row = {};
    for (const c of res.columns) obj[c] = coerce(r[c]);
    return obj;
  });
}

export async function run(compiled: CompiledQuery): Promise<RunResult> {
  const db = await getDb();
  const t0 = Date.now();
  const res = await db.execute({ sql: compiled.sql, args: compiled.args });
  let compareRows: Row[] | undefined;
  if (compiled.compareSql) {
    const cr = await db.execute({
      sql: compiled.compareSql,
      args: compiled.compareArgs ?? [],
    });
    compareRows = normalize({ columns: cr.columns as string[], rows: cr.rows });
  }
  const rows = normalize({ columns: res.columns as string[], rows: res.rows });
  return {
    rows,
    rowCount: rows.length,
    durationMs: Date.now() - t0,
    compareRows,
  };
}
