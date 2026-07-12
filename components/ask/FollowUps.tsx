"use client";
import { CornerDownRight } from "lucide-react";

export function FollowUps({ items, onPick }: { items: string[]; onPick: (q: string) => void }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <CornerDownRight className="h-3.5 w-3.5" />
        Дальше:
      </span>
      {items.map((q, i) => (
        <button
          key={i}
          onClick={() => onPick(q)}
          className="rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground transition-colors hover:border-[var(--data)] hover:text-[var(--data)]"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
