'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { PositionWithMarketData, BrokerAccount } from '@/types/portfolio';
import { formatPercent } from '@/lib/utils/formatting';
import { POSITIVE_COLOR, NEGATIVE_COLOR } from '@/lib/utils/constants';

interface PerformanceLineChartProps {
  positions: PositionWithMarketData[];
  accounts: BrokerAccount[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, gainLossPercent } = payload[0].payload;
  return (
    <div className="bg-[#1a1a4e]/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-white text-sm">
      <p className="font-medium">{name}</p>
      <p className={gainLossPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
        {formatPercent(gainLossPercent)}
      </p>
    </div>
  );
};

export default function PerformanceLineChart({ positions, accounts }: PerformanceLineChartProps) {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  const grouped = positions.reduce<Record<string, { costBasis: number; marketValue: number }>>((acc, pos) => {
    const key = pos.accountId;
    if (!acc[key]) acc[key] = { costBasis: 0, marketValue: 0 };
    acc[key].costBasis += pos.totalCostBasis;
    acc[key].marketValue += pos.marketValue;
    return acc;
  }, {});

  const data = Object.entries(grouped).map(([accountId, vals]) => {
    const gainLossPercent = vals.costBasis > 0
      ? ((vals.marketValue - vals.costBasis) / vals.costBasis) * 100
      : 0;
    return {
      name: accountMap.get(accountId) || accountId,
      gainLossPercent: parseFloat(gainLossPercent.toFixed(2)),
    };
  });

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
        <Bar dataKey="gainLossPercent" radius={[0, 4, 4, 0]} maxBarSize={30}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.gainLossPercent >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
