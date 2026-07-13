# Новый отраслевой пак за 30 минут

SANA — 3 отрасли (auto/retail/bank) на одном ядре. Новый пак = один файл-описание + сид. Ядро
(планировщик, компилятор, графики, RBAC, UI) не трогается.

## Шаги
1. **Скопировать файл пака.** `cp lib/semantic/packs/auto.ts lib/semantic/packs/<industry>.ts`.
   Задать `id`, `title`, `factTable` (с алиасом), `joins` (whitelist), `timeField`.
2. **Метрики** (`metrics`): для каждой — `id`, `title` (ru/kk), `sqlExpr` (напр. `SUM(f.amount)`),
   `format` (money/number/percent), `goodDirection`. Только агрегаты из вашей fact-таблицы.
3. **Измерения** (`dimensions`): `id`, `title`, `sqlExpr` (напр. `br.region`), `kind`
   (`category`/`time`). Для времени — три готовых бакета month/quarter/year (скопировать).
4. **Синонимы** (`synonyms`): `canonicalId → [слова RU+KK]` — чем гуще, тем лучше резолвит
   резервный роутер. Обязательно покрыть каждую метрику/измерение.
5. **Подсказки** (`sampleQuestions`): ≥12 RU + ≥6 KK.
6. **RBAC**: `rbacDimension` (напр. `region`) — сервер будет фильтровать по scope роли.
7. **Регистрация**: добавить пак в `lib/semantic/registry.ts` (`PACKS`, `listPacks`, `PackId`).
8. **Схема + сид**: таблицы в `scripts/schema.mjs`; справочники и генерация фактов в
   `scripts/seed-data.mjs` + `scripts/seed-facts.mjs` (детерминированный PRNG). `npm run seed`.
9. **Проверка**: `npm run test` (mock-роутер обязан резолвить все sampleQuestions нового пака —
   добавьте пак в тест — тест уже итерирует по `listPacks()`), затем вопрос в `/app`.

## Что НЕ нужно менять
Планировщик, `compiler.ts`, `chartSelector.ts`, `deltas.ts`, `rbac.ts`, весь UI — они работают
с любым паком через семантический слой. PackSwitcher подхватит новый пак автоматически.

## На проде заказчика
Вместо генерации фактов — подключить fact-таблицу к его read-replica/OLAP: `factTable`, `joins`,
`sqlExpr` описывают его реальную схему. Данные остаются в контуре.
