"use client";
import type { Column, Row } from "./types";
import { formatValue } from "@/lib/format";

export function DataTable({ columns, rows }: { columns: Column[]; rows: Row[] }) {
  return (
    <div className="max-h-80 overflow-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-card">
          <tr className="border-b border-border">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-3 py-2 text-left font-medium text-muted-foreground ${c.kind === "metric" ? "text-right" : ""}`}
              >
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-3 py-1.5 ${c.kind === "metric" ? "tnum text-right text-foreground" : "text-muted-foreground"}`}
                >
                  {c.kind === "metric"
                    ? formatValue(Number(r[c.key]), c.format ?? "number")
                    : String(r[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
