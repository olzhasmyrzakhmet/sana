import type { Pack } from "../types";

/**
 * AUTO — основной отраслевой пак (отрасль заказчика).
 * Fact: auto_sales s. Джойны только на справочники dealers/models.
 * Метрики MVP основаны на auto_sales (revenue/units/discount/avg_check) — покрывают
 * весь демо-сценарий. Сервис/склад-метрики (service_orders, auto_inventory) — расширение
 * (см. TODO.md: единый fact-table для MVP).
 */
export const autoPack: Pack = {
  id: "auto",
  title: { ru: "Автопродажи", kk: "Автосату" },
  factTable: "auto_sales s",
  timeField: "s.d",
  joins: [
    { table: "dealers dl", on: "s.dealer_id = dl.id" },
    { table: "models m", on: "s.model_id = m.id" },
  ],
  rbacDimension: "region",
  defaultMetric: "revenue",
  metrics: {
    revenue: {
      id: "revenue",
      title: { ru: "Выручка", kk: "Түсім" },
      sqlExpr: "SUM(s.revenue)",
      format: "money",
      goodDirection: "up",
    },
    units: {
      id: "units",
      title: { ru: "Продажи, шт", kk: "Сатылым, дана" },
      sqlExpr: "SUM(s.qty)",
      format: "number",
      goodDirection: "up",
    },
    avg_discount: {
      id: "avg_discount",
      title: { ru: "Средняя скидка", kk: "Орташа жеңілдік" },
      sqlExpr: "AVG(s.discount_pct)",
      format: "percent",
      goodDirection: "down",
    },
    avg_check: {
      id: "avg_check",
      title: { ru: "Средний чек", kk: "Орташа чек" },
      sqlExpr: "SUM(s.revenue) * 1.0 / NULLIF(SUM(s.qty), 0)",
      format: "money",
      goodDirection: "up",
    },
  },
  dimensions: {
    month: {
      id: "month",
      title: { ru: "Месяц", kk: "Ай" },
      sqlExpr: "strftime('%Y-%m', s.d)",
      kind: "time",
      grains: ["month"],
    },
    quarter: {
      id: "quarter",
      title: { ru: "Квартал", kk: "Тоқсан" },
      sqlExpr:
        "strftime('%Y', s.d) || '-Q' || ((CAST(strftime('%m', s.d) AS INTEGER) + 2) / 3)",
      kind: "time",
      grains: ["quarter"],
    },
    year: {
      id: "year",
      title: { ru: "Год", kk: "Жыл" },
      sqlExpr: "strftime('%Y', s.d)",
      kind: "time",
      grains: ["year"],
    },
    dealer: {
      id: "dealer",
      title: { ru: "Дилер", kk: "Дилер" },
      sqlExpr: "dl.name",
      kind: "category",
    },
    region: {
      id: "region",
      title: { ru: "Регион", kk: "Аймақ" },
      sqlExpr: "dl.region",
      kind: "category",
    },
    city: {
      id: "city",
      title: { ru: "Город", kk: "Қала" },
      sqlExpr: "dl.city",
      kind: "category",
    },
    brand: {
      id: "brand",
      title: { ru: "Бренд", kk: "Бренд" },
      sqlExpr: "m.brand",
      kind: "category",
    },
    model: {
      id: "model",
      title: { ru: "Модель", kk: "Үлгі" },
      sqlExpr: "m.model",
      kind: "category",
    },
    segment: {
      id: "segment",
      title: { ru: "Сегмент", kk: "Сегмент" },
      sqlExpr: "m.segment",
      kind: "category",
    },
    channel: {
      id: "channel",
      title: { ru: "Канал", kk: "Арна" },
      sqlExpr: "s.channel",
      kind: "category",
    },
    manager: {
      id: "manager",
      title: { ru: "Менеджер", kk: "Менеджер" },
      sqlExpr: "s.manager",
      kind: "category",
    },
  },
  synonyms: {
    revenue: ["выручка", "выручку", "выручке", "доход", "оборот", "түсім", "revenue", "продаж на сумму"],
    units: ["продажи", "продаж", "продано", "сатылым", "сатылған", "сату", "штук", "количество", "объём", "объем", "units"],
    avg_discount: ["скидка", "скидки", "скидку", "скидок", "жеңілдік", "дисконт", "discount"],
    avg_check: ["средний чек", "средняя цена", "чек", "орташа чек", "avg check"],
    dealer: ["дилер", "дилеры", "дилеров", "дилерам", "салон", "автосалон"],
    region: ["регион", "регионы", "регионам", "региону", "аймақ", "область"],
    city: ["город", "города", "городам", "қала"],
    brand: ["бренд", "бренды", "брендам", "марка", "марки"],
    model: ["модель", "модели", "моделям", "үлгі", "машина", "авто"],
    segment: ["сегмент", "сегменты", "класс"],
    channel: ["канал", "каналы", "каналам", "арна"],
    manager: ["менеджер", "менеджеры", "менеджерам", "продавец"],
    month: ["месяц", "месяцам", "помесячно", "ай", "айлар", "по месяцам"],
    quarter: ["квартал", "кварталам", "поквартально", "тоқсан"],
    year: ["год", "году", "годам", "жыл", "по годам", "годовой"],
  },
  sampleQuestions: [
    { ru: "Какая выручка по месяцам за последний год?", kk: "Өткен жылдағы айлар бойынша түсім қандай?" },
    { ru: "Топ-5 дилеров по продажам в 2026", kk: "2026 жылы сату бойынша топ-5 дилер" },
    { ru: "Какая модель продавалась лучше всего за последний месяц?", kk: "Өткен айдағы ең көп сатылған модель қандай?" },
    { ru: "Выручка по брендам за последний год", kk: "Өткен жылдағы брендтер бойынша түсім" },
    { ru: "Средняя скидка по брендам", kk: "Брендтер бойынша орташа жеңілдік" },
    { ru: "Продажи по регионам за 2026", kk: "2026 жылы аймақтар бойынша сатылым" },
    { ru: "Средний чек по каналам продаж" },
    { ru: "Динамика продаж по кварталам" },
    { ru: "Топ-10 моделей по выручке" },
    { ru: "Выручка по городам за последний год" },
    { ru: "Как менялась средняя скидка по месяцам?" },
    { ru: "Продажи по менеджерам за последний квартал" },
    { ru: "Доля брендов в общей выручке" },
  ],
};
