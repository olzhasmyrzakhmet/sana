"use client";
import { useState, useCallback } from "react";
import { Sparkles } from "lucide-react";
import type { AskResponse, ClientPackMeta, FeedItem } from "@/components/ask/types";
import { AskBar } from "@/components/ask/AskBar";
import { AnswerCard } from "@/components/ask/AnswerCard";
import { apiPost } from "@/lib/apiClient";

let c = 0;

export function EmbedWidget({ pack }: { pack: ClientPackMeta }) {
  const [feed, setFeed] = useState<FeedItem[]>([]);

  const ask = useCallback(
    async (question: string) => {
      const id = `e${++c}`;
      setFeed((f) => [{ id, question, pack: pack.id, status: "loading" }, ...f]);
      try {
        const resp = await apiPost<AskResponse>("/api/ask", { question, pack: pack.id });
        setFeed((f) => f.map((it) => (it.id === id ? { ...it, status: "done", response: resp } : it)));
      } catch (e) {
        setFeed((f) =>
          f.map((it) => (it.id === id ? { ...it, status: "error", error: e instanceof Error ? e.message : "Ошибка" } : it)),
        );
      }
    },
    [pack.id],
  );

  return (
    <div className="sana-light flex min-h-screen flex-col bg-background text-foreground">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="h-4 w-4 text-[var(--data)]" />
        <span className="text-sm font-semibold">SANA</span>
        <span className="text-xs text-muted-foreground">· {pack.title}</span>
      </div>
      <div className="flex-1 space-y-4 overflow-auto p-4">
        <AskBar pack={pack} onSubmit={ask} />
        {feed.map((item) => (
          <AnswerCard key={item.id} item={item} onFollow={ask} />
        ))}
      </div>
    </div>
  );
}
