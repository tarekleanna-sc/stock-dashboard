'use client';

import PageHeader from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import AllocationPieChart from '@/components/charts/AllocationPieChart';
import PerformanceLineChart from '@/components/charts/PerformanceLineChart';
import SectorBreakdownChart from '@/components/charts/SectorBreakdownChart';
import ValueOverTimeChart from '@/components/charts/ValueOverTimeChart';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';
import { usePortfolioStore } from '@/stores/portfolioStore';

export default function ChartsPage() {
  const { enrichedPositions, isLoading } = usePortfolioValue();
  const { accounts, snapshots } = usePortfolioStore();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Charts" description="Visualize your portfolio across all accounts" />
        <div className="flex items-center justify-center min-h-[300px] text-white/40">
          Loading...
        </div>
      </div>
    );
  }

  if (!enrichedPositions || enrichedPositions.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Charts" description="Visualize your portfolio across all accounts" />
        <div className="flex items-center justify-center min-h-[300px] text-white/40 text-sm">
          Add positions to your portfolio to see charts
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Charts" description="Visualize your portfolio across all accounts" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-white/80 text-sm font-medium mb-4">Allocation by Ticker</h3>
          <div className="min-h-[300px]">
            <AllocationPieChart positions={enrichedPositions} type="ticker" />
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-white/80 text-sm font-medium mb-4">Allocation by Sector</h3>
          <div className="min-h-[300px]">
            <AllocationPieChart positions={enrichedPositions} type="sector" />
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-white/80 text-sm font-medium mb-4">Account Performance</h3>
          <div className="min-h-[300px]">
            <PerformanceLineChart positions={enrichedPositions} accounts={accounts} />
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-white/80 text-sm font-medium mb-4">Sector Breakdown</h3>
          <div className="min-h-[300px]">
            <SectorBreakdownChart positions={enrichedPositions} />
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="text-white/80 text-sm font-medium mb-4">Portfolio Value Over Time</h3>
        <div className="min-h-[300px]">
          <ValueOverTimeChart snapshots={snapshots ?? []} />
        </div>
      </GlassCard>
    </div>
  );
}
