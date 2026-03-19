'use client';

import { useMemo, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import PageHeader from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import AllocationTargetEditor from '@/components/rebalance/AllocationTargetEditor';
import RebalanceSuggestionList from '@/components/rebalance/RebalanceSuggestionList';
import { calculateRebalanceSuggestions } from '@/lib/analysis/rebalance';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { formatPercent } from '@/lib/utils/formatting';
import { CHART_COLORS } from '@/lib/utils/constants';

export default function RebalancePage() {
  const { enrichedPositions, totalValue, isLoading } = usePortfolioValue();
  const { targetAllocations, setTargetAllocation } = usePortfolioStore();

  const handleChange = useCallback(
    (ticker: string, value: number) => {
      setTargetAllocation(ticker, value);
    },
    [setTargetAllocation]
  );

  const handleEqualWeight = useCallback(() => {
    if (enrichedPositions.length === 0) return;
    const weight = parseFloat((100 / enrichedPositions.length).toFixed(1));
    enrichedPositions.forEach((p) => {
      setTargetAllocation(p.ticker, weight);
    });
  }, [enrichedPositions, setTargetAllocation]);

  const handleClear = useCallback(() => {
    enrichedPositions.forEach((p) => {
      setTargetAllocation(p.ticker, 0);
    });
  }, [enrichedPositions, setTargetAllocation]);

  const suggestions = useMemo(
    () =>
      calculateRebalanceSuggestions(
        enrichedPositions,
        targetAllocations,
        totalValue
      ),
    [enrichedPositions, targetAllocations, totalValue]
  );

  const currentAllocationData = useMemo(
    () =>
      enrichedPositions.map((p, i) => ({
        name: p.ticker,
        value: totalValue > 0 ? (p.marketValue / totalValue) * 100 : 0,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [enrichedPositions, totalValue]
  );

  const targetAllocationData = useMemo(
    () =>
      Object.entries(targetAllocations)
        .filter(([, v]) => v > 0)
        .map(([ticker, value], i) => ({
          name: ticker,
          value,
          fill: CHART_COLORS[i % CHART_COLORS.length],
        })),
    [targetAllocations]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rebalance" description="Optimize your portfolio allocation" />
        <GlassCard className="p-12 text-center">
          <div className="animate-pulse text-white/50">Loading portfolio data...</div>
        </GlassCard>
      </div>
    );
  }

  if (enrichedPositions.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rebalance" description="Optimize your portfolio allocation" />
        <GlassCard className="p-12 text-center">
          <div className="text-4xl mb-4">&#x2696;</div>
          <h3 className="text-lg font-semibold text-white mb-2">No Positions Yet</h3>
          <p className="text-white/50">
            Add positions to your portfolio to start rebalancing.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Rebalance" description="Optimize your portfolio allocation" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Target Editor */}
        <div className="lg:col-span-2">
          <AllocationTargetEditor
            positions={enrichedPositions}
            targetAllocations={targetAllocations}
            onChange={handleChange}
            onEqualWeight={handleEqualWeight}
            onClear={handleClear}
          />
        </div>

        {/* Right: Donut Charts */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h4 className="text-sm font-medium text-white/60 mb-4 text-center">
              Current Allocation
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentAllocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {currentAllocationData.map((entry) => (
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
              {currentAllocationData.map((item) => (
                <div key={item.name} className="flex items-center gap-1 text-xs text-white/60">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  {item.name}
                </div>
              ))}
            </div>
          </GlassCard>

          {targetAllocationData.length > 0 && (
            <GlassCard className="p-6">
              <h4 className="text-sm font-medium text-white/60 mb-4 text-center">
                Target Allocation
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={targetAllocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {targetAllocationData.map((entry) => (
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
                      formatter={(value) => [formatPercent(Number(value ?? 0)), 'Target']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {targetAllocationData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1 text-xs text-white/60">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    {item.name}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Suggestions */}
      <RebalanceSuggestionList suggestions={suggestions} />
    </div>
  );
}
