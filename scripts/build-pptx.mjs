// Сборка презентации SANA в .pptx (pptxgenjs, без python). node scripts/build-pptx.mjs
import pptxgen from "pptxgenjs";

const DARK = "0B0F0E", CARD = "141B19", FG = "E8EDEB", MUT = "8BA098";
const CYAN = "22D3EE", LIME = "A3E635", RED = "F87171", AMBER = "FBBF24", BORDER = "2A3A33";
const MONO = "Consolas";

const p = new pptxgen();
p.defineLayout({ name: "W", width: 13.333, height: 7.5 });
p.layout = "W";
p.author = "SANA";
p.title = "SANA — Спросите свои данные";

function slide(tag, n) {
  const s = p.addSlide();
  s.background = { color: DARK };
  s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 0.14, h: 7.5, fill: { color: CYAN } });
  if (tag) s.addText(tag.toUpperCase(), { x: 0.6, y: 0.4, w: 11, h: 0.3, fontSize: 11, color: CYAN, charSpacing: 3, fontFace: MONO });
  s.addText("✦ SANA", { x: 11.2, y: 0.4, w: 1.6, h: 0.3, fontSize: 11, color: MUT, align: "right", fontFace: MONO });
  if (n) s.addText(`${n} / 10`, { x: 11.2, y: 6.9, w: 1.6, h: 0.3, fontSize: 10, color: MUT, align: "right", fontFace: MONO });
  return s;
}
function card(s, x, y, w, h, fill = CARD) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: BORDER, width: 1 } });
}

// 1 ТИТУЛ
let s = slide("", 1);
s.addText("не чат-бот рядом с BI — аналитик внутри неё", { x: 0.6, y: 2.0, w: 11, h: 0.4, fontSize: 13, color: CYAN, fontFace: MONO });
s.addText([{ text: "Спросите свои ", options: { color: FG } }, { text: "данные", options: { color: CYAN } }], { x: 0.6, y: 2.5, w: 12, h: 1.4, fontSize: 60, bold: true });
s.addText("Ответ по данным за секунды — готовый график, деловой вывод и панель «как посчитано». Черновик решения, а не угадывание.", { x: 0.6, y: 4.0, w: 9.5, h: 1, fontSize: 18, color: MUT });
s.addText("sana-rho-ten.vercel.app   ·   демо-вход в один клик   ·   Kaz-analytics хакатон", { x: 0.6, y: 5.6, w: 12, h: 0.4, fontSize: 14, color: FG, fontFace: MONO });

// 2 ПРОБЛЕМА
s = slide("проблема", 2);
s.addText("BI купили все. Пользу извлекают 5%.", { x: 0.6, y: 1.1, w: 12, h: 0.8, fontSize: 34, bold: true, color: FG });
s.addText("Бизнес видит графики, но за ответом на вопрос идёт к аналитику и ждёт выгрузку.", { x: 0.6, y: 2.0, w: 11, h: 0.5, fontSize: 16, color: MUT });
const steps2 = [["Вопрос", "«Почему упали продажи?»", CYAN], ["→ Аналитик", "постановка, очередь", MUT], ["→ Выгрузка", "SQL, Excel, согласования", MUT], ["→ Дни", "решение опоздало", RED]];
steps2.forEach(([t, d, c], i) => {
  const x = 0.6 + i * 3.05;
  card(s, x, 3.2, 2.8, 2.2, i === 3 ? "1a1210" : CARD);
  s.addText(t, { x: x + 0.2, y: 3.5, w: 2.5, h: 0.4, fontSize: 18, bold: true, color: c });
  s.addText(d, { x: x + 0.2, y: 4.1, w: 2.5, h: 1, fontSize: 13, color: MUT });
});

