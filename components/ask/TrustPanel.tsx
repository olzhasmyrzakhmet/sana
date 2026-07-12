"use client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ShieldCheck, Database, Code2, ListTree, Lock } from "lucide-react";
import type { AskOk } from "./types";

export function TrustPanel({ resp, analyst }: { resp: AskOk; analyst?: boolean }) {
  return (
    <Accordion type="single" collapsible defaultValue={analyst ? "trust" : undefined} className="rounded-lg border border-border bg-card">
      <AccordionItem value="trust" className="border-0">
        <AccordionTrigger className="px-4 py-2.5 text-sm hover:no-underline">
          <span className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-[var(--data)]" />
            Как посчитано
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-4 pb-4">
          {/* План человекочитаемо */}
          <Section icon={<ListTree className="h-3.5 w-3.5" />} label="План">
            <div className="text-sm text-foreground">{resp.planHuman}</div>
          </Section>

          {/* SQL */}
          <Section icon={<Code2 className="h-3.5 w-3.5" />} label="SQL (собран из whitelist-фрагментов)">
            <pre className="tnum overflow-x-auto rounded-md border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
              {resp.sql}
            </pre>
          </Section>

          {/* Обработано строк / мс */}
          <Section icon={<Database className="h-3.5 w-3.5" />} label="Данные">
            <div className="tnum text-sm text-foreground">
              Обработано {resp.rowCount.toLocaleString("ru-RU")} строк за {resp.durationMs} мс
            </div>
          </Section>

          {/* Определения метрик */}
          <Section icon={<ListTree className="h-3.5 w-3.5" />} label="Определения метрик">
            <div className="space-y-1">
              {resp.metricDefs.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center gap-x-2 text-xs">
                  <span className="text-foreground">{m.title}</span>
                  <code className="tnum rounded bg-background px-1.5 py-0.5 text-muted-foreground">{m.sqlExpr}</code>
                </div>
              ))}
            </div>
          </Section>

          {/* Слайдо-убийца возражений */}
          <div className="flex items-start gap-2 rounded-md border border-[var(--pos)]/30 bg-[var(--pos)]/5 p-3 text-xs">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--pos)]" />
            <span className="text-muted-foreground">
              <span className="text-foreground">LLM получил:</span> модель метрик и ваш вопрос.{" "}
              <span className="text-foreground">LLM НЕ получал</span> строки данных — расчёт сделала база.
            </span>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}
