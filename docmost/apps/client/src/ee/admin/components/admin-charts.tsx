import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Text } from "@mantine/core";

const PALETTE = ["#2383e2", "#0f9d58", "#f4b400", "#db4437", "#9333ea", "#0891b2", "#e07b39"];
const GRID_COLOR = "#e9e8e4";
const AXIS_COLOR = "#9b978f";

function fmtBytes(n: number) {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
}

const tooltipStyle = {
  contentStyle: {
    borderRadius: 8,
    border: "1px solid #e9e8e4",
    fontSize: 12,
  },
};

export function UsersAreaChart({
  data,
}: {
  data: { month: string; count: number }[];
}) {
  if (!data || !data.length) {
    return (
      <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Text size="sm" c="dimmed">No data yet</Text>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2383e2" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2383e2" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: AXIS_COLOR }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: AXIS_COLOR }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip {...tooltipStyle} />
        <Area
          type="monotone"
          dataKey="count"
          name="Users"
          stroke="#2383e2"
          strokeWidth={2}
          fill="url(#chartGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PagesBySpaceChart({
  data,
}: {
  data: { space: string; count: number }[];
}) {
  if (!data || !data.length) {
    return (
      <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Text size="sm" c="dimmed">No pages yet</Text>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
      >
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="space"
          tick={{ fontSize: 11, fill: AXIS_COLOR }}
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={50}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: AXIS_COLOR }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="count" name="Pages" radius={[4, 4, 0, 0]} fill="#0f9d58" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StoragePieChart({
  data,
}: {
  data: { kind: string; bytes: number; count: number }[];
}) {
  if (!data || !data.length) {
    return (
      <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Text size="sm" c="dimmed">No files yet</Text>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="bytes"
          nameKey="kind"
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={80}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip
          {...tooltipStyle}
          formatter={(v: any) => fmtBytes(Number(v))}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
