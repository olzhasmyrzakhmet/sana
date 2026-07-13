import { MessageSquare, Braces, Database, LineChart } from "lucide-react";

const STEPS = [
  {
    icon: MessageSquare,
    tag: "01 · вопрос",
    title: "Естественный язык",
    code: "«Выручка по месяцам\nза последний год?»",
  },
  {
    icon: Braces,
    tag: "02 · план",
    title: "Строгий JSON по модели",
    code: '{ intent: "trend",\n  metrics: ["revenue"],\n  time: last_n 12 мес }',
  },
  {
    icon: Database,
    tag: "03 · SQL",
    title: "Компилятор из whitelist",
    code: "SELECT strftime('%Y-%m',d),\n  SUM(s.revenue)\nFROM auto_sales …",
  },
  {
    icon: LineChart,
    tag: "04 · ответ",
    title: "График + вывод + дельты",
    code: "line-chart · итог 213 млрд ₸\n+7.2% · «как посчитано»",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto mt-28 w-full max-w-5xl">
      <div className="mb-2 text-center font-mono text-xs uppercase tracking-widest text-[var(--data)]">
        как это работает
      </div>
      <h2 className="mb-10 text-center text-2xl font-semibold text-foreground">
        AI понимает вопрос — считает база — видно, как посчитано
      </h2>
      <div className="grid gap-3 md:grid-cols-4">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.tag} className="relative rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--data)]/10 text-[var(--data)]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">{s.tag}</span>
              </div>
              <div className="mb-2 text-sm font-medium text-foreground">{s.title}</div>
              <pre className="tnum whitespace-pre-wrap rounded-md border border-border bg-background p-2 text-[11px] leading-relaxed text-muted-foreground">
                {s.code}
              </pre>
              {i < STEPS.length - 1 && (
                <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-border md:block">→</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