// 3 РЕШЕНИЕ
s = slide("решение · 4 шага", 3);
s.addText("AI понимает вопрос — считает база — видно, как посчитано", { x: 0.6, y: 1.1, w: 12, h: 0.8, fontSize: 30, bold: true });
const steps3 = [["01 · вопрос", "«Выручка по месяцам\nза последний год?»"], ["02 · план", '{ intent: "trend",\n  metrics: ["revenue"] }'], ["03 · SQL", "SELECT strftime(...),\n SUM(s.revenue) …"], ["04 · ответ", "line-chart · 213 млрд ₸\n+7.2% · «как посчитано»"]];
steps3.forEach(([t, code], i) => {
  const x = 0.6 + i * 3.05;
  card(s, x, 2.5, 2.8, 3);
  s.addText(t, { x: x + 0.2, y: 2.7, w: 2.5, h: 0.4, fontSize: 13, color: CYAN, fontFace: MONO });
  s.addText(code, { x: x + 0.2, y: 3.3, w: 2.5, h: 2, fontSize: 12, color: MUT, fontFace: MONO });
});

// 4 ВОРКСПЕЙС + график
s = slide("воркспейс", 4);
s.addText("Вопрос → готовый ответ с графиком и выводом", { x: 0.6, y: 1.05, w: 12, h: 0.6, fontSize: 26, bold: true });
card(s, 0.6, 1.9, 7.2, 4.9);
s.addText("› Топ-5 дилеров по продажам в 2026", { x: 0.9, y: 2.1, w: 6.6, h: 0.4, fontSize: 14, color: CYAN, fontFace: MONO });
s.addChart(p.ChartType.bar, [{ name: "Продажи, шт", labels: ["Алматы-Центр", "Астана", "Шымкент", "Караганда", "Алматы-Север"], values: [3562, 2980, 2610, 2140, 1990] }], {
  x: 0.8, y: 2.6, w: 6.8, h: 4.0, barDir: "bar", chartColors: [CYAN], showLegend: false, showValue: true, dataLabelColor: FG, dataLabelFontSize: 9,
  catAxisLabelColor: MUT, valAxisLabelColor: MUT, catAxisLabelFontSize: 9, valAxisLabelFontSize: 9, valGridLine: { color: BORDER },
});
card(s, 8.0, 1.9, 4.8, 4.9);
s.addText("Вывод", { x: 8.3, y: 2.1, w: 4, h: 0.3, fontSize: 12, color: CYAN, fontFace: MONO });
s.addText("Лидирует SANA Motors Алматы-Центр — 3 562 шт (доля 24%). Разрыв со вторым дилером 20%.", { x: 8.3, y: 2.5, w: 4.2, h: 1.2, fontSize: 14, color: FG });
s.addText("• KPI + дельты\n• автоподбор графика\n• «Как посчитано» (план→SQL)\n• экспорт PNG · follow-ups", { x: 8.3, y: 4.0, w: 4.2, h: 2, fontSize: 13, color: MUT });

// 5 ЯДРО ДОВЕРИЯ
s = slide("ядро доверия", 5);
s.addText("LLM не пишет SQL и не видит строк", { x: 0.6, y: 1.1, w: 12, h: 0.7, fontSize: 30, bold: true });
card(s, 0.6, 2.2, 5.9, 3.2, "10201a");
s.addText("LLM ПОЛУЧАЕТ", { x: 0.9, y: 2.4, w: 5, h: 0.3, fontSize: 13, bold: true, color: LIME });
s.addText("• модель метрик (id, названия)\n• текст вашего вопроса\n• уже посчитанные агрегаты для вывода", { x: 0.9, y: 2.9, w: 5.4, h: 2, fontSize: 15, color: FG });
card(s, 6.9, 2.2, 5.9, 3.2, "1a1210");
s.addText("LLM НЕ ПОЛУЧАЕТ", { x: 7.2, y: 2.4, w: 5, h: 0.3, fontSize: 13, bold: true, color: RED });
s.addText("• сырые строки данных\n• право писать исполняемый SQL\n• доступ в обход RBAC", { x: 7.2, y: 2.9, w: 5.4, h: 2, fontSize: 15, color: FG });
s.addText("Semantic Layer — источник истины. Компилятор собирает SQL из whitelist-фрагментов, значения — параметрами. Галлюцинации закрыты архитектурой.", { x: 0.6, y: 5.7, w: 12, h: 0.8, fontSize: 15, color: MUT });

