"use client";
import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";

export function ConnectSnippet() {
  const [origin, setOrigin] = useState("https://sana.vercel.app");
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const code = `<script src="${origin}/widget.js" data-pack="auto"></script>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* игнор */
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-2 text-sm font-medium text-slate-700">Подключение — одна строка</div>
      <div className="flex items-center gap-2 overflow-x-auto rounded-md bg-slate-900 px-3 py-2">
        <code className="whitespace-nowrap text-xs text-slate-100">{code}</code>
        <button
          onClick={copy}
          className="ml-auto flex shrink-0 items-center gap-1 rounded bg-slate-700 px-2 py-1 text-xs text-slate-100 hover:bg-slate-600"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Скопировано" : "Копировать"}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Вставьте строку в любую страницу вашей BI — SANA появится плавающей кнопкой поверх, не трогая её код.
      </p>
    </div>
  );
}
