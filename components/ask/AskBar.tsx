"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import type { ClientPackMeta } from "./types";

export function AskBar({
  pack,
  onSubmit,
  disabled,
}: {
  pack: ClientPackMeta;
  onSubmit: (q: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  function submit(q?: string) {
    const text = (q ?? value).trim();
    if (!text || disabled) return;
    onSubmit(text);
    setValue("");
  }

  // Подсказки: несколько RU + один-два казахских (демонстрируем язык).
  const chips: string[] = [];
  for (const s of pack.sampleQuestions) {
    if (chips.length >= 6) break;
    chips.push(s.ru);
  }
  const kk = pack.sampleQuestions.find((s) => s.kk)?.kk;
  if (kk) chips.push(kk);

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-2 focus-within:border-[var(--data)]">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Спросите свои данные… напр. «Какая выручка по месяцам за последний год?»"
          className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={() => submit()}
          disabled={disabled || !value.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] transition-opacity disabled:opacity-40"
          title="Спросить (Enter)"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((c, i) => (
          <button
            key={i}
            onClick={() => submit(c)}
            disabled={disabled}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-[var(--data)] hover:text-foreground disabled:opacity-40"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
