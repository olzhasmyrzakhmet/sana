export type Row = Record<string, string | number | null>;

export interface Kpi {
  id: string;
  title: string;
  format: "money" | "number" | "percent";
  value: string;
  raw: number;
  deltaPct: number | null;
  direction: "up" | "down" | "flat" | null;
  good: boolean | null;
}

export interface ChartSpec {
  type: "kpi" | "line" | "bar" | "donut" | "stacked-bar" | "table";
  x?: string;
  series?: string[];
  category?: string;
  stack?: string;
  valueKey?: string;
}

export interface Column {
  key: string;
  title: string;
  kind: "dim" | "metric";
  format?: "money" | "number" | "percent";
}

export interface MetricDef {
  id: string;
  title: string;
  sqlExpr: string;
  format: "money" | "number" | "percent";
}

export interface AskOk {
  ok: true;
  engine: "anthropic" | "fallback";
  scoped: boolean;
  scopedRegion: string | null;
  plan: unknown;
  planHuman: string;
  sql: string;
  rows: Row[];
  rowCount: number;
  durationMs: number;
  chart: ChartSpec;
  kpis: Kpi[];
  table: { columns: Column[]; rows: Row[] };
  insight: { summary: string; bullets: string[]; nextCheck: string };
  followups: string[];
  metricDefs: MetricDef[];
  recorded: boolean;
  clarify?: undefined;
}

export interface AskClarify {
  ok: true;
  clarify: string;
  suggestions: string[];
  engine: "anthropic" | "fallback";
  scoped: false;
}

export type AskResponse = AskOk | AskClarify;

export function isClarify(r: AskResponse): r is AskClarify {
  return "clarify" in r && typeof r.clarify === "string";
}

export interface ClientPackMeta {
  id: "auto" | "retail" | "bank";
  title: string;
  sampleQuestions: { ru: string; kk?: string }[];
}

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  role: "CEO" | "REGION" | "ANALYST";
  scope: Record<string, unknown> | null;
}

export interface HistoryItem {
  id: number;
  pack: string;
  question: string;
  rowCount: number;
  durationMs: number;
  createdAt: string;
}

/** Один элемент ленты ответов в воркспейсе. */
export interface FeedItem {
  id: string;
  question: string;
  pack: string;
  status: "loading" | "done" | "error";
  response?: AskResponse;
  error?: string;
}
