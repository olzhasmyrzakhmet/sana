"use client";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { Kpi } from "./types";
import { formatDeltaPct } from "@/lib/format";
import { cn } from "@/lib/utils";

export function KpiRow({ kpis }: { kpis: Kpi[] }) {
  if (!kpis.length) return null;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {kpis.map((k, i) => (
        <div
          key={k.id}
          className={cn(
            "rounded-lg border border-border bg-card px-4 py-3",
            i === 0 && "sm:col-span-1",
          )}
        >
          <div className="text-xs text-muted-foreground">{k.title}</div>
          <div className="mt-1 flex items-end justify-between gap-2">
            <div className="tnum text-2xl font-semibold leading-none text-foreground">{k.value}</div>
            {k.deltaPct !== null && k.direction && (
              <DeltaChip pct={k.deltaPct} direction={k.direction} good={k.good} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DeltaChip({
  pct,
  direction,
  good,
}: {
  pct: number;
  direction: "up" | "down" | "flat";
  good: boolean | null;
}) {
  const color = good === null ? "text-muted-foreground" : good ? "text-[var(--pos)]" : "text-[var(--neg)]";
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium tnum", color)}>
      <Icon className="h-3.5 w-3.5" />
      {formatDeltaPct(pct)}
    </span>
  );
}
