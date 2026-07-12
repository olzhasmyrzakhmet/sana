# SPEC — техническая спецификация SANA «до запятых»

Всё здесь — обязательное. Нет в SPEC → выбирай простейшее, не нарушающее CLAUDE.md, фиксируй
строкой в TODO.md.

## §1. Структура репозитория
```
sana/
├─ app/
│  ├─ (public)/page.tsx            # Витрина/лендинг + авто-инсайты + живые счётчики
│  ├─ (public)/legacy-bi/page.tsx  # «Существующая BI» + embed-виджет поверх (W2)
│  ├─ login/page.tsx               # Кнопки демо-входа в один клик
│  ├─ app/page.tsx                 # Воркспейс: Ask-панель, лента ответов, история
│  ├─ embed/page.tsx               # Чистый режим виджета (для iframe/сниппета)
│  ├─ api/ask/route.ts             # ГЛАВНЫЙ эндпоинт (см. §6)
│  ├─ api/insights/route.ts        # авто-инсайты пака
│  ├─ api/history/route.ts         # история запросов (запись в Turso — прод-пруф записи!)
│  ├─ api/auth/*                   # login/logout/me (cookie-сессия, bcrypt)
│  └─ api/health/db/route.ts       # adapter, счётчики — диагностика с первого дня
├─ components/
│  ├─ ask/ (AskBar, AnswerCard, ChartAuto, KpiRow, InsightBlock, TrustPanel, FollowUps)
│  ├─ widget/ (SanaWidget — плавающая кнопка+панель, самодостаточный)
│  └─ ui/ (shadcn) · shared/ (RoleBadge, PackSwitcher, LangHint, EmptyState)
├─ lib/
│  ├─ semantic/ (types.ts, packs/auto.ts, packs/retail.ts, packs/bank.ts, registry.ts)
│  ├─ engine/ (planSchema.ts(zod), compiler.ts, runner.ts, chartSelector.ts, deltas.ts, anomalies.ts)
│  ├─ ai/ (provider.ts, prompts.ts, anthropic.ts, mock.ts)
│  ├─ data/ (db.ts — libSQL клиент, queries.ts, history.ts, users.ts)
│  └─ auth.ts
├─ scripts/ (seed.mjs, prod-verify.mjs, db-deploy.mjs)
├─ tests/ (compiler.test.ts, planSchema.test.ts, chartSelector.test.ts, rbac.test.ts, mockRouter.test.ts)
├─ docs/ (ARCHITECTURE.md, PITCH.md, DEMO_SCRIPT.md, ADD_NEW_PACK.md)
└─ .env.example  # TURSO_DATABASE_URL=, TURSO_AUTH_TOKEN=, AI_PROVIDER=mock, ANTHROPIC_API_KEY=, AI_MODEL=claude-sonnet-4-6
```

## §2. Дизайн-направление (прогнать через скилл ui-ux-pro-max / frontend-design ДО вёрстки)
Характер: **серьёзный аналитический терминал, не стартап-неон**. Тёмная тема — основная
(данные любят тёмное): фон #0B0F0E→#101614, поверхность-карточки #151C1A, текст #E8EDEB.
Акценты: электрик-циан #22D3EE (данные/линии) + лайм #A3E635 (положительные дельты),
крас #F87171 (отрицательные). Плотная сетка, моноширинный для чисел (tabular-nums), тонкие
1px-границы, никаких радужных градиентов. Светлая тема — только для embed-виджета (он живёт
поверх чужих светлых BI). Микродетали: скелетоны при расчёте («SANA считает…» с этапами:
понимаю вопрос → собираю запрос → считаю → формулирую), плавное появление графика. Компоненты
из 21st.dev MCP допустимы, если вписываются в эту систему. Лендинг: тёмный hero, живой
интерактивный пример ответа прямо на первом экране (предзагруженный, не заглушка).

