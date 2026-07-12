"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, MapPin, LineChart, Loader2 } from "lucide-react";
import { apiPost } from "@/lib/apiClient";

const ROLES = [
  {
    email: "ceo@demo.kz",
    icon: Crown,
    title: "Войти как CEO",
    desc: "Видит все данные всех отраслей — полная картина компании.",
  },
  {
    email: "region@demo.kz",
    icon: MapPin,
    title: "Войти как директор региона",
    desc: "Тот же вопрос — данные только по региону Алматы. RBAC вживую.",
  },
  {
    email: "analyst@demo.kz",
    icon: LineChart,
    title: "Войти как аналитик",
    desc: "Видит вкладку SQL в «Как посчитано» и историю всех запросов команды.",
  },
];

export function LoginButtons() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function login(email: string, password = "demo123") {
    setLoading(email);
    setError(null);
    try {
      await apiPost("/api/auth/login", { email, password });
      router.push("/app");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось войти");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      {ROLES.map((r) => {
        const Icon = r.icon;
        return (
          <button
            key={r.email}
            onClick={() => login(r.email)}
            disabled={loading !== null}
            className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-[var(--data)] disabled:opacity-60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--data)]/10 text-[var(--data)]">
              {loading === r.email ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
            </span>
            <span className="min-w-0">
              <span className="block font-medium text-foreground">{r.title}</span>
              <span className="block text-xs text-muted-foreground">{r.desc}</span>
            </span>
          </button>
        );
      })}
      {error && <div className="text-center text-sm text-[var(--neg)]">{error}</div>}
      <p className="pt-1 text-center text-xs text-muted-foreground">
        Пароль всех демо-учёток: <span className="tnum">demo123</span> · вход в один клик, регистрация не нужна
      </p>
    </div>
  );
}
