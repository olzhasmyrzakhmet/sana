// Semantic Layer SANA — источник истины (SPEC §4).
// LLM выбирает id отсюда → строгий JSON-план → компилятор собирает SQL из этих whitelist-фрагментов.

export type LString = { ru: string; kk?: string };

export type MetricFormat = "money" | "number" | "percent";
export type Grain = "day" | "month" | "quarter" | "year";

export interface Metric {
  id: string;
  title: LString;
  /** SQL-агрегат из whitelist, напр. 'SUM(s.revenue)'. НИКОГДА не содержит пользовательский ввод. */
  sqlExpr: string;
  format: MetricFormat;
  goodDirection?: "up" | "down";
}

export interface Dimension {
  id: string;
  title: LString;
  /** SQL-выражение колонки из whitelist, напр. 'dl.region'. */
  sqlExpr: string;
  kind: "category" | "time";
  grains?: Grain[];
}

export interface Join {
  /** напр. 'dealers dl' */
  table: string;
  /** напр. 's.dealer_id = dl.id' */
  on: string;
}

export type PackId = "auto" | "retail" | "bank";

export interface Pack {
  id: PackId;
  title: LString;
  /** Основная таблица фактов с алиасом, напр. 'auto_sales s'. */
  factTable: string;
  /** Whitelist join-фрагментов. */
  joins: Join[];
  /** Поле времени, напр. 's.d'. */
  timeField: string;
  metrics: Record<string, Metric>;
  dimensions: Record<string, Dimension>;
  /** Синонимы: canonicalId → список слов (рус+каз) для mock-роутера и подсказок. */
  synonyms: Record<string, string[]>;
  /** ≥12 RU + ≥6 KK. */
  sampleQuestions: { ru: string; kk?: string }[];
  /** Измерение для RBAC-scope, напр. 'region'. */
  rbacDimension?: string;
  /** Метрика по умолчанию (если вопрос без явной метрики). */
  defaultMetric: string;
}

/** Локализованный текст → строка по языку (fallback на ru). */
export function loc(s: LString, lang: "ru" | "kk" = "ru"): string {
  if (lang === "kk" && s.kk) return s.kk;
  return s.ru;
}
