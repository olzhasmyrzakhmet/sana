"use client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const trend = [
  { m: "Июл", v: 820 }, { m: "Авг", v: 910 }, { m: "Сен", v: 870 }, { m: "Окт", v: 990 },
  { m: "Ноя", v: 1040 }, { m: "Дек", v: 1180 }, { m: "Янв", v: 1010 }, { m: "Фев", v: 1090 },
  { m: "Мар", v: 1220 }, { m: "Апр", v: 1300 }, { m: "Май", v: 1360 }, { m: "Июн", v: 1410 },
];
const bars = [
  { r: "Алматы", v: 4200 }, { r: "Астана", v: 3100 }, { r: "Шымкент", v: 2400 },
  { r: "Караганда", v: 1900 }, { r: "Актобе", v: 1500 },
];

export function LegacyDashboard() {
  return (
    <div style={{ background: "#eef2f6", minHeight: "100vh" }} className="text-slate-800">
      {/* Шапка «чужого» продукта */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-sm font-bold text-white">KA</div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Kaz-Analytics BI</div>
            <div className="text-[11px] text-slate-500">Корпоративная витрина · v3.2</div>
          </div>
          <nav className="ml-auto hidden gap-4 text-sm text-slate-500 sm:flex">
            <span className="font-medium text-blue-600">Обзор</span>
            <span>Продажи</span>
            <span>Отчёты</span>
            <span>Настройки</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold text-slate-900">Сводный дашборд продаж</h1>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Выручка, ₸", "13.7 млрд"],
            ["Продаж, шт", "48 210"],
            ["Средний чек", "284 тыс"],
            ["NPS", "72"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">{k}</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{v}</div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 text-sm font-medium text-slate-700">Динамика выручки, млн ₸</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip />
                  <Line type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 text-sm font-medium text-slate-700">Выручка по регионам, млн ₸</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bars}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="r" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} />
                  <Bar dataKey="v" fill="#2563eb" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <p className="mt-6 text-xs text-slate-400">
          Это демонстрационный «существующий корпоративный дашборд». Плавающая кнопка SANA внизу справа
          живёт поверх него — тот же виджет можно встроить в вашу настоящую BI.
        </p>
      </main>
    </div>
  );
}
