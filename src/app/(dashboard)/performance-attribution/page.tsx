'use client';

import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';

type Period = '1M' | '3M' | '6M' | '1Y';

const PERIOD_LABELS: Record<Period, string> = {
  '1M': '1 Month',
  '3M': '3 Months',
  '6M': '6 Months',
  '1Y': '1 Year',
};

function getFromDate(period: Period): string {
  const d = new Date();
  if (period === '1M') d.setMonth(d.getMonth() - 1);
  else if (period === '3M') d.setMonth(d.getMonth() - 3);
  else if (period === '6M') d.setMonth(d.getMonth() - 6);
  else d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().split('T')[0];
}

function periodReturn(prices: { date: string; close: number }[], from: string): number | null {
  if (!prices || prices.length < 2) return null;
  const sorted = [...prices].sort((a, b) => a.date.localeCompare(b.date));
  // Find first price on or after from date
  const startIdx = sorted.findIndex((p) => p.date >= from);
  if (startIdx < 0) return null;
  const startPrice = sorted[startIdx].close;
  const endPrice = sorted[sorted.length - 1].close;
  if (!startPrice) return null;
  return (endPrice - startPrice) / startPrice;
}

interface AttributionRow {
  ticker: string;
  weight: number;          // fraction of portfolio
  holdingReturn: number | null;   // % return of stock
  contribution: number | null;    // weight × holdingReturn
  activeContribution: number | null; // contribution - (weight × benchmarkReturn)
  marketValue: number;
}

// Custom tooltip for the bar chart
function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { ticker: string; fullTicker: string } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const val = d.value;
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0f1020]/95 px-3 py-2 text-xs backdrop-blur-xl shadow-xl">
      <div className="font-semibold text-white/80 mb-1">{d.payload.fullTicker}</div>
      <div className={val >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
        {val >= 0 ? '+' : ''}{(val * 100).toFixed(3)}% active contribution
      </div>
    </div>
  );
}

