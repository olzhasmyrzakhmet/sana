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

export function formatDeltaPct(pct: number | null): string {
  if (pct === null || !Number.isFinite(pct)) return "";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${round1(pct)}%`;
}
