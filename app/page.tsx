import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Database, Code2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-4">
          <Sparkles className="h-5 w-5 text-[var(--data)]" />
          <span className="font-semibold tracking-tight">SANA</span>
          <Link
            href="/login"
            className="ml-auto rounded-lg bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-[var(--primary-foreground)]"
          >
            Попробовать демо
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 py-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          AI-аналитик внутри вашей BI
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
          Спросите свои <span className="text-[var(--data)]">данные</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Вопрос на естественном языке → готовый график, деловой вывод и панель «как посчитано».
          Ответ по фактическим данным, а не угадывание.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)]"
          >
            Попробовать демо <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/legacy-bi"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground"
          >
            Встроить в вашу BI
          </Link>
        </div>

        <div className="mt-20 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          <Feature icon={<Code2 />} title="AI понимает вопрос">
            LLM переводит вопрос в строгий JSON-план по семантическому слою — без свободного SQL.
          </Feature>
          <Feature icon={<Database />} title="Считает база">
            Компилятор собирает SQL из whitelist-фрагментов, расчёт делает Turso. Цифры точные.
          </Feature>
          <Feature icon={<ShieldCheck />} title="Видно, как посчитано">
            План → SQL → строки → определения метрик. LLM не видит сырых данных. RBAC по ролям.
          </Feature>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-muted-foreground">
          SANA · «AI понимает вопрос — считает база — человек видит, как посчитано»
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-left">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--data)]/10 text-[var(--data)]">
        {icon}
      </div>
      <div className="mb-1 font-medium text-foreground">{title}</div>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