## §3. Turso-схема (миграция SQL; аналитика + приложение в одной БД)
Приложение: users(id, email, password_hash, name, role TEXT CHECK in('CEO','REGION','ANALYST'),
scope_json), sessions(опц. — можно cookie+HMAC без таблицы), ask_history(id, user_id, pack,
question, plan_json, sql_text, row_count, duration_ms, created_at), audit_log(id, user_id,
action, meta_json, created_at), insights_cache(pack, payload_json, computed_at).
AUTO: dealers(id, name, city, region), models(id, brand, model, segment, price_class),
auto_sales(id, d DATE, dealer_id, model_id, qty, revenue, discount_pct, channel, manager),
auto_inventory(d, dealer_id, model_id, stock_qty), service_orders(id, d, dealer_id, model_id,
type, revenue, nps).
RETAIL: stores, categories, retail_sales(d, store_id, category_id, qty, revenue, returns_qty).
BANK: branches, bank_products, bank_facts(d, branch_id, product_id, issued_amount, balance).
Индексы по датам и FK. Seed идемпотентен (DELETE+INSERT для фактов, upsert для справочников),
детерминированный PRNG (seed=42), сезонность + 3 заложенные аномалии в AUTO (BRIEF §4).

## §4. Semantic Layer (lib/semantic/types.ts) — сердце №1
```ts
export interface Pack {
  id: 'auto'|'retail'|'bank'; title: LString; factTable: string;
  joins: { table: string; on: string }[];                   // whitelist join-фрагментов
  timeField: string;                                        // напр. 's.d'
  metrics: Record<string, Metric>; dimensions: Record<string, Dimension>;
  synonyms: Record<string, string[]>;                       // «выручка»→revenue, «продажи»→units…
  sampleQuestions: { ru: string; kk?: string }[];           // ≥12 RU + ≥6 KK на пак
  rbacDimension?: string;                                   // 'region' для scope-фильтра
}
export interface Metric { id: string; title: LString; sqlExpr: string;  // 'SUM(s.revenue)'
  format: 'money'|'number'|'percent'; goodDirection?: 'up'|'down' }
export interface Dimension { id: string; title: LString; sqlExpr: string; // 'dl.region'
  kind: 'category'|'time'; grains?: ('day'|'month'|'quarter'|'year')[] }
```
AUTO-метрики (минимум): revenue, units(SUM qty), avg_discount(AVG discount_pct, %),
avg_check(revenue/units), service_revenue, nps_avg, stock_units. Измерения: month/quarter/year
(time), dealer, region, city, brand, model, segment, channel, manager. Синонимы прописать густо
(рус+каз базовые: «выручка/түсім», «продажи/сатылым», «дилер», «скидка/жеңілдік»…).

## §5. План запроса (lib/engine/planSchema.ts) — сердце №2
```ts
const PlanSchema = z.object({
  intent: z.enum(['kpi','trend','topn','breakdown','compare','table']),
  metrics: z.array(z.string()).min(1).max(3),      // только id из пака
  dimensions: z.array(z.string()).max(2),
  filters: z.array(z.object({ dim: z.string(), op: z.enum(['=','!=','in','>','<','between']),
    value: z.union([z.string(), z.number(), z.array(z.any())]) })).max(5),
  time: z.object({ mode: z.enum(['last_n','range','all']), n: z.number().optional(),
    unit: z.enum(['day','month','quarter','year']).optional(),
    from: z.string().optional(), to: z.string().optional(),
    grain: z.enum(['day','month','quarter','year']).default('month') }),
  compare: z.enum(['prev_period','yoy','none']).default('none'),
  sort: z.object({ by: z.string(), dir: z.enum(['asc','desc']) }).optional(),
  limit: z.number().max(50).default(12),
  clarify: z.string().nullable().default(null)     // если вопрос неоднозначен — уточнение вместо угадывания
});
```
Валидация ссылок: каждый metric/dimension/filter.dim обязан существовать в паке — иначе 422 с
понятным сообщением (и это тест).

## §6. Пайплайн /api/ask — сердце №3
Вход: `{question, pack}` + user из сессии. Шаги:
1. `planFromQuestion(question, packManifest)` через AI-адаптер → JSON → zod → repair-цикл
   (1 повтор с текстом ошибки) → при повторном фейле: mock-роутер; если и он мимо —
   вернуть `clarify` с 3 подсказками из sampleQuestions (НИКОГДА не 500).
2. RBAC: если user.scope и pack.rbacDimension — принудительно добавить фильтр в план
   (сервером, не LLM). Пометить ответ `scoped: true`.
