"use client";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ChartAuto } from "@/components/ask/ChartAuto";
import type { AskOk } from "@/components/ask/types";
import type { LiveExample } from "@/lib/data/liveExample";
import { formatDeltaPct } from "@/lib/format";

export function LiveAnswer({ ex }: { ex: LiveExample }) {
  // Собираем AskOk-совместимый объект для ChartAuto (реальные строки из Turso).
  const resp = {
    chart: ex.chart,
    rows: ex.rows,
    metricDefs: ex.metricDefs,
    table: { columns: [], rows: ex.rows },
  } as unknown as AskOk;

  const primary = ex.kpis[0];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/40">
      {/* Терминальная шапка */}
      <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--neg)]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-4)]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--pos)]/70" />
        <span className="ml-2 font-mono text-[11px] text-muted-foreground">sana://workspace · пак auto</span>
        <span className="tnum ml-auto text-[11px] text-muted-foreground">{ex.durationMs} мс</span>
      </div>

      <div className="space-y-4 p-4">
        {/* Строка вопроса */}
        <div className="flex items-start gap-2">
          <span className="mt-0.5 font-mono text-sm text-[var(--data)]">›</span>
          <span className="text-sm text-foreground">{ex.question}</span>
        </div>

        {/* KPI + дельта */}
        {primary && (
          <div className="flex items-end justify-between rounded-lg border border-border bg-background/60 px-4 py-3">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{primary.title}</div>
              <div className="tnum mt-0.5 text-3xl font-semibold text-foreground">{primary.value}</div>
            </div>
            {primary.deltaPct !== null && primary.direction && (
              <span
                className={`inline-flex items-center gap-0.5 text-sm font-medium tnum ${
                  primary.good ? "text-[var(--pos)]" : "text-[var(--neg)]"
                }`}
              >
                {primary.direction === "up" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {formatDeltaPct(primary.deltaPct)}
              </span>
            )}
          </div>
        )}

        {/* Реальный график */}
        <ChartAuto resp={resp} />

        {/* Вывод */}
        <p className="border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">
          {ex.insightSummary}
        </p>

        {/* Мета «как посчитано» */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
          <span className="text-[var(--data)]">план→SQL→база</span>
          <span className="tnum">· {ex.rowCount.toLocaleString("ru-RU")} строк обработано</span>
          <span>· LLM не видел сырых данных</span>
        </div>
      </div>
    </div>
  );
}
