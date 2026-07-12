"use client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { AskOk, Row } from "./types";
import { formatValue, formatCompact } from "@/lib/format";

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const axisStyle = { fontSize: 11, fill: "var(--muted-foreground)" };
const gridColor = "var(--border)";

function Tip({ active, payload, label, fmt }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      {label !== undefined && <div className="mb-1 text-muted-foreground">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-foreground">{p.name}:</span>
          <span className="tnum text-foreground">{formatValue(Number(p.value), fmt)}</span>
        </div>
      ))}
    </div>
  );
}

export function ChartAuto({ resp }: { resp: AskOk }) {
  const { chart, rows } = resp;
  const primaryFmt = resp.metricDefs[0]?.format ?? "number";

  if (chart.type === "kpi") return null;

  if (chart.type === "line") {
    const series = chart.series && chart.series.length ? chart.series : [chart.valueKey!].filter(Boolean);
    const x = chart.x ?? "";
    return (
      <div className="sana-rise h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey={x} tick={axisStyle} tickLine={false} axisLine={{ stroke: gridColor }} minTickGap={16} />
            <YAxis
              tick={axisStyle}
              tickLine={false}
              axisLine={false}
              width={54}
              tickFormatter={(v) => formatCompact(Number(v), primaryFmt)}
            />
            <Tooltip content={<Tip fmt={primaryFmt} />} />
            {series.map((s, i) => (
              <Line
                key={s}
                type="monotone"
                dataKey={s}
                name={resp.metricDefs.find((m) => m.id === s)?.title ?? s}
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.type === "bar" || chart.type === "stacked-bar") {
    const cat = chart.category ?? chart.x ?? resp.table.columns[0]?.key ?? "";
    const val = chart.valueKey ?? resp.metricDefs[0]?.id ?? "";
    return (
      <div className="sana-rise w-full" style={{ height: Math.max(200, rows.length * 34 + 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
            <CartesianGrid stroke={gridColor} horizontal={false} />
            <XAxis
              type="number"
              tick={axisStyle}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
              tickFormatter={(v) => formatCompact(Number(v), primaryFmt)}
            />
            <YAxis type="category" dataKey={cat} tick={axisStyle} tickLine={false} axisLine={false} width={130} />
            <Tooltip cursor={{ fill: "var(--accent)" }} content={<Tip fmt={primaryFmt} />} />
            <Bar dataKey={val} name={resp.metricDefs[0]?.title ?? val} radius={[0, 3, 3, 0]}>
              {rows.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.type === "donut") {
    const cat = chart.category ?? "";
    const val = chart.valueKey ?? resp.metricDefs[0]?.id ?? "";
    const data = rows.map((r: Row) => ({ name: String(r[cat] ?? ""), value: Number(r[val]) || 0 }));
    return (
      <div className="sana-rise h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2} stroke="var(--card)">
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={<Tip fmt={primaryFmt} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null; // table рендерится отдельно в AnswerCard
}
