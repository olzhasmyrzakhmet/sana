# TODO / отклонения от SPEC (с причинами)

Ведётся по «железному правилу»: любое отклонение от стека/SPEC — строкой сюда с причиной.

## Отклонения стека (Фаза 0)
- **Next.js 16.2.10 вместо 15.** Причина: `create-next-app@latest` ставит 16 (текущий стабильный,
  App Router-совместим, React 19.2). API App Router идентичен требованиям SPEC. Риска для демо нет.
- **Tailwind v4 вместо v3.** Причина: дефолт нового create-next-app; shadcn/ui init прошёл на v4
  (registry `radix-nova`). Токены — в `app/globals.css` через `@theme`, кастомизация в фазе 3.
- **Recharts 2.15.4.** Причина: v2 стабилен и поддерживает React 19; v3 сменил API. Наши типы
  графиков (line/bar/donut/kpi) полностью покрыты v2. (Депрекейшн-warning при install — игнор.)
- **shadcn CLI v4.13 (radix base).** `-b` теперь = библиотека компонентов (radix|base), не цвет.

## Блокер окружения: Windows ARM64 → нет локального file: libSQL
- **Факт:** машина разработки — win32-arm64; нативный пакет `libsql` не имеет prebuilt
  `@libsql/win32-arm64-msvc`, поэтому `@libsql/client` с `file:local.db` падает
  `Cannot find module '@libsql/win32-arm64-msvc'`.
- **Решение (в духе железного правила #2, даже строже):** единый драйвер Turso и локально,
  и на проде. `lib/data/db.ts` выбирает web-клиент (`@libsql/client/web`, чистый fetch, без
  нативных бинарников) для `libsql://` URL — работает на win32-arm64 и на Vercel. Файловый
  SQLite не используется вовсе. «Правда только на проде» усилена: один диалект/драйвер.
- **Следствие:** локальная разработка требует кредов Turso РАНЬШЕ (не только на 0.7).
  Пока кредов нет — делаем всю чистую логику фазы 1 (semantic/plan/compiler/chart/deltas/mock,
  тесты — без БД). Задачи с БД (seed, runner-verify, health select 1) — как только креды придут.
- **Статус 0.2:** код клиента готов; runtime-проверка `select 1` отложена до кредов Turso.
