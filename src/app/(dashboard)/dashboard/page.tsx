'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { GlassButton } from '@/components/ui/GlassButton';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';
import { formatCurrency, formatPercent, formatCompactCurrency } from '@/lib/utils/formatting';
import { calculateAllocation, calculateSectorAllocation } from '@/lib/utils/calculations';
import { CHART_COLORS, POSITIVE_COLOR, NEGATIVE_COLOR } from '@/lib/utils/constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { accounts, positions } = usePortfolioStore();
  const { enrichedPositions, totalValue, totalCostBasis, totalDayChange, isLoading } =
    usePortfolioValue();

  const totalGainLoss = totalValue - totalCostBasis;
  const totalGainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;
  const dayChangePercent =
    totalValue > 0 ? (totalDayChange / (totalValue - totalDayChange)) * 100 : 0;

  const allocation = calculateAllocation(enrichedPositions);
  const sectorAllocation = calculateSectorAllocation(enrichedPositions);
  const topHoldings = [...allocation].sort((a, b) => b.marketValue - a.marketValue).slice(0, 5);

  const hasPositions = positions.length > 0;

  if (!hasPositions) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          description="Your portfolio command center"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 flex flex-col items-center justify-center text-center"
        >
          <GlassCard className="max-w-md mx-auto">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">
                Welcome to Your Portfolio Dashboard
              </h3>
              <p className="text-white/50 text-sm">
                Get started by adding your brokerage accounts and positions to see
                your complete portfolio overview.
              </p>
              <Link href="/portfolio">
                <GlassButton variant="primary" size="lg">
                  Add Your First Account
                </GlassButton>
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your portfolio command center"
      />

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 mt-6">
        {/* Summary Stats */}
        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard hover={false}>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
              Total Value
            </p>
            <p className="text-2xl font-bold text-white">
              {isLoading ? '...' : formatCurrency(totalValue)}
            </p>
          </GlassCard>

          <GlassCard hover={false}>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
              Total Gain/Loss
            </p>
            <p
              className={`text-2xl font-bold ${
                totalGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isLoading ? '...' : formatCurrency(totalGainLoss)}
            </p>
            <p
              className={`text-sm ${
                totalGainLoss >= 0 ? 'text-emerald-400/70' : 'text-rose-400/70'
              }`}
            >
              {isLoading ? '' : formatPercent(totalGainLossPercent)}
            </p>
          </GlassCard>

          <GlassCard hover={false}>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
              Day Change
            </p>
            <p
              className={`text-2xl font-bold ${
                totalDayChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isLoading ? '...' : formatCurrency(totalDayChange)}
            </p>
            <p
              className={`text-sm ${
                totalDayChange >= 0 ? 'text-emerald-400/70' : 'text-rose-400/70'
              }`}
            >
              {isLoading ? '' : formatPercent(dayChangePercent)}
            </p>
          </GlassCard>

          <GlassCard hover={false}>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
              Accounts
            </p>
            <p className="text-2xl font-bold text-white">{accounts.length}</p>
            <p className="text-sm text-white/40">{positions.length} positions</p>
          </GlassCard>
        </motion.div>

        {/* Charts Row */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Allocation Chart */}
          <GlassCard>
            <h3 className="text-sm font-medium text-white/60 mb-4">
              Portfolio Allocation
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocation}
                    dataKey="allocation"
                    nameKey="ticker"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {allocation.map((_, index) => (
                      <Cell
                        key={index}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#1a1a4e]/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-sm">
                            <p className="text-white font-medium">{data.ticker}</p>
                            <p className="text-white/60">
                              {data.allocation.toFixed(1)}% &middot;{' '}
                              {formatCurrency(data.marketValue)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {allocation.slice(0, 6).map((a, i) => (
                <div key={a.ticker} className="flex items-center gap-1.5 text-xs text-white/60">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  {a.ticker} ({a.allocation.toFixed(1)}%)
                </div>
              ))}
              {allocation.length > 6 && (
                <span className="text-xs text-white/30">
                  +{allocation.length - 6} more
                </span>
              )}
            </div>
          </GlassCard>

          {/* Top Holdings */}
          <GlassCard>
            <h3 className="text-sm font-medium text-white/60 mb-4">
              Top Holdings
            </h3>
            <div className="space-y-3">
              {topHoldings.map((holding) => {
                const pos = enrichedPositions.find(
                  (p) => p.ticker === holding.ticker
                );
                return (
                  <div
                    key={holding.ticker}
                    className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-xs font-bold text-white/80">
                        {holding.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {holding.ticker}
                        </p>
                        <p className="text-xs text-white/40">
                          {holding.companyName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {formatCurrency(holding.marketValue)}
                      </p>
                      {pos && (
                        <p
                          className={`text-xs ${
                            pos.gainLossPercent >= 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {formatPercent(pos.gainLossPercent)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <Link href="/portfolio" className="block mt-4">
              <GlassButton variant="ghost" size="sm" className="w-full">
                View All Positions
              </GlassButton>
            </Link>
          </GlassCard>
        </motion.div>

        {/* Sector Breakdown */}
        <motion.div variants={item}>
          <GlassCard>
            <h3 className="text-sm font-medium text-white/60 mb-4">
              Sector Breakdown
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sectorAllocation.map((sector, i) => (
                <div
                  key={sector.sector}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]"
                >
                  <div
                    className="w-1 h-8 rounded-full"
                    style={{
                      backgroundColor:
                        CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                  <div>
                    <p className="text-xs text-white/40">{sector.sector}</p>
                    <p className="text-sm font-medium text-white">
                      {sector.allocation.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/recommendations">
            <GlassCard className="group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                    Weekly Buys
                  </p>
                  <p className="text-xs text-white/40">
                    See this week&apos;s top picks
                  </p>
                </div>
              </div>
            </GlassCard>
          </Link>

          <Link href="/rebalance">
            <GlassCard className="group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                    Rebalance
                  </p>
                  <p className="text-xs text-white/40">
                    Optimize your allocation
                  </p>
                </div>
              </div>
            </GlassCard>
          </Link>

          <Link href="/mock-builder">
            <GlassCard className="group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                    Mock Builder
                  </p>
                  <p className="text-xs text-white/40">
                    Build a hypothetical portfolio
                  </p>
                </div>
              </div>
            </GlassCard>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
