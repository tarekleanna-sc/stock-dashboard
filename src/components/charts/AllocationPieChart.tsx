'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PositionWithMarketData } from '@/types/portfolio';
import { calculateAllocation, calculateSectorAllocation } from '@/lib/utils/calculations';
import { formatCurrency, formatPercent } from '@/lib/utils/formatting';
import { CHART_COLORS } from '@/lib/utils/constants';

interface AllocationPieChartProps {
  positions: PositionWithMarketData[];
  type: 'ticker' | 'sector';
}

interface ChartItem {
  name: string;
  value: number;
  percent: number;
}

export default function AllocationPieChart({ positions, type }: AllocationPieChartProps) {
  const raw = type === 'ticker'
    ? calculateAllocation(positions)
    : calculateSectorAllocation(positions);

  const data: ChartItem[] = raw.map((d) => ({
    name: 'ticker' in d ? d.ticker : d.sector,
    value: d.marketValue,
    percent: d.allocation,
  }));

  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return <p className="text-center text-white/30 py-8">No data to display</p>;
  }

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0].payload as ChartItem;
              return (
                <div className="bg-[#1a1a4e]/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-white text-sm">
                  <p className="font-medium">{item.name}</p>
                  <p>{formatCurrency(item.value)}</p>
                  <p>{formatPercent(item.percent)}</p>
                </div>
              );
            }}
          />
          <text
            x="50%"
            y="48%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-white text-sm font-medium"
          >
            Total
          </text>
          <text
            x="50%"
            y="56%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-white text-lg font-bold"
          >
            {formatCurrency(totalValue)}
          </text>
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 w-full px-4">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2 text-sm text-white/80">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span className="truncate">{item.name}</span>
            <span className="ml-auto text-white/50">{item.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
