'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils/formatting';

interface CompoundGrowthChartProps {
  data: { year: string; value: number }[];
  startValue: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a4e]/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-white text-sm">
      <p className="text-white/60 mb-1">{label}</p>
      <p className="font-semibold text-cyan-300">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export default function CompoundGrowthChart({ data, startValue }: CompoundGrowthChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
        <defs>
          <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
        <XAxis
          dataKey="year"
          tick={{ fill: '#ffffff60', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#ffffff60', fontSize: 12 }}
          tickFormatter={(v) => formatCompactCurrency(v)}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={startValue}
          stroke="rgba(255,255,255,0.12)"
          strokeDasharray="4 4"
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#06b6d4"
          strokeWidth={2}
          fill="url(#forecastGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#06b6d4', stroke: '#1a1a4e', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