// 6 EMBED
s = slide("встраивание · требование №6", 6);
s.addText("Живёт поверх вашей существующей BI", { x: 0.6, y: 1.1, w: 12, h: 0.7, fontSize: 30, bold: true });
s.addText("Плавающая кнопка SANA поверх любого дашборда. Не трогаем ваш код, не мигрируем данные.", { x: 0.6, y: 2.0, w: 11, h: 0.5, fontSize: 16, color: MUT });
card(s, 0.6, 2.8, 6.2, 2.2, "0b0f0e");
s.addText('<script src="https://…/widget.js"\n        data-pack="auto"></script>', { x: 0.9, y: 3.2, w: 5.8, h: 1.4, fontSize: 17, color: CYAN, fontFace: MONO });
s.addText("одна строка", { x: 0.9, y: 4.5, w: 4, h: 0.3, fontSize: 12, color: MUT, fontFace: MONO });
card(s, 7.1, 2.8, 5.7, 3.2, "eef2f6");
s.addText("Kaz-Analytics BI", { x: 7.4, y: 3.0, w: 5, h: 0.3, fontSize: 14, bold: true, color: "2563EB" });
s.addShape(p.ShapeType.rect, { x: 7.4, y: 3.5, w: 5.1, h: 1.4, fill: { color: "e2e8f0" } });
s.addText("✦ Спросить SANA", { x: 10.4, y: 5.2, w: 2.2, h: 0.4, fontSize: 12, color: CYAN, fill: { color: DARK }, align: "center" });

// 7 БЕЗОПАСНОСТЬ + RBAC график
s = slide("безопасность · требование №7", 7);
s.addText("Один вопрос — разные данные по правам", { x: 0.6, y: 1.05, w: 12, h: 0.6, fontSize: 28, bold: true });
card(s, 0.6, 1.9, 6.2, 4.9);
s.addText("«Топ дилеров»: CEO vs Директор региона", { x: 0.9, y: 2.1, w: 5.8, h: 0.4, fontSize: 13, color: MUT, fontFace: MONO });
s.addChart(p.ChartType.bar, [{ name: "дилеров в ответе", labels: ["CEO (все регионы)", "Регион Алматы"], values: [12, 2] }], {
  x: 0.8, y: 2.6, w: 5.8, h: 4.0, barDir: "bar", chartColors: [CYAN, LIME], showValue: true, dataLabelColor: FG, showLegend: false,
  catAxisLabelColor: MUT, valAxisLabelColor: MUT, catAxisLabelFontSize: 11, valAxisLabelFontSize: 9, valGridLine: { color: BORDER },
});
const sec = [["RBAC со scope", "Фильтр ставит сервер после планирования — вопросом не обойти."], ["AuditLog", "Каждый запрос в журнал: кто, что, сколько строк."], ["Данные в контуре", "Расчёт в вашей БД (self-host), AI-адаптер on-prem-ready."]];
sec.forEach(([t, d], i) => {
  const y = 1.9 + i * 1.65;
  card(s, 7.1, y, 5.7, 1.45);
  s.addText(t, { x: 7.4, y: y + 0.15, w: 5.2, h: 0.35, fontSize: 16, bold: true, color: FG });
  s.addText(d, { x: 7.4, y: y + 0.6, w: 5.2, h: 0.7, fontSize: 12.5, color: MUT });
});

