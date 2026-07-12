// Справочные данные SANA (детерминированные). Используются и при сидинге справочников,
// и при генерации фактов (фаза 1.2) — единые id.

// 12 дилеров по регионам РК. Несколько в регионе «Алматы» — для RBAC-демо.
export const DEALERS = [
  { id: 1, name: "SANA Motors Алматы-Центр", city: "Алматы", region: "Алматы" },
  { id: 2, name: "SANA Motors Алматы-Север", city: "Алматы", region: "Алматы" },
  { id: 3, name: "Astana Auto", city: "Астана", region: "Астана" },
  { id: 4, name: "Shymkent Cars", city: "Шымкент", region: "Шымкент" },
  { id: 5, name: "Karaganda Motors", city: "Караганда", region: "Караганда" },
  { id: 6, name: "Aktobe Auto", city: "Актобе", region: "Актобе" },
  { id: 7, name: "Atyrau Premium", city: "Атырау", region: "Атырау" },
  { id: 8, name: "Pavlodar Auto", city: "Павлодар", region: "Павлодар" },
  { id: 9, name: "Kostanay Motors", city: "Костанай", region: "Костанай" },
  { id: 10, name: "Taraz Auto", city: "Тараз", region: "Жамбыл" },
  { id: 11, name: "Oskemen Motors", city: "Өскемен", region: "ВКО" },
  { id: 12, name: "Kyzylorda Auto", city: "Кызылорда", region: "Кызылорда" },
];

// 20 моделей: 4 бренда × 5 сегментов. Бренды вымышленные (без имперсонизации).
const BRANDS = ["Tulpar", "Barys", "Saiga", "Alatau"];
const SEGMENTS = [
  { segment: "A-class", price_class: "budget" },
  { segment: "B-class", price_class: "budget" },
  { segment: "C-class", price_class: "mid" },
  { segment: "SUV", price_class: "mid" },
  { segment: "Premium", price_class: "premium" },
];
export const MODELS = (() => {
  const out = [];
  let id = 1;
  for (const brand of BRANDS) {
    for (const s of SEGMENTS) {
      out.push({
        id,
        brand,
        model: `${brand} ${s.segment}`,
        segment: s.segment,
        price_class: s.price_class,
      });
      id++;
    }
  }
  return out;
})();

export const MANAGERS = [
  "Айгуль", "Ерлан", "Данияр", "Асель", "Нурлан", "Мадина", "Тимур", "Жанна",
];
export const CHANNELS = ["Салон", "Онлайн", "Корпоративный"];

// RETAIL
export const STORES = [
  { id: 1, name: "MEGA Алматы", city: "Алматы", region: "Алматы" },
  { id: 2, name: "MEGA Астана", city: "Астана", region: "Астана" },
  { id: 3, name: "Dostyk Plaza", city: "Алматы", region: "Алматы" },
  { id: 4, name: "Shymkent Mall", city: "Шымкент", region: "Шымкент" },
  { id: 5, name: "Karaganda City", city: "Караганда", region: "Караганда" },
  { id: 6, name: "Aktobe Plaza", city: "Актобе", region: "Актобе" },
  { id: 7, name: "Atyrau Center", city: "Атырау", region: "Атырау" },
  { id: 8, name: "Pavlodar Market", city: "Павлодар", region: "Павлодар" },
];
export const CATEGORIES = [
  { id: 1, name: "Электроника" },
  { id: 2, name: "Продукты" },
  { id: 3, name: "Одежда" },
  { id: 4, name: "Дом и сад" },
  { id: 5, name: "Красота" },
  { id: 6, name: "Спорт" },
];

// BANK
export const BRANCHES = [
  { id: 1, name: "Филиал Алматы-Центральный", city: "Алматы", region: "Алматы" },
  { id: 2, name: "Филиал Астана", city: "Астана", region: "Астана" },
  { id: 3, name: "Филиал Шымкент", city: "Шымкент", region: "Шымкент" },
  { id: 4, name: "Филиал Караганда", city: "Караганда", region: "Караганда" },
  { id: 5, name: "Филиал Актобе", city: "Актобе", region: "Актобе" },
  { id: 6, name: "Филиал Атырау", city: "Атырау", region: "Атырау" },
];
export const BANK_PRODUCTS = [
  { id: 1, name: "Депозит «Береке»", type: "deposit" },
  { id: 2, name: "Кредит наличными", type: "credit" },
  { id: 3, name: "Ипотека", type: "credit" },
  { id: 4, name: "Автокредит", type: "credit" },
  { id: 5, name: "Карта «Максимум»", type: "card" },
];

// Демо-пользователи (пароль у всех demo123). Вход — кнопками на /login.
export const USERS = [
  {
    email: "ceo@demo.kz",
    name: "Нуриман — CEO",
    role: "CEO",
    scope_json: null,
  },
  {
    email: "region@demo.kz",
    name: "Директор региона Алматы",
    role: "REGION",
    scope_json: JSON.stringify({ region: "Алматы" }),
  },
  {
    email: "analyst@demo.kz",
    name: "Аналитик команды",
    role: "ANALYST",
    scope_json: null,
  },
];
export const DEMO_PASSWORD = "demo123";
