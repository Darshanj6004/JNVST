import {
  Area,
  AreaChart,
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const ink = "#0f172a";
const muted = "#64748b";
const line = "#e5e7eb";
const brand = "#2563eb";

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  boxShadow: "0 12px 32px -6px rgb(15 23 42 / 0.12)",
  fontSize: 13,
  padding: "8px 12px",
};

const axisProps = {
  stroke: muted,
  tick: { fill: muted, fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;

/** Score over time vs a recessive class-average reference line. */
export function ScoreTrend({
  data,
  height = 240,
}: {
  data: { label: string; score: number; average: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={brand} stopOpacity={0.16} />
            <stop offset="100%" stopColor={brand} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={line} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} domain={[0, 100]} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: line }} />
        <Area
          type="monotone"
          dataKey="average"
          name="Class average"
          stroke={muted}
          strokeDasharray="4 4"
          strokeWidth={2}
          fill="none"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="score"
          name="Your score"
          stroke={brand}
          strokeWidth={2.5}
          fill="url(#scoreFill)"
          dot={{ r: 3, fill: brand, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: brand, stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Single-hue magnitude bars (accuracy per subject/topic). */
export function AccuracyBars({
  data,
  height = 240,
  color = brand,
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }} barCategoryGap={22}>
        <CartesianGrid vertical={false} stroke={line} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} domain={[0, 100]} unit="%" />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f1f5f9" }} />
        <Bar dataKey="value" name="Accuracy" fill={color} radius={[6, 6, 0, 0]} maxBarSize={54} />
      </ReBarChart>
    </ResponsiveContainer>
  );
}

const bandColors: Record<string, string> = {
  strong: "#16a34a",
  average: "#d97706",
  weak: "#dc2626",
};

/** Donut for strong/average/weak distribution (status palette). */
export function BandDonut({
  data,
  height = 200,
}: {
  data: { name: string; value: number; key: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="62%"
          outerRadius="90%"
          paddingAngle={3}
          stroke="#fff"
          strokeWidth={2}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={bandColors[d.key] ?? brand} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Hand-built SVG progress ring for a single headline percentage. */
export function ProgressRing({
  value,
  size = 132,
  stroke = 12,
  color = brand,
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f7" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset .7s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-ink tabular leading-none">{label ?? `${value}%`}</span>
        {sublabel && <span className="mt-1 text-[11px] font-medium text-muted">{sublabel}</span>}
      </div>
    </div>
  );
}
