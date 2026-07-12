// Генерация фактов SANA. Детерминированный PRNG (seed=42), сезонность, 3 аномалии (BRIEF §4).
// Идемпотентно: DELETE фактов + повторный INSERT даёт те же counts.
import {
  DEALERS,
  MODELS,
  MANAGERS,
  CHANNELS,
  STORES,
  CATEGORIES,
  BRANCHES,
  BANK_PRODUCTS,
} from "./seed-data.mjs";

// --- детерминированный PRNG ---
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(42);
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const pad = (n) => String(n).padStart(2, "0");

// 24 месяца: 2024-07 .. 2026-06
const MONTHS = Array.from({ length: 24 }, (_, i) => {
  const monthNum = (6 + i) % 12; // 0=Jan; июль=6
  const year = 2024 + Math.floor((6 + i) / 12);
  return { i, year, monthNum };
});
function dayIn(m) {
  return `${m.year}-${pad(m.monthNum + 1)}-${pad(1 + ri(0, 27))}`;
}
function seasonal(monthNum) {
  return 1 + 0.28 * Math.sin((monthNum / 12) * 2 * Math.PI);
}
function yearTrend(i) {
  return 1 + 0.02 * i;
}

const PRICE = { budget: 5_000_000, mid: 9_000_000, premium: 18_000_000 };
const BRAND_POP = { Tulpar: 1.25, Barys: 1.0, Saiga: 0.8, Alatau: 1.05 };

// ---------- AUTO ----------
function genAuto() {
  const sales = [];
  const inventory = [];
  const service = [];
  for (const m of MONTHS) {
    const seas = seasonal(m.monthNum) * yearTrend(m.i);
    for (const dl of DEALERS) {
      const dealerPop = 0.7 + ((dl.id * 7) % 10) / 10; // стабильный «размер» дилера
      for (const mo of MODELS) {
        const modelPop = BRAND_POP[mo.brand] * (mo.price_class === "budget" ? 1.4 : mo.price_class === "mid" ? 1.0 : 0.6);
        let factor = 1;
        // Аномалия 1: провал продаж дилера #5 в марте 2026 (i=20)
        if (dl.id === 5 && m.year === 2026 && m.monthNum === 2) factor *= 0.18;
        // Аномалия 3: всплеск выручки дилера #1 (Алматы) в мае 2026 (i=22)
        if (dl.id === 1 && m.year === 2026 && m.monthNum === 4) factor *= 2.6;

        let orders = Math.round(4.2 * seas * dealerPop * modelPop * factor + rnd() * 2);
        orders = Math.max(0, Math.min(40, orders));
        const price = PRICE[mo.price_class];
        for (let k = 0; k < orders; k++) {
          const qty = ri(1, 3);
          let discount = 3 + rnd() * 6; // базовая скидка 3–9%
          // Аномалия 2: всплеск скидок бренда Barys в фев–апр 2026
          if (mo.brand === "Barys" && m.year === 2026 && m.monthNum >= 1 && m.monthNum <= 3) {
            discount += 16 + rnd() * 6;
          }
          const revenue = Math.round(price * qty * (1 - discount / 100));
          sales.push({
            d: dayIn(m),
            dealer_id: dl.id,
            model_id: mo.id,
            qty,
            revenue,
            discount_pct: Math.round(discount * 10) / 10,
            channel: pick(CHANNELS),
            manager: pick(MANAGERS),
          });
        }
        // склад: месячный снимок
        inventory.push({
          d: `${m.year}-${pad(m.monthNum + 1)}-01`,
          dealer_id: dl.id,
          model_id: mo.id,
          stock_qty: ri(0, 60),
        });
      }
      // сервис: несколько заказов на дилера в месяц
      for (let s = 0; s < ri(2, 5); s++) {
        service.push({
          d: dayIn(m),
          dealer_id: dl.id,
          model_id: pick(MODELS).id,
          type: pick(["ТО", "Ремонт", "Гарантия"]),
          revenue: ri(30_000, 400_000),
          nps: ri(6, 10),
        });
      }
    }
  }
  return { sales, inventory, service };
}

// ---------- RETAIL ----------
function genRetail() {
  const rows = [];
  for (const m of MONTHS) {
    const seas = seasonal(m.monthNum) * yearTrend(m.i);
    for (const st of STORES) {
      const storePop = 0.8 + ((st.id * 5) % 10) / 10;
      for (const c of CATEGORIES) {
        const orders = Math.max(0, Math.round(12 * seas * storePop * (0.6 + rnd()) ));
        for (let k = 0; k < orders; k++) {
          const qty = ri(1, 6);
          const unit = ri(2000, 90000);
          rows.push({
            d: dayIn(m),
            store_id: st.id,
            category_id: c.id,
            qty,
            revenue: qty * unit,
            returns_qty: rnd() < 0.15 ? ri(1, 2) : 0,
          });
        }
      }
    }
  }
  return rows;
}

