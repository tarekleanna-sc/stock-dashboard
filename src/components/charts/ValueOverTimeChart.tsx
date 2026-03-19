'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils/formatting';

interface ValueOverTimeChartProps {
  snapshots: { date: string; totalValue: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a4e]/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-white text-sm">
      <p className="text-white/60">{label}</p>
      <p className="font-medium">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export default function ValueOverTimeChart({ snapshots }: ValueOverTimeChartProps) {
  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-white/40 text-sm">
        Portfolio history will build over time as you track your positions.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={snapshots} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
        <defs>
          <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#ffffff60', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#ffffff60', fontSize: 12 }}
          tickFormatter={(v) => formatCompactCurrency(v)}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="totalValue"
          stroke="#06b6d4"
          strokeWidth={2}
          fill="url(#valueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
