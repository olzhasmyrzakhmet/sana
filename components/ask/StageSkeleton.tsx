"use client";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const STAGES = ["Понимаю вопрос", "Собираю запрос", "Считаю на данных", "Формулирую вывод"];

export function StageSkeleton() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => Math.min(a + 1, STAGES.length - 1)), 550);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2 text-sm text-[var(--data)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        SANA считает…
      </div>
      <div className="space-y-2">
        {STAGES.map((s, i) => (
          <div key={s} className="flex items-center gap-2 text-sm">
            {i < active ? (
              <Check className="h-4 w-4 text-[var(--pos)]" />
            ) : i === active ? (
              <Loader2 className="h-4 w-4 animate-spin text-[var(--data)]" />
            ) : (
              <span className="h-4 w-4 rounded-full border border-border" />
            )}
            <span className={i <= active ? "text-foreground" : "text-muted-foreground"}>{s}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 h-[180px] w-full animate-pulse rounded-lg bg-secondary/40" />
    </div>
  );
}
