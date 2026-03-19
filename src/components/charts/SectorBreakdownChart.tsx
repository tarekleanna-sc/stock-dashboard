'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { PositionWithMarketData } from '@/types/portfolio';
import { calculateSectorAllocation } from '@/lib/utils/calculations';
import { formatPercent } from '@/lib/utils/formatting';
import { CHART_COLORS } from '@/lib/utils/constants';

interface SectorBreakdownChartProps {
  positions: PositionWithMarketData[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, percent } = payload[0].payload;
  return (
    <div className="bg-[#1a1a4e]/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-white text-sm">
      <p className="font-medium">{name}</p>
      <p>{formatPercent(percent)}</p>
    </div>
  );
};

export default function SectorBreakdownChart({ positions }: SectorBreakdownChartProps) {
  const data = calculateSectorAllocation(positions);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: '#ffffff60', fontSize: 12 }}
          tickFormatter={(v) => `${v}%`}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#ffffff60', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={100}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
        <Bar dataKey="percent" radius={[0, 4, 4, 0]} maxBarSize={30}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
