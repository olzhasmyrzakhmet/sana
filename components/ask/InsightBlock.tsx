"use client";
import { Sparkles, ArrowRight } from "lucide-react";

export function InsightBlock({
  insight,
}: {
  insight: { summary: string; bullets: string[]; nextCheck: string };
}) {
  if (!insight?.summary) return null;
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-4">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--data)]">
        <Sparkles className="h-3.5 w-3.5" />
        Вывод
      </div>
      <p className="text-sm leading-relaxed text-foreground">{insight.summary}</p>
      {insight.bullets.length > 0 && (
        <ul className="mt-2 space-y-1">
          {insight.bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--data)]" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {insight.nextCheck && (
        <div className="mt-3 flex items-start gap-1.5 border-t border-border pt-2 text-xs text-muted-foreground">
          <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{insight.nextCheck}</span>
        </div>
      )}
    </div>
  );
}
