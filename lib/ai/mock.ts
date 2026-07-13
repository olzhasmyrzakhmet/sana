import type { Pack } from "../semantic/types";
import { loc } from "../semantic/types";
import type { DeltaResult } from "../engine/deltas";
import { formatValue, formatDeltaPct, round1 } from "../format";

// Детерминированный резервный роутер: вопрос (RU/KK) → JSON-план по синонимам пака.
// Публично это «резервный режим». Каждый sampleQuestion обязан резолвиться (тест mockRouter).

export function detectLang(question: string): "ru" | "kk" {
  return /[әіңғүұқөһ]/i.test(question) ? "kk" : "ru";
}

function norm(q: string): string {
  return q.toLowerCase().replace(/\s+/g, " ");
}

function firstMatch(q: string, pack: Pack, candidateIds: string[]): string | null {
  for (const id of candidateIds) {
    const syns = pack.synonyms[id];
    if (!syns) continue;
    for (const s of syns) {
      if (q.includes(s.toLowerCase())) return id;
    }
  }
  return null;
}

function detectMetricExplicit(q: string, pack: Pack): string | null {
  return firstMatch(q, pack, Object.keys(pack.metrics));
}

function detectCategoryDim(q: string, pack: Pack): string | null {
  const ids = Object.values(pack.dimensions)
    .filter((d) => d.kind === "category")
    .map((d) => d.id);
  return firstMatch(q, pack, ids);
}

function detectTimeGroup(q: string): { grouped: boolean; grain: "month" | "quarter" | "year" } {
  if (/по\s*квартал|поквартал|тоқсан\w*\s*бойынша/.test(q)) return { grouped: true, grain: "quarter" };
  if (/по\s*год|погодов|жыл\w*\s*бойынша/.test(q)) return { grouped: true, grain: "year" };
  if (/по\s*месяц|помесяч|айлар?\s*бойынша|ай\s*бойынша/.test(q)) return { grouped: true, grain: "month" };
  return { grouped: false, grain: "month" };
}

function detectTime(q: string, grain: "month" | "quarter" | "year") {
  const yearMatch = q.match(/\b(20\d\d)\b/);
  if (yearMatch) {
    const y = yearMatch[1];
    return { mode: "range" as const, from: `${y}-01-01`, to: `${y}-12-31`, grain };
  }
  if (/последн\w* месяц|прошл\w* месяц|өткен ай|соңғы ай/.test(q)) {
    return { mode: "last_n" as const, n: 1, unit: "month" as const, grain };
  }
  if (/последн\w* квартал|прошл\w* квартал|өткен тоқсан|соңғы тоқсан/.test(q)) {
    return { mode: "last_n" as const, n: 1, unit: "quarter" as const, grain };
  }
  if (/последн\w* год|за год|за последний год|өткен жыл|соңғы жыл|12 месяц/.test(q)) {
    return { mode: "last_n" as const, n: 12, unit: "month" as const, grain };
  }
  return { mode: "all" as const, grain };
}

const TOPN = /топ|top|рейтинг|лучш|ең көп|ең жоғар|самы[йе]|наибол/;
const TREND = /динамик|как менял|как измен|тренд|эволюц/;
const SHARE = /доля|долю|доли|структур|share|үлес/;

function detectLimit(q: string): number {
  const m = q.match(/топ[\s-]*(\d+)/) || q.match(/top[\s-]*(\d+)/);
  if (m) return Math.min(50, parseInt(m[1], 10));
  if (/ең көп|самы[йе]|лучш/.test(q)) return 5;
  return 10;
}

