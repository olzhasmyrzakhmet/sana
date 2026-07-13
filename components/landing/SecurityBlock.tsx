import { Lock, ShieldCheck, ServerCog, ScrollText, Check, X } from "lucide-react";

export function SecurityBlock() {
  return (
    <section className="mx-auto mt-28 w-full max-w-5xl">
      <div className="mb-2 text-center font-mono text-xs uppercase tracking-widest text-[var(--data)]">
        безопасность корпоративного уровня
      </div>
      <h2 className="mb-10 text-center text-2xl font-semibold text-foreground">
        Галлюцинации закрыты архитектурой, а не обещанием
      </h2>

      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        {/* Что видит LLM — слайдо-убийца */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
            <Lock className="h-4 w-4 text-[var(--data)]" />
            Что получает языковая модель
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--pos)]/30 bg-[var(--pos)]/5 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--pos)]">
                <Check className="h-3.5 w-3.5" /> LLM получает
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>· модель метрик (id, названия)</li>
                <li>· текст вашего вопроса</li>
                <li>· уже посчитанные агрегаты для вывода</li>
              </ul>
            </div>
            <div className="rounded-lg border border-[var(--neg)]/30 bg-[var(--neg)]/5 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--neg)]">
                <X className="h-3.5 w-3.5" /> LLM НЕ получает
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>· сырые строки данных</li>
                <li>· право писать исполняемый SQL</li>
                <li>· доступ в обход RBAC</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Три столпа */}
        <div className="grid gap-3">
          <Pillar icon={ShieldCheck} title="RBAC со scope">
            CEO видит всё, директор региона — только свой регион. Фильтр ставит сервер, вопрос его не обходит.
          </Pillar>
          <Pillar icon={ScrollText} title="AuditLog">
            Каждый запрос пишется в журнал: кто, что, сколько строк.
          </Pillar>
          <Pillar icon={ServerCog} title="Данные в контуре">
            Расчёт в вашей БД (self-host ready), AI-адаптер on-prem-ready.
          </Pillar>
        </div>
      </div>
    </section>
  );
}

function Pillar({ icon: Icon, title, children }: { icon: typeof Lock; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--data)]/10 text-[var(--data)]">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <div className="text-sm font-medium text-foreground">{title}</div>
        <p className="mt-0.5 text-xs text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
