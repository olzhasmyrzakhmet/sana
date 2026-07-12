"use client";
import { AlertTriangle, RotateCw } from "lucide-react";

export function ErrorState({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--neg)]/10 text-[var(--neg)]">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div>
        <div className="font-medium text-foreground">Что-то пошло не так</div>
        <div className="mt-1 max-w-md text-sm text-muted-foreground">{error.message || "Неизвестная ошибка"}</div>
      </div>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
      >
        <RotateCw className="h-4 w-4" />
        Повторить
      </button>
    </div>
  );
}