3. `compileSql(plan, pack)`: SELECT из whitelist sqlExpr, JOIN'ы только из pack.joins,
   параметризованные значения, LIMIT жёстко ≤50, ЗАПРЕЩЕНО интерполировать строки пользователя
   в SQL. Плюс при compare — второй запрос за предыдущий период.
4. `run(sql)` по libSQL → rows (+duration).
5. `deltas.ts`: детерминированно посчитать итог, дельту к сравнимому периоду, топ-вклад.
6. `chartSelector(plan, rows)`: kpi→KpiRow; trend→line (x=time); topn/breakdown: ≤8 категорий и
   1 метрика → bar horizontal, доля от целого → donut; 2 измерения → stacked bar; всегда
   fallback-таблица. Форматирование ₸ с разрядами, tabular-nums.
7. `insight(question, plan, aggregates)` через AI: 2–4 предложения + до 3 буллетов, СТРОГО из
   переданных чисел (числа в промпте уже посчитаны), тон делового аналитика, без воды.
8. `followups`: 3 подсказки (AI или шаблоны от intent).
9. Записать ask_history + audit_log (это прод-пруф записи в БД!). Ответ:
   `{plan, sql, rows, rowCount, durationMs, chart, kpis, deltas, insight, followups, scoped, engine:'anthropic'|'fallback'}`.

## §7. AI-промпты (lib/ai/prompts.ts — дословно, RU)
**PLAN (system):** «Ты — планировщик аналитических запросов SANA. Дана семантическая модель
(метрики, измерения, синонимы) в JSON: {manifest}. Переведи вопрос пользователя в JSON-план
строго по схеме: {schema}. Правила: 1) только валидный JSON без markdown; 2) используй ТОЛЬКО
id из модели; 3) вопрос может быть на русском или казахском; 4) относительные периоды
(«за последний год», «в марте») переводи в time; 5) если вопрос неоднозначен или вне модели —
верни clarify с коротким уточнением по-русски и пустыми metrics; 6) не выдумывай фильтры,
которых нет в вопросе.» (user) = вопрос.
**INSIGHT (system):** «Ты — краткий бизнес-аналитик. По вопросу и уже ПОСЧИТАННЫМ числам
(итог, дельты, топ-вклады) напиши вывод: 2–4 предложения + до 3 буллетов. Только факты из
переданных чисел, ничего не изобретай. Тон деловой, по-русски (или по-казахски, если вопрос был
на казахском). Заверши одной фразой «что стоит проверить дальше». Верни JSON
{"summary","bullets":[],"nextCheck"}.»
**FOLLOWUPS (system):** «Предложи 3 следующих аналитических вопроса по-русски к этому плану и
результату, каждый ≤60 символов, JSON {"items":[]}. Только вопросы, отвечаемые моделью {manifest_ids}.»
**mock.ts:** роутер по ключевым словам/синонимам: ≥18 канонических вопросов на пак (RU) + ≥6 KK
→ готовые планы; insight в mock-режиме собирается шаблонами из deltas (детерминированно).
Юнит-тест: каждый sampleQuestion пака резолвится mock-роутером в валидный план.

