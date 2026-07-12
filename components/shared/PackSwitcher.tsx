"use client";
import { Car, ShoppingCart, Landmark } from "lucide-react";
import type { ClientPackMeta } from "@/components/ask/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Car> = { auto: Car, retail: ShoppingCart, bank: Landmark };

export function PackSwitcher({
  packs,
  current,
  onChange,
}: {
  packs: ClientPackMeta[];
  current: string;
  onChange: (id: ClientPackMeta["id"]) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
      {packs.map((p) => {
        const Icon = ICONS[p.id] ?? Car;
        const active = p.id === current;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-[var(--data)]/15 text-[var(--data)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {p.title}
          </button>
        );
      })}
    </div>
  );
}
