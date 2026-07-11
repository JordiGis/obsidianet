"use client";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const PALETTE = ["#2383e2", "#0f9d58", "#f4b400", "#db4437", "#9333ea", "#0891b2", "#e07b39"];
const grid = "#ecebe7";
const axis = "#9b978f";

function fmtBytes(n: number) {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
}

const cardTip = {
  contentStyle: { borderRadius: 8, border: "1px solid #e9e8e4", fontSize: 12 },
};

export function UsersArea({ data }: { data: { month: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="u" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2383e2" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2383e2" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: axis }} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: axis }} tickLine={false} axisLine={false} />
        <Tooltip {...cardTip} />
        <Area type="monotone" dataKey="count" name="Usuarios" stroke="#2383e2" strokeWidth={2} fill="url(#u)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SpaceBars({ data }: { data: { space: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="space" tick={{ fontSize: 11, fill: axis }} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: axis }} tickLine={false} axisLine={false} />
        <Tooltip {...cardTip} />
        <Bar dataKey="count" name="Páginas" radius={[4, 4, 0, 0]} fill="#0f9d58" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StoragePie({ data }: { data: { kind: string; bytes: number; count: number }[] }) {
  if (!data.length) {
    return <div className="h-[220px] flex items-center justify-center text-sm text-notion-muted">Sin archivos todavía</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="bytes" nameKey="kind" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip {...cardTip} formatter={(v: any) => fmtBytes(Number(v))} />
      </PieChart>
    </ResponsiveContainer>
  );
}
