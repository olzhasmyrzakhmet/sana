// prod-verify — SPEC §11. Бьёт по РЕАЛЬНОМУ прод-домену (BASE).
// Использование: PROD_BASE=https://sana.vercel.app node scripts/prod-verify.mjs
// BASE фиксируется в фазе 0.7 (DEFAULT_BASE). Проверки для ещё не готовых эндпоинтов
// помечены enabled:false и включаются по мере реализации фич.

// --- Зафиксированный прод-домен ---
const DEFAULT_BASE = "https://sana-rho-ten.vercel.app";
const BASE = (process.env.PROD_BASE || DEFAULT_BASE).replace(/\/$/, "");

if (!BASE) {
  console.error(
    "❌ BASE не задан. Укажите PROD_BASE=https://<домен> или DEFAULT_BASE в scripts/prod-verify.mjs (фаза 0.7).",
  );
  process.exit(1);
}

// --- Мини cookie-jar (для сессии между login и запросами) ---
const jar = new Map();
function setCookiesFrom(res) {
  // Node fetch: getSetCookie() возвращает массив Set-Cookie
  const raw = res.headers.getSetCookie?.() ?? [];
  for (const c of raw) {
    const [pair] = c.split(";");
    const idx = pair.indexOf("=");
    if (idx > 0) jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
  }
}
function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}
function clearCookies() {
  jar.clear();
}

async function req(method, path, body) {
  const headers = { accept: "application/json" };
  if (body !== undefined) headers["content-type"] = "application/json";
  const ck = cookieHeader();
  if (ck) headers["cookie"] = ck;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  setCookiesFrom(res);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* не JSON — оставляем text */
  }
  return { res, status: res.status, text, json };
}