/** Возвращает сырой план-объект (валидируется zod выше) или null, если не разобрали. */
export function mockPlan(question: string, pack: Pack): Record<string, unknown> | null {
  const q = norm(question);
  const explicitMetric = detectMetricExplicit(q, pack);
  const categoryDim = detectCategoryDim(q, pack);
  const tg = detectTimeGroup(q);
  const time = detectTime(q, tg.grain);
  const intentWord = TOPN.test(q) || TREND.test(q) || SHARE.test(q);

  // Порог уверенности: резервный роутер НЕ выдаёт уверенный ответ на непонятый вопрос.
  // Каждый реальный сигнал добавляет очки; ниже порога → null → выше по стеку clarify.
  let score = 0;
  if (explicitMetric) score += 2; // явная метрика — сильный сигнал
  if (intentWord) score += 2; // «топ»/«динамика»/«доля» — явное намерение
  if (categoryDim) score += 1; // измерение (напр. «дилер») — слабый сам по себе
  if (tg.grouped) score += 1; // «по месяцам» — группировка по времени
  if (time.mode !== "all") score += 1; // явный период
  // Порог 3: одной метрики ИЛИ одного намерения мало — иначе разговорный вопрос
  // («стоит ли переживать за продажи?») получил бы уверенный тотал. Нужен второй сигнал
  // (разрез / период / группировка). Все структурные sampleQuestions набирают ≥3.
  if (score < 3) return null; // низкая уверенность → clarify, а не случайный план

  const metric = explicitMetric ?? pack.defaultMetric;
  let intent: string;
  if (TOPN.test(q) && categoryDim) intent = "topn";
  else if (TREND.test(q) || tg.grouped) intent = "trend";
  else if (SHARE.test(q) && categoryDim) intent = "breakdown";
  else if (categoryDim) intent = "breakdown";
  else intent = "kpi";

  if (intent === "kpi") {
    return { intent, metrics: [metric], dimensions: [], time };
  }
  if (intent === "trend") {
    return { intent, metrics: [metric], dimensions: [], time };
  }
  // topn / breakdown требуют категориального измерения
  if (!categoryDim) {
    return { intent: "kpi", metrics: [metric], dimensions: [], time };
  }
  if (intent === "topn") {
    return {
      intent,
      metrics: [metric],
      dimensions: [categoryDim],
      time,
      sort: { by: metric, dir: "desc" },
      limit: detectLimit(q),
    };
  }
  // breakdown
  return {
    intent: "breakdown",
    metrics: [metric],
    dimensions: [categoryDim],
    time,
    sort: { by: metric, dir: "desc" },
    limit: 12,
  };
}

// ---- Шаблонные вывод и follow-ups (детерминированно из deltas) ----
export function templateInsight(
  question: string,
  d: DeltaResult,
  pack: Pack,
  lang: "ru" | "kk",
): { summary: string; bullets: string[]; nextCheck: string } {
  const metric = pack.metrics[d.primaryMetric];
  const title = loc(metric.title, lang);
  const val = formatValue(d.total, d.primaryFormat, lang);
  const bullets: string[] = [];

  let summary =
    lang === "kk"
      ? `«${title}» бойынша қорытынды — ${val}.`
      : `Итог по «${title}» — ${val}.`;

  if (d.deltaPct !== null) {
    const delta = formatDeltaPct(d.deltaPct);
    summary +=
      lang === "kk"
        ? ` Салыстырмалы кезеңге өзгеріс ${delta}.`
        : ` Изменение к сравнимому периоду ${delta}.`;
  }

  if (d.topContributor) {
    const c = d.topContributor;
    bullets.push(
      lang === "kk"
        ? `Ең үлкен үлес: ${c.label} (${round1(c.share)}%).`
        : `Наибольший вклад: ${c.label} (${round1(c.share)}%).`,
    );
  }
  if (d.series.length >= 2) {
    const sorted = [...d.series].sort((a, b) => b.value - a.value);
    const top = sorted[0];
    bullets.push(
      lang === "kk"
        ? `Ең жоғары нүкте: ${top.label} (${formatValue(top.value, d.primaryFormat, lang)}).`
        : `Пиковая точка: ${top.label} (${formatValue(top.value, d.primaryFormat, lang)}).`,
    );
  }

  const nextCheck =
    lang === "kk"
      ? "Әрі қарай: сол кезеңдегі басқа кесінді бойынша тексеру."
      : "Что проверить дальше: разбивку по другому измерению за тот же период.";

  return { summary, bullets: bullets.slice(0, 3), nextCheck };
}

export function templateFollowups(pack: Pack, usedDims: string[]): string[] {
  const cats = Object.values(pack.dimensions).filter((d) => d.kind === "category");
  const unused = cats.filter((d) => !usedDims.includes(d.id)).slice(0, 2);
  const out = unused.map((d) => `Разложить по «${loc(d.title)}»`);
  out.push("Показать динамику по месяцам");
  return out.slice(0, 3);
}