export default function PerformanceAttributionPage() {
  const [period, setPeriod] = useState<Period>('1M');
  const { positions, totalValue, isLoading: positionsLoading } = usePortfolioValue();

  const fromDate = useMemo(() => getFromDate(period), [period]);

  // Top holdings by market value (max 15)
  const topHoldings = useMemo(() => {
    return [...positions]
      .filter((p) => (p.marketValue ?? 0) > 0)
      .sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0))
      .slice(0, 15);
  }, [positions]);

  const tickers = useMemo(() => topHoldings.map((p) => p.ticker), [topHoldings]);

  // Fetch historical for each holding + SPY benchmark
  const allTickers = useMemo(() => [...tickers, 'SPY'], [tickers]);

  const queries = useQueries({
    queries: allTickers.map((symbol) => ({
      queryKey: ['historical', symbol, period],
      queryFn: async () => {
        const res = await fetch(`/api/stock/historical?symbol=${symbol}&from=${fromDate}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data as { date: string; close: number }[];
      },
      staleTime: 1000 * 60 * 60, // 1 hour
      enabled: allTickers.length > 0,
    })),
  });

  const isLoading = positionsLoading || queries.some((q) => q.isLoading);

  const { attribution, spyReturn, portfolioReturn } = useMemo(() => {
    if (isLoading || queries.length === 0) return { attribution: [], spyReturn: null, portfolioReturn: null };

    const priceMap = new Map<string, { date: string; close: number }[]>();
    allTickers.forEach((sym, i) => {
      const data = queries[i]?.data;
      if (data) priceMap.set(sym, data);
    });

    const spyData = priceMap.get('SPY');
    const spyRet = spyData ? periodReturn(spyData, fromDate) : null;

    let portfolioRet = 0;
    const rows: AttributionRow[] = topHoldings.map((pos) => {
      const weight = totalValue > 0 ? (pos.marketValue ?? 0) / totalValue : 0;
      const priceData = priceMap.get(pos.ticker);
      const ret = priceData ? periodReturn(priceData, fromDate) : null;
      const contribution = ret !== null ? weight * ret : null;
      const activeContribution =
        contribution !== null && spyRet !== null ? contribution - weight * spyRet : null;

      if (contribution !== null) portfolioRet += contribution;

      return {
        ticker: pos.ticker,
        weight,
        holdingReturn: ret,
        contribution,
        activeContribution,
        marketValue: pos.marketValue ?? 0,
      };
    });

    return {
      attribution: rows,
      spyReturn: spyRet,
      portfolioReturn: portfolioRet,
    };
  }, [isLoading, queries, allTickers, topHoldings, totalValue, fromDate]);

  const activeReturn = useMemo(() => {
    if (portfolioReturn === null || spyReturn === null) return null;
    return portfolioReturn - spyReturn;
  }, [portfolioReturn, spyReturn]);

  // Sort attribution rows by absolute active contribution for chart
  const chartData = useMemo(() => {
    return [...attribution]
      .filter((r) => r.activeContribution !== null)
      .sort((a, b) => Math.abs(b.activeContribution!) - Math.abs(a.activeContribution!))
      .map((r) => ({
        ticker: r.ticker.length > 5 ? r.ticker.slice(0, 5) : r.ticker,
        fullTicker: r.ticker,
        value: r.activeContribution!,
      }));
  }, [attribution]);

  // Sort table by contribution descending
  const tableRows = useMemo(() => {
    return [...attribution].sort((a, b) => {
      const ac = a.contribution ?? -Infinity;
      const bc = b.contribution ?? -Infinity;
      return bc - ac;
    });
  }, [attribution]);

  const topContributors = attribution
    .filter((r) => (r.contribution ?? 0) > 0)
    .sort((a, b) => (b.contribution ?? 0) - (a.contribution ?? 0))
    .slice(0, 3);

  const topDetractors = attribution
    .filter((r) => (r.contribution ?? 0) < 0)
    .sort((a, b) => (a.contribution ?? 0) - (b.contribution ?? 0))
    .slice(0, 3);

  const fmt = (v: number | null, isPercent = true) => {
    if (v === null) return '—';
    if (isPercent) return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(2)}%`;
    return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Performance Attribution</h1>
          <p className="text-sm text-white/40 mt-0.5">Which holdings drove your portfolio returns</p>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                period === p
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'Portfolio Return',
            value: fmt(portfolioReturn),
            positive: (portfolioReturn ?? 0) >= 0,
            sub: PERIOD_LABELS[period],
          },
          {
            label: 'Benchmark (SPY)',
            value: fmt(spyReturn),
            positive: (spyReturn ?? 0) >= 0,
            sub: PERIOD_LABELS[period],
          },
          {
            label: 'Active Return',
            value: fmt(activeReturn),
            positive: (activeReturn ?? 0) >= 0,
            sub: 'vs SPY',
          },
          {
            label: 'Holdings Analyzed',
            value: isLoading ? '…' : String(attribution.length),
            positive: true,
            sub: 'out of portfolio',
          },
        ].map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 backdrop-blur-xl"
          >
            <p className="text-xs text-white/40 mb-1">{card.label}</p>
            {isLoading ? (
              <div className="h-7 w-20 rounded-lg bg-white/[0.06] animate-pulse" />
            ) : (
              <p className={`text-xl font-bold ${card.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {card.value}
              </p>
            )}
            <p className="text-[11px] text-white/30 mt-0.5">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Active Contribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5 backdrop-blur-xl"
      >
        <h2 className="text-sm font-semibold text-white/70 mb-4">
          Active Contribution by Holding
          <span className="ml-2 text-xs font-normal text-white/30">(holding contribution − weight × SPY return)</span>
        </h2>

        {isLoading ? (
          <div className="h-56 flex items-center justify-center">
            <div className="text-sm text-white/30">Loading price history…</div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center">
            <div className="text-sm text-white/30">No holdings data available</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="ticker"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${(v * 100).toFixed(2)}%`}
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.value >= 0 ? 'rgba(52,211,153,0.75)' : 'rgba(251,113,133,0.75)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Top contributors + detractors */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Contributors */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5"
        >
          <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            Top Contributors
          </h3>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 rounded-lg bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : topContributors.length === 0 ? (
            <p className="text-sm text-white/30">No positive contributors in this period</p>
          ) : (
            <div className="space-y-2">
              {topContributors.map((row) => (
                <div key={row.ticker} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2">
                  <div>
                    <span className="text-sm font-semibold text-white/80">{row.ticker}</span>
                    <span className="ml-2 text-xs text-white/30">{(row.weight * 100).toFixed(1)}% weight</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-emerald-400">{fmt(row.contribution)}</div>
                    <div className="text-[11px] text-white/30">{fmt(row.holdingReturn)} return</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Detractors */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.05] p-5"
        >
          <h3 className="text-sm font-semibold text-rose-400 mb-3 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              <polyline points="17 18 23 18 23 12" />
            </svg>
            Top Detractors
          </h3>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 rounded-lg bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : topDetractors.length === 0 ? (
            <p className="text-sm text-white/30">No negative contributors in this period</p>
          ) : (
            <div className="space-y-2">
              {topDetractors.map((row) => (
                <div key={row.ticker} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2">
                  <div>
                    <span className="text-sm font-semibold text-white/80">{row.ticker}</span>
                    <span className="ml-2 text-xs text-white/30">{(row.weight * 100).toFixed(1)}% weight</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-rose-400">{fmt(row.contribution)}</div>
                    <div className="text-[11px] text-white/30">{fmt(row.holdingReturn)} return</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Full attribution table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.04] backdrop-blur-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white/70">Full Attribution Breakdown</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Holding', 'Weight', 'Return', 'Contribution', 'Active Contribution', 'vs SPY'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-white/30 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/[0.04]">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-white/[0.05] animate-pulse w-16" />
                        </td>
                      ))}
                    </tr>
                  ))
                : tableRows.map((row) => {
                    const isPositive = (row.contribution ?? 0) >= 0;
                    const isActivePositive = (row.activeContribution ?? 0) >= 0;
                    return (
                      <tr
                        key={row.ticker}
                        className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-white/80">{row.ticker}</td>
                        <td className="px-4 py-3 text-white/50">{(row.weight * 100).toFixed(1)}%</td>
                        <td className={`px-4 py-3 font-medium ${row.holdingReturn !== null && row.holdingReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {fmt(row.holdingReturn)}
                        </td>
                        <td className={`px-4 py-3 font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {fmt(row.contribution)}
                        </td>
                        <td className={`px-4 py-3 font-medium ${isActivePositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {fmt(row.activeContribution)}
                        </td>
                        <td className="px-4 py-3">
                          {row.activeContribution !== null ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                isActivePositive
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-rose-500/15 text-rose-400'
                              }`}
                            >
                              {isActivePositive ? '▲' : '▼'}
                              {isActivePositive ? 'Outperformed' : 'Underperformed'}
                            </span>
                          ) : (
                            <span className="text-white/20">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>

            {/* Footer row: totals */}
            {!isLoading && tableRows.length > 0 && (
              <tfoot>
                <tr className="bg-white/[0.03] border-t border-white/[0.08]">
                  <td className="px-4 py-3 text-xs font-semibold text-white/50">TOTAL</td>
                  <td className="px-4 py-3 text-xs text-white/50">
                    {(tableRows.reduce((s, r) => s + r.weight, 0) * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-xs text-white/30">—</td>
                  <td className={`px-4 py-3 text-xs font-bold ${(portfolioReturn ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {fmt(portfolioReturn)}
                  </td>
                  <td className={`px-4 py-3 text-xs font-bold ${(activeReturn ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {fmt(activeReturn)}
                  </td>
                  <td className="px-4 py-3">
                    {activeReturn !== null && (
                      <span className={`text-xs font-semibold ${(activeReturn ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {(activeReturn ?? 0) >= 0 ? 'Beating' : 'Trailing'} SPY
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </motion.div>
    </div>
  );
}
