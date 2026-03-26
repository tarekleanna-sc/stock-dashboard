'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { AllocationBar } from '@/components/ui/AllocationBar';
import { StockLogo } from '@/components/ui/StockLogo';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';
import { useAutoSnapshot } from '@/hooks/useAutoSnapshot';
import { useStockLogos } from '@/hooks/useStockLogos';
import { useDividendData } from '@/hooks/useDividendData';
import { useRiskMetrics } from '@/hooks/useRiskMetrics';
import DividendCard from '@/components/dashboard/DividendCard';
import RiskMetricsCard from '@/components/dashboard/RiskMetricsCard';
import { formatCurrency } from '@/lib/utils/formatting';
import { calculateAllocation } from '@/lib/utils/calculations';
import { CHART_COLORS } from '@/lib/utils/constants';
import { ACCOUNT_TYPE_LABELS } from '@/types/portfolio';

function useLastUpdated(dataUpdatedAt: number): string {
  return useMemo(() => {
    if (!dataUpdatedAt) return '';
    const diffMs = Date.now() - dataUpdatedAt;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    return diffHr === 1 ? '1 hr ago' : `${diffHr} hr ago`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUpdatedAt]);
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

export default function DashboardPage() {
  const { accounts, positions, snapshots } = usePortfolioStore();
  const { enrichedPositions, totalValue, totalCostBasis, isLoading, refetch, dataUpdatedAt } = usePortfolioValue();

  // Auto-capture daily snapshot
  useAutoSnapshot(totalValue, isLoading);

  // Phase 3.2: Dividend data
  const dividendSummary = useDividendData(enrichedPositions);

  // Phase 3.3: Risk metrics
  const riskMetrics = useRiskMetrics(enrichedPositions, snapshots);

  const lastUpdatedLabel = useLastUpdated(dataUpdatedAt ?? 0);

  const totalGainLoss = totalValue - totalCostBasis;
  const totalGainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

  const allocation = calculateAllocation(enrichedPositions);
  const sortedAllocation = [...allocation].sort((a, b) => b.marketValue - a.marketValue);

  const allTickers = Array.from(new Set(positions.map((p) => p.ticker)));
  const logos = useStockLogos(allTickers);

  // Holdings search + sort state
  const [holdingsSearch, setHoldingsSearch] = useState('');
  const [sortKey, setSortKey] = useState<'marketValue' | 'gainLossPercent' | 'ticker'>('marketValue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const displayHoldings = useMemo(() => {
    // Enrich allocation with gain/loss data from enrichedPositions
    let items = sortedAllocation.map((h) => {
      const pos = enrichedPositions.find((p) => p.ticker === h.ticker);
      return {
        ...h,
        gainLossPercent: pos?.gainLossPercent ?? 0,
        dayChangePercent: pos?.dayChangePercent ?? 0,
      };
    });

    // Filter by search
    if (holdingsSearch.trim()) {
      const q = holdingsSearch.toLowerCase();
      items = items.filter(
        (h) =>
          h.ticker.toLowerCase().includes(q) ||
          h.companyName.toLowerCase().includes(q)
      );
    }

    // Sort
    items.sort((a, b) => {
      let diff = 0;
      if (sortKey === 'ticker') diff = a.ticker.localeCompare(b.ticker);
      else diff = a[sortKey] - b[sortKey];
      return sortDir === 'desc' ? -diff : diff;
    });

    return items;
  }, [sortedAllocation, enrichedPositions, holdingsSearch, sortKey, sortDir]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  // Allocation bar segments
  const barSegments = sortedAllocation.slice(0, 8).map((a, i) => ({
    ticker: a.ticker,
    allocation: a.allocation,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Per-account P&L (3.5 — includes cost basis)
  const accountStats = accounts.map((account) => {
    const acctPositions = enrichedPositions.filter((p) => p.accountId === account.id);
    const value = acctPositions.reduce((s, p) => s + (p.marketValue ?? 0), 0);
    const cost = acctPositions.reduce((s, p) => s + (p.totalCostBasis ?? 0), 0);
    const cashBalance = account.cashBalance ?? 0;
    const gainLoss = value - cost;
    const gainLossPercent = cost > 0 ? (gainLoss / cost) * 100 : 0;
    return { account, value, cost, cashBalance, gainLoss, gainLossPercent };
  });

  const hasPositions = positions.length > 0;

  if (!hasPositions) {
    return (
      <div>
        <div className="mb-8 flex items-start justify-between">
          <h1 className="text-2xl font-bold text-white">My Portfolio</h1>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center text-center mt-12"
        >
          <GlassCard className="max-w-md mx-auto">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Welcome to Your Portfolio</h3>
              <p className="text-white/50 text-sm">
                Add brokerage accounts and positions to see your complete portfolio overview.
              </p>
              <Link href="/portfolio">
                <GlassButton variant="primary" size="lg">Add Your First Account</GlassButton>
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6 flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">My Portfolio</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {positions.length} positions &middot; {accounts.length} accounts
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-right">
            <p className="text-2xl font-bold text-white">
              {isLoading ? '—' : formatCurrency(totalValue)}
            </p>
            {!isLoading && (
              <p className={`text-sm font-medium mt-0.5 ${totalGainLoss >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)} open P&L
              </p>
            )}
          </div>
          {/* Refresh button + last updated */}
          <div className="flex items-center gap-2 mt-1">
            {lastUpdatedLabel && (
              <span className="text-xs text-white/25">Updated {lastUpdatedLabel}</span>
            )}
            <button
              onClick={() => refetch?.()}
              disabled={isLoading}
              title="Refresh prices"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all disabled:opacity-40"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isLoading ? 'animate-spin' : ''}
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">

        {/* Main Portfolio Card */}
        <motion.div variants={item}>
          <GlassCard padding="lg">
            <p className="text-[11px] font-semibold tracking-[0.15em] text-white/30 uppercase mb-3">
              Total Portfolio
            </p>
            <p className="text-4xl font-bold text-white mb-3">
              {isLoading ? '—' : formatCurrency(totalValue)}
            </p>

            {/* Gain/Loss pill + cost basis (3.5) */}
            {!isLoading && (
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${
                    totalGainLoss >= 0
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-rose-500/15 text-rose-400'
                  }`}
                >
                  {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
                  {' '}({totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(1)}%)
                </span>
                <span className="text-sm text-white/30">open P&L</span>
                <span className="text-xs text-white/20 ml-1">
                  · Cost basis {formatCurrency(totalCostBasis)}
                </span>
              </div>
            )}

            {/* Allocation bar */}
            {barSegments.length > 0 && (
              <div className="mb-4">
                <AllocationBar segments={barSegments} height={10} />
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {sortedAllocation.slice(0, 6).map((a, i) => (
                <div key={a.ticker} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="font-semibold text-white/70">{a.ticker}</span>
                  <span className="text-white/40">{a.allocation.toFixed(0)}%</span>
                </div>
              ))}
              {sortedAllocation.length > 6 && (
                <span className="text-xs text-white/25">+{sortedAllocation.length - 6} more</span>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Account Cards Grid */}
        {accountStats.length > 0 && (
          <motion.div variants={item}>
            <div className="grid grid-cols-2 gap-3">
              {accountStats.map(({ account, value, cost, cashBalance, gainLoss, gainLossPercent }) => (
                <GlassCard key={account.id} padding="md" hover={false}>
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-white/30 uppercase mb-2 truncate">
                    {ACCOUNT_TYPE_LABELS[account.accountType] ?? account.name}
                  </p>
                  <p className="text-xl font-bold text-white mb-1">
                    {formatCurrency(value)}
                  </p>
                  <p className={`text-xs font-medium ${gainLoss >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                    {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
                    <span className="text-white/20 mx-1">&middot;</span>
                    {gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                  </p>
                  {/* 3.5 — cost basis on account card */}
                  <p className="text-[10px] text-white/20 mt-1">
                    Basis {formatCurrency(cost)}
                    {cashBalance > 0 && <span className="ml-1.5">+ {formatCurrency(cashBalance)} cash</span>}
                  </p>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}

        {/* 3.2 Dividend Card + 3.3 Risk Metrics */}
        {!isLoading && enrichedPositions.length > 0 && (
          <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <DividendCard summary={dividendSummary} />
            <RiskMetricsCard metrics={riskMetrics} isLoading={isLoading} />
          </motion.div>
        )}

        {/* Holdings */}
        <motion.div variants={item}>
          {/* Header row with search + sort */}
          <div className="flex items-center gap-2 mb-3 px-1 flex-wrap">
            <p className="text-[11px] font-semibold tracking-[0.15em] text-white/30 uppercase flex-1">
              Holdings
              {holdingsSearch && (
                <span className="ml-2 text-cyan-400/60 normal-case tracking-normal text-[10px]">
                  ({displayHoldings.length} of {sortedAllocation.length})
                </span>
              )}
            </p>

            {/* Sort pills */}
            <div className="flex items-center gap-1">
              {(['marketValue', 'gainLossPercent', 'ticker'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => toggleSort(key)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-0.5 ${
                    sortKey === key
                      ? 'bg-cyan-500/15 text-cyan-400'
                      : 'text-white/30 hover:text-white/60 hover:bg-white/[0.05]'
                  }`}
                >
                  {key === 'marketValue' ? 'Value' : key === 'gainLossPercent' ? 'Gain%' : 'A-Z'}
                  {sortKey === key && (
                    <span>{sortDir === 'desc' ? ' ↓' : ' ↑'}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Search input */}
            <input
              type="text"
              value={holdingsSearch}
              onChange={(e) => setHoldingsSearch(e.target.value)}
              placeholder="Search…"
              className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-white/70 placeholder:text-white/20 outline-none w-24 focus:w-36 focus:border-white/20 transition-all duration-200"
            />
          </div>

          <GlassCard padding="none">
            <div className="divide-y divide-white/[0.05]">
              {displayHoldings.length === 0 && (
                <div className="py-8 text-center text-sm text-white/30">
                  No holdings match &ldquo;{holdingsSearch}&rdquo;
                </div>
              )}
              {displayHoldings.map((holding, i) => {
                const gainLossPercent = holding.gainLossPercent;
                const isPositive = gainLossPercent >= 0;

                return (
                  <div
                    key={holding.ticker}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors"
                  >
                    <StockLogo
                      ticker={holding.ticker}
                      logoUrl={logos[holding.ticker]}
                      size={44}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{holding.ticker}</p>
                      <p className="text-xs text-white/40 truncate">
                        {holding.companyName}
                        <span className="text-white/20 mx-1">&middot;</span>
                        {holding.allocation.toFixed(1)}%
                      </p>
                      <div className="mt-1.5 h-1 w-20 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(holding.allocation, 100)}%`,
                            backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-white">
                        {formatCurrency(holding.marketValue)}
                      </p>
                      <p className={`text-xs font-medium ${isPositive ? 'text-green-400' : 'text-rose-400'}`}>
                        {isPositive ? '+' : ''}{gainLossPercent.toFixed(2)}%
                      </p>
                      {/* 3.5 cost basis per holding */}
                      {(() => {
                        const pos = enrichedPositions.find((p) => p.ticker === holding.ticker);
                        return pos && pos.totalCostBasis > 0 ? (
                          <p className="text-[10px] text-white/20 mt-0.5">
                            basis {formatCurrency(pos.totalCostBasis)}
                          </p>
                        ) : null;
                      })()}
                    </div>

                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20 flex-shrink-0">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-4">
          <Link href="/recommendations">
            <GlassCard className="group cursor-pointer" padding="md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-green-400 transition-colors">Weekly Buys</p>
                  <p className="text-xs text-white/40">This week&apos;s top picks</p>
                </div>
              </div>
            </GlassCard>
          </Link>

          <Link href="/rebalance">
            <GlassCard className="group cursor-pointer" padding="md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-violet-400 transition-colors">Rebalance</p>
                  <p className="text-xs text-white/40">Target allocations & drift</p>
                </div>
              </div>
            </GlassCard>
          </Link>

          <Link href="/mock-builder">
            <GlassCard className="group cursor-pointer" padding="md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">Mock Builder</p>
                  <p className="text-xs text-white/40">Hypothetical portfolio</p>
                </div>
              </div>
            </GlassCard>
          </Link>
        </motion.div>

      </motion.div>
    </div>
  );
}
