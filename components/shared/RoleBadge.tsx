"use client";
import { Crown, MapPin, LineChart } from "lucide-react";
import type { PublicUser } from "@/components/ask/types";

const ROLE = {
  CEO: { label: "CEO", icon: Crown, desc: "видит все данные" },
  REGION: { label: "Директор региона", icon: MapPin, desc: "ограничен регионом" },
  ANALYST: { label: "Аналитик", icon: LineChart, desc: "видит SQL и все запросы" },
} as const;

export function RoleBadge({ user }: { user: PublicUser }) {
  const r = ROLE[user.role];
  const Icon = r.icon;
  const region = user.scope?.region as string | undefined;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
      <Icon className="h-4 w-4 text-[var(--data)]" />
      <div className="leading-tight">
        <div className="text-xs font-medium text-foreground">{r.label}</div>
        <div className="text-[10px] text-muted-foreground">
          {region ? `регион ${region}` : r.desc}
        </div>
      </div>
    </div>
  );
}
