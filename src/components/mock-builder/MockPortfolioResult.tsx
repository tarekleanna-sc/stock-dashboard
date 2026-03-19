'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { MockPortfolioResult as MockPortfolioResultType } from '@/types/analysis';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency, formatPercent } from '@/lib/utils/formatting';
import { CHART_COLORS, POSITIVE_COLOR, NEGATIVE_COLOR } from '@/lib/utils/constants';

interface MockPortfolioResultProps {
  result: MockPortfolioResultType;
}

export default function MockPortfolioResult({ result }: MockPortfolioResultProps) {
  const pieData = result.allocations.map((a, i) => ({
    name: a.ticker,
    value: a.allocation,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const returnData = [
    { name: 'Low', value: result.expectedReturn.low, fill: '#f59e0b' },
    { name: 'Mid', value: result.expectedReturn.mid, fill: POSITIVE_COLOR },
    { name: 'High', value: result.expectedReturn.high, fill: '#06b6d4' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5 text-center">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Total Invested</div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {formatCurrency(result.totalInvested)}
          </div>
          {result.config.accountSize - result.totalInvested > 0 && (
            <div className="text-xs text-white/40 mt-1">
              {formatCurrency(result.config.accountSize - result.totalInvested)} cash remaining
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5 text-center">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Expected Return</div>
          <div className="text-2xl font-bold text-emerald-400 tabular-nums">
            {result.expectedReturn.low}% - {result.expectedReturn.high}%
          </div>
          <div className="text-xs text-white/40 mt-1">
            Mid: {result.expectedReturn.mid}% annually
          </div>
        </GlassCard>

        <GlassCard className="p-5 text-center">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Expected Volatility</div>
          <div className="text-2xl font-bold text-amber-400 tabular-nums">
            {result.expectedVolatility}%
          </div>
          <div className="text-xs text-white/40 mt-1">Annualized standard deviation</div>
        </GlassCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <GlassCard className="p-6">
          <h4 className="text-sm font-medium text-white/60 mb-4">Portfolio Allocation</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                  formatter={(value) => [formatPercent(Number(value ?? 0)), 'Allocation']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1 text-xs text-white/60">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                {item.name}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Return Expectations */}
        <GlassCard className="p-6">
          <h4 className="text-sm font-medium text-white/60 mb-4">Expected Annual Returns</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={returnData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                  formatter={(value) => [`${value}%`, 'Return']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {returnData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Allocation Table */}
      <GlassCard className="p-6">
        <h4 className="text-sm font-medium text-white/60 mb-4">Position Details</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-white/40 uppercase tracking-wider border-b border-white/10">
                <th className="text-left pb-3 pr-4">Ticker</th>
                <th className="text-right pb-3 px-4">Shares</th>
                <th className="text-right pb-3 px-4">Est. Price</th>
                <th className="text-right pb-3 px-4">Amount</th>
                <th className="text-right pb-3 px-4">Allocation</th>
                <th className="text-left pb-3 pl-4">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {result.allocations.map((alloc, i) => (
                <tr
                  key={alloc.ticker}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="font-medium text-white">{alloc.ticker}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-white/70 tabular-nums">
                    {alloc.shares}
                  </td>
                  <td className="text-right py-3 px-4 text-white/70 tabular-nums">
                    {formatCurrency(alloc.shares > 0 ? alloc.dollarAmount / alloc.shares : 0)}
                  </td>
                  <td className="text-right py-3 px-4 text-white tabular-nums">
                    {formatCurrency(alloc.dollarAmount)}
                  </td>
                  <td className="text-right py-3 px-4 text-cyan-300 tabular-nums">
                    {formatPercent(alloc.allocation)}
                  </td>
                  <td className="py-3 pl-4 text-xs text-white/40 max-w-xs">
                    {alloc.rationale}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
