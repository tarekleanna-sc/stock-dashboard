'use client';

import { useMemo, useCallback } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import AllocationTargetEditor from '@/components/rebalance/AllocationTargetEditor';
import RebalanceSuggestionList from '@/components/rebalance/RebalanceSuggestionList';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useSupabase } from '@/providers/SupabaseProvider';
import { calculateRebalanceSuggestions } from '@/lib/analysis/rebalance';

export default function RebalancePage() {
  const { supabase, user } = useSupabase();
  const { enrichedPositions, totalValue, isLoading } = usePortfolioValue();
  const { targetAllocations, setTargetAllocation, clearTargetAllocations } = usePortfolioStore();

  const suggestions = useMemo(
    () => calculateRebalanceSuggestions(enrichedPositions, targetAllocations, totalValue),
    [enrichedPositions, targetAllocations, totalValue]
  );

  const handleChange = useCallback(
    (ticker: string, value: number) => {
      if (!user) return;
      setTargetAllocation(ticker, value, supabase, user.id);
    },
    [user, supabase, setTargetAllocation]
  );

  const handleEqualWeight = useCallback(() => {
    if (!user || enrichedPositions.length === 0) return;
    const equalPct = parseFloat((100 / enrichedPositions.length).toFixed(1));
    enrichedPositions.forEach((p) => {
      setTargetAllocation(p.ticker, equalPct, supabase, user.id);
    });
  }, [user, supabase, enrichedPositions, setTargetAllocation]);

  const handleClear = useCallback(() => {
    if (!user) return;
    clearTargetAllocations(supabase, user.id);
  }, [user, supabase, clearTargetAllocations]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rebalance" description="Set target allocations and see what to buy or trim" />
        <GlassCard className="p-12 text-center">
          <div className="animate-pulse text-white/50">Loading portfolio data...</div>
        </GlassCard>
      </div>
    );
  }

  if (enrichedPositions.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rebalance" description="Set target allocations and see what to buy or trim" />
        <GlassCard className="p-12 text-center">
          <div className="text-4xl mb-4">⚖️</div>
          <h3 className="text-lg font-semibold text-white mb-2">No Positions Yet</h3>
          <p className="text-white/50">
            Add positions to your portfolio to start rebalancing.
          </p>
        </GlassCard>
      </div>
    );
  }

  const totalTarget = Object.values(targetAllocations).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Rebalance" description="Set target allocations and see what to buy or trim" />

      {/* Info banner when no targets set */}
      {totalTarget === 0 && (
        <GlassCard className="p-4 border border-cyan-500/20 bg-cyan-500/5">
          <p className="text-sm text-cyan-300/80">
            Enter your target allocation percentages below, or click <strong>Equal Weight</strong> to distribute evenly.
            Suggestions will appear once targets are set.
          </p>
        </GlassCard>
      )}

      {/* Target Allocation Editor */}
      <AllocationTargetEditor
        positions={enrichedPositions}
        targetAllocations={targetAllocations}
        onChange={handleChange}
        onEqualWeight={handleEqualWeight}
        onClear={handleClear}
      />

      {/* Rebalance Suggestions */}
      {totalTarget > 0 && (
        <RebalanceSuggestionList suggestions={suggestions} />
      )}

      {/* Disclaimer */}
      <GlassCard className="p-4">
        <p className="text-xs text-white/40 text-center leading-relaxed">
          Rebalance suggestions are for informational purposes only and do not constitute financial advice.
          Always consult a licensed advisor before making investment decisions.
        </p>
      </GlassCard>
    </div>
  );
}
