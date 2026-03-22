'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { PositionWithMarketData } from '@/types/portfolio';
import { calculateSectorAllocation } from '@/lib/utils/calculations';
import { CHART_COLORS } from '@/lib/utils/constants';

interface SectorBreakdownChartProps {
  positions: PositionWithMarketData[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { sector, allocation } = payload[0].payload;
  return (
    <div className="bg-[#0d0e18]/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-white text-sm">
      <p className="font-medium">{sector}</p>
      <p className="text-white/60">{allocation.toFixed(1)}%</p>
    </div>
  );
};

export default function SectorBreakdownChart({ positions }: SectorBreakdownChartProps) {
  const data = calculateSectorAllocation(positions);

  if (data.length === 0 || (data.length === 1 && data[0].sector === 'Unknown')) {
    return (
      <div className="flex items-center justify-center h-[300px] text-white/30 text-sm">
        Sector data loads after market prices update
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: '#ffffff60', fontSize: 12 }}
          tickFormatter={(v) => `${v}%`}
          axisLine={false}
          tickLine={false}
          domain={[0, 'auto']}
        />
        <YAxis
          type="category"
          dataKey="sector"
          tick={{ fill: '#ffffff60', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
        <Bar dataKey="allocation" radius={[0, 4, 4, 0]} maxBarSize={30}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