// --- Определения проверок ---
const checks = [
  {
    id: 0,
    name: "GET /api/health/db → ok:true, users>0",
    enabled: true,
    async run() {
      const { status, json } = await req("GET", "/api/health/db");
      if (status !== 200 || !json?.ok) return fail(`status=${status} ok=${json?.ok}`);
      if (!(json.counts?.users >= 3)) return fail(`users=${json?.counts?.users} (ожидали ≥3 — БД не засеяна?)`);
      if (!(json.counts?.auto_sales > 1000)) return fail(`auto_sales=${json?.counts?.auto_sales} (факты не засеяны!)`);
      return pass(`users=${json.counts.users}, auto_sales=${json.counts.auto_sales}, adapter=${json.db?.mode}`);
    },
  },
  {
    id: 1,
    name: "GET / → 200, «Спросите», без нулевых счётчиков",
    enabled: true,
    async run() {
      const { status, text } = await req("GET", "/");
      if (status !== 200) return fail(`status=${status}`);
      if (!text.includes("Спросите")) return fail("нет слова «Спросите»");
      if (/\b0\s+вопрос/i.test(text)) return fail("нулевой счётчик на витрине");
      return pass("лендинг ок");
    },
  },
  {
    id: 2,
    name: "POST /api/auth/login (ceo) → 200",
    enabled: true,
    async run() {
      clearCookies();
      const { status, json } = await req("POST", "/api/auth/login", {
        email: "ceo@demo.kz",
        password: "demo123",
      });
      if (status !== 200 || !json?.ok) return fail(`status=${status}`);
      return pass(`role=${json?.user?.role}`);
    },
  },
  {
    id: 3,
    name: "POST /api/ask (выручка по месяцам) → line + запись в историю",
    enabled: true,
    async run() {
      const q = "Какая выручка по месяцам за последний год?";
      const { status, json } = await req("POST", "/api/ask", {
        question: q,
        pack: "auto",
      });
      if (status !== 200) return fail(`status=${status}`);
      if (!(json?.rowCount > 0)) return fail(`rows=${json?.rowCount}`);
      if (json?.chart?.type !== "line") return fail(`chart=${json?.chart?.type}`);
      if (!json?.insight?.summary) return fail("пустой insight");
      if (!/SUM/i.test(json?.sql ?? "")) return fail("нет SUM в sql");
      const hist = await req("GET", "/api/history");
      const inHist = JSON.stringify(hist.json ?? "").includes(q);
      if (!inHist) return fail("вопрос не записан в историю");
      return pass(`rows=${json.rowCount}, записано в историю`);
    },
  },
  {
    id: 4,
    name: "POST /api/ask (казахский) → 200, rows>0",
    enabled: true,
    async run() {
      const { status, json } = await req("POST", "/api/ask", {
        question: "Өткен айдағы ең көп сатылған модель қандай?",
        pack: "auto",
      });
      if (status !== 200 || !(json?.rowCount > 0)) return fail(`status=${status} rows=${json?.rowCount}`);
      return pass(`rows=${json.rowCount}`);
    },
  },
  {
    id: 5,
    name: "RBAC: REGION видит МЕНЬШЕ дилеров, чем CEO, scoped=true",
    enabled: true,
    async run() {
      const q = { question: "Топ-12 дилеров по продажам в 2026", pack: "auto" };
      clearCookies();
      await req("POST", "/api/auth/login", { email: "ceo@demo.kz", password: "demo123" });
      const ceo = await req("POST", "/api/ask", q);
      const ceoN = ceo.json?.rowCount ?? 0;
      clearCookies();
      await req("POST", "/api/auth/login", { email: "region@demo.kz", password: "demo123" });
      const reg = await req("POST", "/api/ask", q);
      const regN = reg.json?.rowCount ?? 0;
      if (reg.json?.scoped !== true) return fail("region scoped!=true");
      if (!(ceoN > regN)) return fail(`CEO=${ceoN} дилеров, REGION=${regN} — данные не урезаны!`);
      return pass(`CEO=${ceoN} дилеров → REGION=${regN} (урезано, scoped)`);
    },
  },
  {
    id: 6,
    name: "POST /api/ask (pack=retail) → 200",
    enabled: true,
    async run() {
      clearCookies();
      await req("POST", "/api/auth/login", { email: "ceo@demo.kz", password: "demo123" });
      const { status, json } = await req("POST", "/api/ask", {
        question: "Выручка по категориям за последний год",
        pack: "retail",
      });
      if (status !== 200 || !(json?.rowCount > 0)) return fail(`status=${status} rows=${json?.rowCount}`);
      return pass(`rows=${json.rowCount}`);
    },
  },
  {
    id: 7,
    name: "GET /legacy-bi (widget) и /embed → 200",
    enabled: true,
    async run() {
      const a = await req("GET", "/legacy-bi");
      if (a.status !== 200 || !a.text.includes("widget")) return fail("legacy-bi без widget");
      const b = await req("GET", "/embed");
      if (b.status !== 200) return fail(`embed status=${b.status}`);
      return pass("legacy-bi+embed ок");
    },
  },
  {
    id: 8,
    name: "GET /api/insights?pack=auto → 3 инсайта",
    enabled: true,
    async run() {
      const { status, json } = await req("GET", "/api/insights?pack=auto");
      const n = Array.isArray(json?.insights) ? json.insights.length : Array.isArray(json) ? json.length : 0;
      if (status !== 200 || n !== 3) return fail(`status=${status} n=${n}`);
      return pass(`инсайтов=${n}`);
    },
  },
  {
    id: 9,
    name: "Невалидный вопрос → 200 с clarify (не 500)",
    enabled: true,
    async run() {
      const { status, json } = await req("POST", "/api/ask", {
        question: "приготовь плов",
        pack: "auto",
      });
      if (status !== 200) return fail(`status=${status} (ожидали 200)`);
      if (!json?.clarify) return fail("нет clarify");
      return pass("clarify возвращён");
    },
  },
  {
    id: 10,
    name: "AI: провайдер настроен корректно; engine anthropic|gemini (или квота→резерв)",
    enabled: true,
    async run() {
      const h = await req("GET", "/api/health/db?probe=ai");
      const ai = h.json?.ai ?? {};
      const configured =
        (ai.provider === "gemini" && ai.hasGeminiKey) || (ai.provider === "anthropic" && ai.hasAnthropicKey);
      if (!configured) return fail(`AI не настроен: provider=${ai.provider}, hasGeminiKey=${ai.hasGeminiKey}, hasAnthropicKey=${ai.hasAnthropicKey}`);

      clearCookies();
      await req("POST", "/api/auth/login", { email: "ceo@demo.kz", password: "demo123" });
      const a = await req("POST", "/api/ask", { question: "Выручка по брендам за последний год", pack: "auto" });
      const engine = a.json?.engine;
      if (!(engine === "anthropic" || engine === "gemini")) {
        const cause = String(ai.probe?.error || ai.lastError || a.json?.engineNote || "?");
        return fail(`engine=fallback — живой AI не вызван. Причина: ${cause.slice(0, 120)}`);
      }
      if (!(a.json?.rowCount > 0)) return fail(`engine=${engine}, но rows=${a.json?.rowCount}`);
      return pass(`engine=${engine}, rows=${a.json.rowCount} — AI живой`);
    },
  },
];

function pass(detail) {
  return { ok: true, detail };
}
function fail(detail) {
  return { ok: false, detail };
}
function warn(detail) {
  return { ok: true, warn: true, detail };
}

async function main() {
  console.log(`\n=== prod-verify @ ${BASE} ===\n`);
  let failed = 0;
  let skipped = 0;
  for (const c of checks) {
    if (!c.enabled) {
      skipped++;
      console.log(`⏭  [${c.id}] ${c.name}  (skip)`);
      continue;
    }
    try {
      const r = await c.run();
      if (r.ok && r.warn) {
        console.log(`⚠️  [${c.id}] ${c.name}  — ${r.detail}`);
      } else if (r.ok) {
        console.log(`✅ [${c.id}] ${c.name}  — ${r.detail}`);
      } else {
        failed++;
        console.log(`❌ [${c.id}] ${c.name}  — ${r.detail}`);
      }
    } catch (err) {
      failed++;
      console.log(`❌ [${c.id}] ${c.name}  — исключение: ${err?.message ?? err}`);
    }
  }
  console.log(
    `\n=== итог: ${checks.length - failed - skipped} ok, ${failed} fail, ${skipped} skip ===\n`,
  );
  process.exit(failed > 0 ? 1 : 0);
}

main();
