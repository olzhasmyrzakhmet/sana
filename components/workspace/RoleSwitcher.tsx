"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { apiPost } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

const ROLES = [
  { email: "ceo@demo.kz", label: "CEO", role: "CEO" },
  { email: "region@demo.kz", label: "Регион", role: "REGION" },
  { email: "analyst@demo.kz", label: "Аналитик", role: "ANALYST" },
];

export function RoleSwitcher({ current }: { current: string }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function pick(email: string) {
    setBusy(email);
    try {
      await apiPost("/api/auth/login", { email, password: "demo123" });
      window.location.reload(); // пересобрать сессию на сервере → новая роль/RBAC
    } catch {
      setBusy(null);
    }
  }

  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5">
      <span className="px-2 text-[10px] uppercase tracking-wide text-muted-foreground">как:</span>
      {ROLES.map((r) => (
        <button
          key={r.email}
          disabled={busy !== null}
          onClick={() => pick(r.email)}
          title={`Войти как ${r.label} (без релогина)`}
          className={cn(
            "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            current === r.role
              ? "bg-[var(--data)]/15 text-[var(--data)]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {busy === r.email && <Loader2 className="h-3 w-3 animate-spin" />}
          {r.label}
        </button>
      ))}
    </div>
  );
}
