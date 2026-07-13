"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, History as HistoryIcon, Sparkles, HelpCircle } from "lucide-react";
import { DemoTour } from "./DemoTour";
import type { AskResponse, ClientPackMeta, FeedItem, HistoryItem, PublicUser } from "@/components/ask/types";
import { AskBar } from "@/components/ask/AskBar";
import { AnswerCard } from "@/components/ask/AnswerCard";
import { PackSwitcher } from "@/components/shared/PackSwitcher";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { apiGet, apiPost } from "@/lib/apiClient";

let counter = 0;

export function Workspace({ user, packs }: { user: PublicUser; packs: ClientPackMeta[] }) {
  const [packId, setPackId] = useState<ClientPackMeta["id"]>("auto");
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tour, setTour] = useState(false);
  const pack = packs.find((p) => p.id === packId)!;
  const analyst = user.role === "ANALYST";

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("sana_tour_seen")) {
      setTour(true);
      localStorage.setItem("sana_tour_seen", "1");
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const r = await apiGet<{ items: HistoryItem[] }>("/api/history");
      setHistory(r.items ?? []);
    } catch {
      /* тихо */
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const ask = useCallback(
    async (question: string) => {
      const id = `q${++counter}`;
      const targetPack = packId;
      setFeed((f) => [{ id, question, pack: targetPack, status: "loading" }, ...f]);
      try {
        const resp = await apiPost<AskResponse>("/api/ask", { question, pack: targetPack });
        setFeed((f) => f.map((it) => (it.id === id ? { ...it, status: "done", response: resp } : it)));
        loadHistory();
      } catch (e) {
        setFeed((f) =>
          f.map((it) => (it.id === id ? { ...it, status: "error", error: e instanceof Error ? e.message : "Ошибка" } : it)),
        );
      }
    },
    [packId, loadHistory],
  );

  async function logout() {
    try {
      await apiPost("/api/auth/logout", {});
    } catch {
      /* игнор */
    }
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      {/* Шапка */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Sparkles className="h-5 w-5 text-[var(--data)]" />
            SANA
          </Link>
          <PackSwitcher packs={packs} current={packId} onChange={setPackId} />
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setTour(true)}
              title="Демо-тур"
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Тур
            </button>
            <RoleBadge user={user} />
            <button
              onClick={logout}
              title="Выйти"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_300px]">
        {/* Основная колонка */}
        <main className="min-w-0 space-y-6">
          <AskBar pack={pack} onSubmit={ask} />
          {feed.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Задайте вопрос на русском или казахском — SANA ответит графиком, выводом и покажет «как посчитано».
            </div>
          )}
          <div className="space-y-6">
            {feed.map((item) => (
              <AnswerCard key={item.id} item={item} analyst={analyst} onFollow={ask} />
            ))}
          </div>
        </main>

        {/* История */}
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
              <HistoryIcon className="h-3.5 w-3.5" />
              {analyst ? "Все запросы команды" : "История"}
            </div>
            <div className="max-h-[60vh] overflow-auto">
              {history.length === 0 && <div className="p-3 text-xs text-muted-foreground">Пока пусто</div>}
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    setPackId(h.pack as ClientPackMeta["id"]);
                    ask(h.question);
                  }}
                  className="block w-full border-b border-border/50 px-3 py-2 text-left text-xs transition-colors last:border-0 hover:bg-accent"
                >
                  <div className="truncate text-foreground">{h.question}</div>
                  <div className="tnum mt-0.5 text-[10px] text-muted-foreground">
                    {h.pack} · {h.rowCount.toLocaleString("ru-RU")} строк · {h.durationMs} мс
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <DemoTour open={tour} onClose={() => setTour(false)} />
    </div>
  );
}
