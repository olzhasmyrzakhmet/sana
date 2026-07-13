import Link from "next/link";
import { Sparkles, ArrowRight, Terminal } from "lucide-react";
import { landingStats } from "@/lib/data/history";
import { computeInsights } from "@/lib/engine/anomalies";
import { getLiveExample } from "@/lib/data/liveExample";
import { formatCompact } from "@/lib/format";
import { InsightShowcase, type ShowcaseInsight } from "@/components/landing/InsightShowcase";
import { LiveAnswer } from "@/components/landing/LiveAnswer";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SecurityBlock } from "@/components/landing/SecurityBlock";

export const dynamic = "force-dynamic";

export default async function Landing() {
  let stats: { questions: number; dataRows: number; medianMs: number } | null = null;
  let insights: ShowcaseInsight[] = [];
  let live = null;
  try {
    const s = await landingStats();
    if (s.questions > 0 && s.dataRows > 0) stats = s;
  } catch {}
  try {
    insights = (await computeInsights("auto")) as ShowcaseInsight[];
  } catch {}
  try {
    live = await getLiveExample();
  } catch {}

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Тонкая сетка-текстура (терминал) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 80% 50% at 50% 0%, black, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 50% at 50% 0%, black, transparent 75%)",
        }}
      />

      <header className="relative z-10 border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-4">
          <Sparkles className="h-5 w-5 text-[var(--data)]" />
          <span className="font-semibold tracking-tight">SANA</span>
          <span className="ml-1 hidden font-mono text-xs text-muted-foreground sm:inline">· AI-аналитик в BI</span>
          <Link
            href="/login"
            className="ml-auto rounded-lg bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-[var(--primary-foreground)]"
          >
            Попробовать демо
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4">
        {/* HERO: слева текст, справа живой ответ */}
        <section className="grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              <Terminal className="h-3.5 w-3.5 text-[var(--data)]" />
              не чат-бот рядом с BI — аналитик внутри неё
            </div>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Спросите свои <span className="text-[var(--data)]">данные</span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
              Вопрос на естественном языке → готовый график, деловой вывод и панель «как посчитано».
              Ответ по фактическим данным, а не угадывание.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-transform hover:scale-[1.02]"
              >
                Попробовать демо <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/legacy-bi"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Встроить в вашу BI
              </Link>
            </div>

            {stats && (
              <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
                <Counter value={stats.questions.toLocaleString("ru-RU")} label="вопросов" />
                <Counter value={formatCompact(stats.dataRows)} label="строк данных" />
                <Counter value={`${stats.medianMs} мс`} label="медиана" />
              </div>
            )}
          </div>

          <div className="sana-rise lg:pl-4">
            {live ? (
              <LiveAnswer ex={live} />
            ) : (
              <div className="rounded-xl border border-dashed border-border p-10 text-center font-mono text-sm text-muted-foreground">
                живой пример загрузится с прод-БД
              </div>
            )}
          </div>
        </section>

        <HowItWorks />
        <SecurityBlock />
        <InsightShowcase insights={insights} />

        {/* Embed CTA */}
        <section className="mx-auto mt-28 w-full max-w-5xl rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground">Встраивается поверх существующей BI</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Одна строка кода — и SANA живёт плавающей кнопкой поверх вашего корпоративного дашборда,
            не трогая его код.
          </p>
          <Link
            href="/legacy-bi"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[var(--data)]/40 px-5 py-2.5 text-sm font-medium text-[var(--data)] transition-colors hover:bg-[var(--data)]/10"
          >
            Посмотреть на «чужой» BI <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <footer className="relative z-10 mt-24 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center font-mono text-xs text-muted-foreground">
          SANA · «AI понимает вопрос — считает база — человек видит, как посчитано»
        </div>
      </footer>
    </div>
  );
}

function Counter({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-3">
      <div className="tnum text-xl font-semibold text-[var(--data)] sm:text-2xl">{value}</div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
