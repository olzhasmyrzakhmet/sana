"use client";
import { useEffect, useState } from "react";
import { MessageSquare, LineChart, ShieldCheck, Users, X, ArrowRight } from "lucide-react";

const STEPS = [
  { icon: MessageSquare, title: "Задайте вопрос", body: "Впишите вопрос или нажмите чип-подсказку — можно на русском и на казахском." },
  { icon: LineChart, title: "Получите ответ", body: "SANA подберёт график, посчитает KPI и напишет деловой вывод с дельтами." },
  { icon: ShieldCheck, title: "«Как посчитано»", body: "Разверните панель доверия: план → SQL → сколько строк → определения метрик. LLM не видит сырых данных." },
  { icon: Users, title: "Роли и отрасли", body: "Смените отраслевой пак сверху; войдите директором региона — те же вопросы дадут урезанные данные (RBAC)." },
];

export function DemoTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (open) setI(0);
  }, [open]);
  if (!open) return null;
  const s = STEPS[i];
  const Icon = s.icon;
  const last = i === STEPS.length - 1;
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="sana-rise w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--data)]">
            демо-тур · {i + 1}/{STEPS.length}
          </span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--data)]/10 text-[var(--data)]">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-[var(--data)]" : "w-1.5 bg-border"}`} />
            ))}
          </div>
          <button
            onClick={() => (last ? onClose() : setI(i + 1))}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
          >
            {last ? "Начать" : "Далее"}
            {!last && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