// 8 МУЛЬТИОТРАСЛЬ
s = slide("отраслевая настраиваемость · требование №5", 8);
s.addText("3 отрасли на одном ядре", { x: 0.6, y: 1.1, w: 12, h: 0.7, fontSize: 30, bold: true });
const packs = [["Авто", "дилеры · модели · продажи · скидки · сервис", "44 724 строки"], ["Ритейл", "магазины · категории · продажи · возвраты", "19 943 строки"], ["Банк", "филиалы · продукты · выдачи · остатки", "9 972 строки"]];
packs.forEach(([t, d, n], i) => {
  const x = 0.6 + i * 4.15;
  card(s, x, 2.4, 3.9, 2.6);
  s.addText(t, { x: x + 0.3, y: 2.7, w: 3.3, h: 0.5, fontSize: 22, bold: true, color: CYAN });
  s.addText(d, { x: x + 0.3, y: 3.4, w: 3.4, h: 1, fontSize: 13, color: MUT });
  s.addText(n, { x: x + 0.3, y: 4.4, w: 3.3, h: 0.4, fontSize: 14, color: FG, fontFace: MONO });
});
s.addText("Новый отраслевой пак — за 30 минут: один файл (метрики/измерения/синонимы) + сид. Ядро не трогается.", { x: 0.6, y: 5.6, w: 12, h: 0.6, fontSize: 15, color: MUT });

// 9 ЭТО РАБОТАЕТ
s = slide("это работает — живой стенд", 9);
s.addText("Не слайдвер: реальные числа с прода", { x: 0.6, y: 1.1, w: 12, h: 0.7, fontSize: 30, bold: true });
const metrics = [["74 639", "строк данных в Turso"], ["114", "вопросов обработано"], ["99 мс", "медиана ответа"], ["86", "тестов зелёных"]];
metrics.forEach(([v, l], i) => {
  const x = 0.6 + i * 3.05;
  card(s, x, 2.5, 2.8, 1.9);
  s.addText(v, { x: x + 0.2, y: 2.75, w: 2.5, h: 0.7, fontSize: 34, bold: true, color: CYAN, fontFace: MONO });
  s.addText(l, { x: x + 0.2, y: 3.7, w: 2.5, h: 0.6, fontSize: 12, color: MUT });
});
s.addText("Ответ по фактическим данным · запись в БД · RBAC · казахский язык · embed поверх чужой BI · авто-инсайты по z-score — всё живое на sana-rho-ten.vercel.app", { x: 0.6, y: 4.9, w: 12, h: 1, fontSize: 15, color: MUT });

// 10 ПИЛОТ
s = slide("готовы к пилоту", 10);
s.addText("2 недели на ваших данных", { x: 0.6, y: 1.3, w: 12, h: 0.9, fontSize: 40, bold: true });
s.addText("Нужен только доступ к витрине и одна встреча по метрикам. Описываем ваш пак по схеме, подключаем read-replica, маппим RBAC на ваши роли — данные остаются в контуре.", { x: 0.6, y: 2.4, w: 11.5, h: 1, fontSize: 17, color: MUT });
const pilot = [["Неделя 1", "Semantic Layer по вашей витрине + подключение источника", CARD], ["Неделя 2", "RBAC, тюнинг вопросов, on-prem AI-адаптер, приёмка", CARD], ["Результат", "Бизнес спрашивает данные словами — ответ за секунды", "10201a"]];
pilot.forEach(([t, d, c], i) => {
  const x = 0.6 + i * 4.15;
  card(s, x, 3.7, 3.9, 1.9, c);
  s.addText(t, { x: x + 0.3, y: 3.95, w: 3.3, h: 0.4, fontSize: 18, bold: true, color: i === 2 ? LIME : FG });
  s.addText(d, { x: x + 0.3, y: 4.5, w: 3.4, h: 1, fontSize: 13, color: MUT });
});
s.addText("SANA · «Спросите свои данные»   ·   партнёрство: +7 700 110 10 55", { x: 0.6, y: 6.4, w: 12, h: 0.4, fontSize: 15, color: FG, fontFace: MONO });

await p.writeFile({ fileName: "docs/SANA.pptx" });
console.log("[pptx] docs/SANA.pptx собран (10 слайдов).");
