"use client";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { AlertTriangle } from "lucide-react";

export interface ShowcaseInsight {
  id: string;
  title: string;
  detail: string;
  series: { label: string; value: number }[];
}

export function InsightShowcase({ insights }: { insights: ShowcaseInsight[] }) {
  if (!insights.length) return null;
  return (
    <section className="mx-auto mt-24 w-full max-w-5xl">
      <div className="mb-4 flex items-center justify-center gap-2 text-sm text-[var(--data)]">
        <AlertTriangle className="h-4 w-4" />
        SANA заметила: {insights.length} аномалии за период
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {insights.map((ins) => (
          <div key={ins.id} className="rounded-xl border border-border bg-card p-4 text-left">
            <div className="h-12 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ins.series}>
                  <Line type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-sm font-medium text-foreground">{ins.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{ins.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