// ---------- BANK ----------
function genBank() {
  const rows = [];
  for (const m of MONTHS) {
    const seas = seasonal(m.monthNum) * yearTrend(m.i);
    for (const br of BRANCHES) {
      const branchPop = 0.8 + ((br.id * 3) % 10) / 10;
      for (const p of BANK_PRODUCTS) {
        const orders = Math.max(0, Math.round(7.5 * seas * branchPop * (0.6 + rnd())));
        for (let k = 0; k < orders; k++) {
          const issued = ri(300_000, 12_000_000);
          rows.push({
            d: dayIn(m),
            branch_id: br.id,
            product_id: p.id,
            issued_amount: issued,
            balance: Math.round(issued * (1 + rnd() * 4)),
          });
        }
      }
    }
  }
  return rows;
}

// ---------- ask_history сид (живые счётчики витрины) ----------
const SEED_QUESTIONS = [
  ["auto", "Какая выручка по месяцам за последний год?"],
  ["auto", "Топ-5 дилеров по продажам в 2026"],
  ["auto", "Средняя скидка по брендам"],
  ["auto", "Выручка по регионам за 2026"],
  ["auto", "Динамика продаж по кварталам"],
  ["auto", "Доля брендов в общей выручке"],
  ["retail", "Выручка по категориям за последний год"],
  ["retail", "Топ-5 магазинов по выручке в 2026"],
  ["bank", "Выдачи по продуктам за последний год"],
  ["bank", "Остатки по филиалам"],
];
function genAskHistory() {
  const rows = [];
  const now = Date.now();
  for (let i = 0; i < 40; i++) {
    const [pack, q] = SEED_QUESTIONS[i % SEED_QUESTIONS.length];
    const daysAgo = ri(0, 29);
    const created = new Date(now - daysAgo * 86400000 - ri(0, 80000) * 1000);
    rows.push({
      user_id: null,
      pack,
      question: q,
      plan_json: null,
      sql_text: null,
      row_count: ri(6, 240),
      duration_ms: ri(40, 320),
      created_at: created.toISOString(),
    });
  }
  return rows;
}

// ---------- вставка чанками ----------
async function insertChunked(db, table, cols, rows) {
  if (rows.length === 0) return;
  const perRow = cols.length;
  const chunkRows = Math.max(1, Math.floor(8000 / perRow));
  const tuple = `(${cols.map(() => "?").join(",")})`;
  for (let i = 0; i < rows.length; i += chunkRows) {
    const slice = rows.slice(i, i + chunkRows);
    const sql = `INSERT INTO ${table} (${cols.join(",")}) VALUES ${slice.map(() => tuple).join(",")}`;
    const args = [];
    for (const r of slice) for (const c of cols) args.push(r[c]);
    await db.execute({ sql, args });
  }
}

export async function seedFacts(db) {
  // очистка фактов (идемпотентность); ask_history — только сид-строки (user_id IS NULL)
  for (const t of ["auto_sales", "auto_inventory", "service_orders", "retail_sales", "bank_facts"]) {
    await db.execute(`DELETE FROM ${t}`);
  }
  await db.execute("DELETE FROM ask_history WHERE user_id IS NULL");

  const auto = genAuto();
  await insertChunked(db, "auto_sales", ["d", "dealer_id", "model_id", "qty", "revenue", "discount_pct", "channel", "manager"], auto.sales);
  await insertChunked(db, "auto_inventory", ["d", "dealer_id", "model_id", "stock_qty"], auto.inventory);
  await insertChunked(db, "service_orders", ["d", "dealer_id", "model_id", "type", "revenue", "nps"], auto.service);

  const retail = genRetail();
  await insertChunked(db, "retail_sales", ["d", "store_id", "category_id", "qty", "revenue", "returns_qty"], retail);

  const bank = genBank();
  await insertChunked(db, "bank_facts", ["d", "branch_id", "product_id", "issued_amount", "balance"], bank);

  const hist = genAskHistory();
  await insertChunked(db, "ask_history", ["user_id", "pack", "question", "plan_json", "sql_text", "row_count", "duration_ms", "created_at"], hist);

  console.log(
    `[seed-facts] auto_sales=${auto.sales.length}, inventory=${auto.inventory.length}, service=${auto.service.length}, retail=${retail.length}, bank=${bank.length}, ask_history=${hist.length}`,
  );
}
