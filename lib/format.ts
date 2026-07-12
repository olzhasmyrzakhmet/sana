import type { MetricFormat } from "./semantic/types";

// Форматирование чисел для UI и шаблонных выводов. tabular-nums на стороне UI.
export function formatValue(
  value: number | null | undefined,
  format: MetricFormat,
  lang: "ru" | "kk" = "ru",
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  switch (format) {
    case "money":
      return `${groupThousands(Math.round(value))} ₸`;
    case "percent":
      return `${round1(value)}%`;
    case "number":
    default:
      return groupThousands(Math.round(value));
  }
}

export function groupThousands(n: number): string {
  const neg = n < 0;
  const s = Math.abs(n).toString();
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) out += " "; // узкий неразрывный пробел
    out += s[i];
  }
  return (neg ? "-" : "") + out;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Компактный формат для осей графиков и мини-цифр. */
export function formatCompact(value: number, format: MetricFormat = "number"): string {
  if (!Number.isFinite(value)) return "—";
  if (format === "percent") return `${round1(value)}%`;
  const abs = Math.abs(value);
  let s: string;
  if (abs >= 1e9) s = `${round1(value / 1e9)} млрд`;
  else if (abs >= 1e6) s = `${round1(value / 1e6)} млн`;
  else if (abs >= 1e3) s = `${round1(value / 1e3)} тыс`;
  else s = groupThousands(Math.round(value));
  return format === "money" ? `${s} ₸` : s;
}

export function formatDeltaPct(pct: number | null): string {
  if (pct === null || !Number.isFinite(pct)) return "";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${round1(pct)}%`;
}
