import { getDb } from "../data/db";
import { getPack, isPackId } from "../semantic/registry";
import type { Pack, MetricFormat } from "../semantic/types";
import { loc } from "../semantic/types";
import { formatValue, round1 } from "../format";

// SPEC §10 — детерминированные авто-инсайты: z-score помесячно по дилеру/бренду,
// |z|>2 → кандидат; топ-3. Никакой магии, воспроизводимо.

export interface InsightCard {
  id: string;
  title: string;
  detail: string;
  metric: string;
  format: MetricFormat;
  series: { label: string; value: number }[];
  z: number;
}

interface Combo {
  metric: string;
  dim: string;
}

const COMBOS: Record<string, Combo[]> = {
  auto: [
    { metric: "units", dim: "dealer" },
    { metric: "revenue", dim: "dealer" },
    { metric: "avg_discount", dim: "brand" },
  ],
  retail: [
    { metric: "revenue", dim: "store" },
    { metric: "returns", dim: "category" },
    { metric: "units", dim: "category" },
  ],
  bank: [
    { metric: "issued", dim: "branch" },
    { metric: "balance", dim: "branch" },
    { metric: "issued", dim: "product" },
  ],
};

function joinsSql(pack: Pack): string {
  return pack.joins.map((j) => ` JOIN ${j.table} ON ${j.on}`).join("");
}

interface Candidate {
  key: string;
  label: string;
  metric: string;
  format: MetricFormat;
  month: string;
  z: number;
  value: number;
  mean: number;
  series: { label: string; value: number }[];
}

async function comboCandidates(pack: Pack, combo: Combo): Promise<Candidate[]> {
  const db = await getDb();
  const metric = pack.metrics[combo.metric];
  const dim = pack.dimensions[combo.dim];
  if (!metric || !dim) return [];
  const monthExpr = `strftime('%Y-%m', ${pack.timeField})`;
  const sql = `SELECT ${monthExpr} AS m, ${dim.sqlExpr} AS label, ${metric.sqlExpr} AS v
               FROM ${pack.factTable}${joinsSql(pack)}
               GROUP BY m, label ORDER BY m`;
  const res = await db.execute(sql);
  const rows = res.rows as Record<string, unknown>[];

  const byLabel = new Map<string, { m: string; v: number }[]>();
  for (const r of rows) {
    const label = String(r.label ?? "");
    const arr = byLabel.get(label) ?? [];
    arr.push({ m: String(r.m), v: Number(r.v) });
    byLabel.set(label, arr);
  }

  const out: Candidate[] = [];
  for (const [label, points] of byLabel) {
    if (points.length < 6) continue;
    const vals = points.map((p) => p.v);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    const std = Math.sqrt(variance);
    if (std === 0) continue;
    let best: { m: string; v: number; z: number } | null = null;
    for (const p of points) {
      const z = (p.v - mean) / std;
      if (!best || Math.abs(z) > Math.abs(best.z)) best = { m: p.m, v: p.v, z };
    }
    if (best && Math.abs(best.z) > 2) {
      out.push({
        key: `${combo.metric}:${label}`,
        label,
        metric: combo.metric,
        format: metric.format,
        month: best.m,
        z: best.z,
        value: best.v,
        mean,
        series: points.map((p) => ({ label: p.m, value: p.v })),
      });
    }
  }
  return out;
}

function titleFor(c: Candidate, pack: Pack): string {
  const mTitle = loc(pack.metrics[c.metric].title);
  const up = c.z > 0;
  if (c.metric === "avg_discount") return `Скачок скидок: ${c.label}`;
  if (c.metric === "returns") return `Рост возвратов: ${c.label}`;
  if (up) return `Всплеск «${mTitle}»: ${c.label}`;
  return `Провал «${mTitle}»: ${c.label}`;
}

function detailFor(c: Candidate, pack: Pack): string {
  const mTitle = loc(pack.metrics[c.metric].title).toLowerCase();
  const val = formatValue(c.value, c.format);
  const mean = formatValue(c.mean, c.format);
  return `В ${c.month} «${mTitle}» = ${val} (среднее ${mean}, отклонение z=${round1(c.z)}).`;
}

export async function computeInsights(packId: string): Promise<InsightCard[]> {
  if (!isPackId(packId)) return [];
  const pack = getPack(packId);
  const combos = COMBOS[packId] ?? [];
  const all: Candidate[] = [];
  for (const combo of combos) {
    try {
      all.push(...(await comboCandidates(pack, combo)));
    } catch {
      /* пропускаем сбойный combo */
    }
  }
  // топ-3 по |z|, уникальные по метрике+label
  all.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
  const seen = new Set<string>();
  const top: InsightCard[] = [];
  for (const c of all) {
    if (seen.has(c.key)) continue;
    seen.add(c.key);
    top.push({
      id: c.key,
      title: titleFor(c, pack),
      detail: detailFor(c, pack),
      metric: c.metric,
      format: c.format,
      series: c.series,
      z: round1(c.z),
    });
    if (top.length >= 3) break;
  }
  return top;
}
