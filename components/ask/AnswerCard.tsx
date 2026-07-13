"use client";
import { useRef, useState } from "react";
import { AlertTriangle, Table2, ImageDown, ShieldAlert } from "lucide-react";
import type { FeedItem, AskOk } from "./types";
import { isClarify } from "./types";
import { KpiRow } from "./KpiRow";
import { ChartAuto } from "./ChartAuto";
import { InsightBlock } from "./InsightBlock";
import { TrustPanel } from "./TrustPanel";
import { FollowUps } from "./FollowUps";
import { StageSkeleton } from "./StageSkeleton";
import { DataTable } from "./DataTable";

export function AnswerCard({
  item,
  analyst,
  onFollow,
}: {
  item: FeedItem;
  analyst?: boolean;
  onFollow: (q: string) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showTable, setShowTable] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function exportPng() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const url = await toPng(cardRef.current, { backgroundColor: "#0b0f0e", pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = url;
      a.download = `sana-${Date.now()}.png`;
      a.click();
    } finally {
      setExporting(false);
    }
  }

  return (
    <div ref={cardRef} className="sana-rise rounded-xl border border-border bg-card/60 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-base font-medium text-foreground">{item.question}</h3>
        {item.status === "done" && item.response && !isClarify(item.response) && (
          <button
            onClick={exportPng}
            disabled={exporting}
            title="Экспорт PNG"
            className="shrink-0 rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ImageDown className="h-4 w-4" />
          </button>
        )}
      </div>

      {item.status === "loading" && <StageSkeleton />}

      {item.status === "error" && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--neg)]/30 bg-[var(--neg)]/5 p-4 text-sm text-[var(--neg)]">
          <AlertTriangle className="h-4 w-4" />
          {item.error ?? "Не удалось получить ответ"}
        </div>
      )}

      {item.status === "done" && item.response && (
        isClarify(item.response) ? (
          <ClarifyBlock clarify={item.response.clarify} suggestions={item.response.suggestions} onFollow={onFollow} />
        ) : (
          <AnswerBody resp={item.response} analyst={analyst} showTable={showTable} setShowTable={setShowTable} onFollow={onFollow} />
        )
      )}
    </div>
  );
}

function AnswerBody({
  resp,
  analyst,
  showTable,
  setShowTable,
  onFollow,
}: {
  resp: AskOk;
  analyst?: boolean;
  showTable: boolean;
  setShowTable: (v: boolean) => void;
  onFollow: (q: string) => void;
}) {
  const hasChart = resp.chart.type !== "kpi" && resp.chart.type !== "table";
  return (
    <div className="space-y-4">
      {resp.scoped && resp.scopedRegion && (
        <div className="flex items-center gap-2 rounded-md border border-[var(--chart-4)]/30 bg-[var(--chart-4)]/5 px-3 py-2 text-xs text-[var(--chart-4)]">
          <ShieldAlert className="h-3.5 w-3.5" />
          Данные ограничены вашей ролью: регион {resp.scopedRegion}
        </div>
      )}

      <KpiRow kpis={resp.kpis} />
      {hasChart && <ChartAuto resp={resp} />}

      <div>
        <button
          onClick={() => setShowTable(!showTable)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Table2 className="h-3.5 w-3.5" />
          {showTable ? "Скрыть таблицу" : "Показать таблицу"}
        </button>
        {(showTable || resp.chart.type === "table") && (
          <div className="mt-2">
            <DataTable columns={resp.table.columns} rows={resp.table.rows} />
          </div>
        )}
      </div>

      <InsightBlock insight={resp.insight} />
      <TrustPanel resp={resp} analyst={analyst} />
      <FollowUps items={resp.followups} onPick={onFollow} />

      <div className="flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
        <span>посчитано SANA · {resp.rowCount.toLocaleString("ru-RU")} строк</span>
        <span>{resp.engine === "fallback" ? "резервный режим" : "AI-план"}</span>
      </div>
    </div>
  );
}

function ClarifyBlock({
  clarify,
  suggestions,
  onFollow,
}: {
  clarify: string;
  suggestions: string[];
  onFollow: (q: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-4">
      <p className="text-sm text-foreground">{clarify}</p>
      {suggestions?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onFollow(s)}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground transition-colors hover:border-[var(--data)] hover:text-[var(--data)]"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