## §8. Страницы
**/** Витрина: тёмный hero «Спросите свои данные», живой пример ответа (предрендеренный реальный),
3 счётчика из БД (вопросов обработано — из ask_history сида, строк данных, мс медианный ответ —
НЕ нули), карточка «SANA заметила» (3 авто-инсайта AUTO с мини-графиками), блок «Как это работает»
(вопрос → план → SQL → ответ, 4 шага), блок безопасности (LLM не видит сырых данных; RBAC; контур),
CTA «Попробовать демо» + «Встроить в вашу BI». Демо-тур кнопкой (W6).
**/login** — 3 большие кнопки ролей (описание, что увидит каждая) + мелкая форма email/пароль.
**/app** Воркспейс: сверху PackSwitcher (Авто·Ритейл·Банк) + RoleBadge (+плашка scope у REGION);
AskBar с плейсхолдером-примерами и чипами подсказок (sampleQuestions, вкл. казахские);
лента AnswerCard (вопрос, KpiRow/график, InsightBlock, TrustPanel-аккордеон «Как посчитано»:
план человеко-читаемо → SQL (у ANALYST разворачивается по умолчанию) → «обработано N строк за
M мс» → определения использованных метрик; FollowUps-чипы; кнопка «Экспорт PNG» (W5));
справа/снизу История (из ask_history, клик = повторить).
**/legacy-bi** «Корпоративная BI» (нарочито типовой светлый дашборд со статичными графиками
Recharts + логотип «Kaz-Analytics BI», выглядит как чужой продукт) + плавающая кнопка SANA
внизу справа → панель виджета; под дашбордом блок «Подключение: одна строка» со сниппетом
`<script src="https://<домен>/widget.js" data-pack="auto"></script>` (widget.js реально отдаётся
и монтирует iframe /embed — минимальная честная реализация).
**/embed** — компактный светлый режим AskBar+AnswerCard без шапки (для iframe).
Каждый сегмент — error.tsx. Мобильная адаптивность: / и /app обязаны жить на 375px.

## §9. RBAC и безопасность (требование №7 — доказываем, не рассказываем)
Роли из BRIEF §5. REGION.scope={region:'Алматы'} → сервер добавляет фильтр в план до компиляции.
В UI у scoped-ответа плашка «Данные ограничены вашей ролью: регион Алматы». AuditLog пишет
каждый /api/ask. В TrustPanel строка «LLM получил: модель метрик и ваш вопрос. LLM НЕ получал:
строки данных» — это слайдо-убийца возражений. ANALYST видит вкладку «Все запросы команды».

## §10. Авто-инсайты (lib/engine/anomalies.ts, W3)
Детерминированно: по AUTO помесячно на метриках units/revenue/avg_discount считаем z-score
последних точек по каждому дилеру/бренду; |z|>2 → кандидат; топ-3 → LLM (или шаблон) формулирует
заголовок+1 предложение; кешируем в insights_cache при seed. Никакой магии — воспроизводимо.

## §11. prod-verify (scripts/prod-verify.mjs — создать в фазе 0, шаблон)
Проверки (BASE = точный прод-домен, зафиксированный в фазе 0):
1) GET / → 200, содержит «Спросите» и НЕ содержит нулевых счётчиков («0 вопросов»);
2) POST /api/auth/login (ceo) → 200; 3) POST /api/ask {question:'Какая выручка по месяцам за
последний год?', pack:'auto'} → 200, rows>0, chart.type='line', insight.summary непустой,
sql содержит SUM — и это ЗАПИСАЛО ask_history (проверка записи: GET /api/history содержит вопрос);
4) POST /api/ask на казахском → 200, rows>0; 5) login region → тот же topn-вопрос → scoped=true и
регионов в ответе ровно 1; 6) POST /api/ask {pack:'retail'} → 200 (второй пак живой);
7) GET /legacy-bi → 200, содержит 'widget'; GET /embed → 200; 8) GET /api/insights?pack=auto →
3 элемента; 9) невалидный вопрос («приготовь плов») → 200 с clarify, НЕ 500.
Выход: таблица ✅/❌, exit 1 при любом фейле. Формат и стиль — как в прошлом проекте.

## §12. Тесты (Vitest, ≥25)
compiler: whitelist (метрика вне пака → ошибка), инъекция в filter.value не попадает в SQL-текст
(параметризация), compare строит второй период корректно; planSchema: битые планы падают;
chartSelector: 6 форм → 6 типов; rbac: scope добавляет фильтр всегда; mockRouter: все
sampleQuestions резолвятся; deltas: эталонные числа.

## §13. Что показывает ARCHITECTURE.md
Mermaid: Виджет/Воркспейс → /api/ask → [AI-план (Anthropic|on-prem-ready)] → zod → Compiler
(whitelist) → Turso → Deltas → ChartSelector → Insight. Разделы: почему LLM не пишет SQL;
данные в контуре; путь к проду (подключение к витрине заказчика: реализовать Pack по его схеме,
источник — read-replica/OLAP, self-host). ADD_NEW_PACK.md: новый отраслевой пак за 30 минут
(скопировать файл пака, описать метрики/измерения/синонимы, сид).
