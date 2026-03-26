'use client';

import { useState, useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import AllocationPieChart from '@/components/charts/AllocationPieChart';
import PerformanceLineChart from '@/components/charts/PerformanceLineChart';
import SectorBreakdownChart from '@/components/charts/SectorBreakdownChart';
import ValueOverTimeChart from '@/components/charts/ValueOverTimeChart';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';
import { usePortfolioStore } from '@/stores/portfolioStore';

type DateRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: '1Y', value: '1Y' },
  { label: 'All', value: 'ALL' },
];

function getDateCutoff(range: DateRange): Date | null {
  const now = new Date();
  if (range === 'ALL') return null;
  const cutoff = new Date(now);
  if (range === '1M') cutoff.setMonth(now.getMonth() - 1);
  if (range === '3M') cutoff.setMonth(now.getMonth() - 3);
  if (range === '6M') cutoff.setMonth(now.getMonth() - 6);
  if (range === '1Y') cutoff.setFullYear(now.getFullYear() - 1);
  return cutoff;
}

export default function ChartsPage() {
  const { enrichedPositions, isLoading } = usePortfolioValue();
  const { accounts, snapshots } = usePortfolioStore();

  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>('ALL');

  // Filter positions by selected account
  const filteredPositions = useMemo(() => {
    if (selectedAccountId === 'all') return enrichedPositions;
    return enrichedPositions.filter((p) => p.accountId === selectedAccountId);
  }, [enrichedPositions, selectedAccountId]);

  // Filter snapshots by date range
  const filteredSnapshots = useMemo(() => {
    const cutoff = getDateCutoff(dateRange);
    if (!cutoff) return snapshots;
    return snapshots.filter((s) => new Date(s.date) >= cutoff);
  }, [snapshots, dateRange]);

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

  const selectedAccountName =
    selectedAccountId === 'all'
      ? 'All Accounts'
      : accounts.find((a) => a.id === selectedAccountId)?.name ?? 'Account';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <PageHeader
          title="Charts"
          description={`Showing: ${selectedAccountName}`}
        />

        {/* Account Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-white/40">Account:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedAccountId('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedAccountId === 'all'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/[0.05] text-white/50 hover:text-white/70 border border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              All
            </button>
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => setSelectedAccountId(account.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedAccountId === account.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-white/[0.05] text-white/50 hover:text-white/70 border border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                {account.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Position-based charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-white/80 text-sm font-medium mb-4">Allocation by Ticker</h3>
          <div className="min-h-[300px]">
            <AllocationPieChart positions={filteredPositions} type="ticker" />
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-white/80 text-sm font-medium mb-4">Allocation by Sector</h3>
          <div className="min-h-[300px]">
            <AllocationPieChart positions={filteredPositions} type="sector" />
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-white/80 text-sm font-medium mb-4">Account Performance</h3>
          <div className="min-h-[300px]">
            <PerformanceLineChart
              positions={selectedAccountId === 'all' ? enrichedPositions : filteredPositions}
              accounts={accounts}
            />
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-white/80 text-sm font-medium mb-4">Sector Breakdown</h3>
          <div className="min-h-[300px]">
            <SectorBreakdownChart positions={filteredPositions} />
          </div>
        </GlassCard>
      </div>

      {/* Portfolio Value Over Time with date range filter */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-white/80 text-sm font-medium">Portfolio Value Over Time</h3>

          {/* Date range buttons */}
          <div className="flex items-center gap-1">
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  dateRange === opt.value
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05] border border-transparent'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[300px]">
          <ValueOverTimeChart snapshots={filteredSnapshots} />
        </div>

        {snapshots.length > 0 && filteredSnapshots.length === 0 && (
          <p className="text-center text-xs text-white/30 mt-2">
            No snapshots in this date range. Try a wider range.
          </p>
        )}
      </GlassCard>
    </div>
  );
}
