# START HERE — запуск SANA-спринта (дедлайн завтра, действуйте сразу)

1. Создайте папку `sana`, скопируйте в неё содержимое кита: CLAUDE.md, PROMPT.txt, docs/,
   .claude/ (скрытая папка — не потеряйте).
2. `cd sana && claude` → вставьте целиком текст из PROMPT.txt → Shift+Tab (автопринятие правок).
3. **Ваши ручные действия (агент их делать не должен):**
   - Turso: `turso auth login` → `turso db create sana` → `turso db show sana --url` (это
     TURSO_DATABASE_URL) → `turso db tokens create sana` (это TURSO_AUTH_TOKEN).
   - Vercel: создаётся ОДИН проект `sana` (агент подскажет момент). В Settings → Environment
     Variables → **Production** добавьте: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN,
     ANTHROPIC_API_KEY (ваш ключ — тогда AI живой; без него агент включит резервный режим),
     AI_PROVIDER=anthropic (или mock, если ключа нет). Убедитесь, что НЕТ переменной
     DATABASE_URL и что скоуп именно Production.
   - После добавления напишите агенту «env готово» — он задеплоит и зафиксирует прод-домен.
4. Контрольные точки для вас (5 минут каждая): конец фазы 0 (health на проде зелёный), конец
   фазы 3 (воркспейс красивый на localhost), конец фазы 7 (prod-verify зелёный), фаза 8
   (презентация). Возвращение в чат: «Продолжай по docs/PLAN.md».
5. Перед подачей лично: репозиторий открывается в инкогнито; статус в форме — MVP; подача
   минимум за 3 часа до конца приёма 13.07.
