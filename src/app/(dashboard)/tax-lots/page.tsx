'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';
import { usePortfolioStore } from '@/stores/portfolioStore';
import type { PositionWithMarketData } from '@/types/portfolio';

// ─── Tax helpers ──────────────────────────────────────────────────────────────

type LotMethod = 'fifo' | 'lifo' | 'specific' | 'hifo';

function isLongTerm(dateAdded: string): boolean {
  const d = new Date(dateAdded);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return d <= oneYearAgo;
}

function holdingDays(dateAdded: string): number {
  const d = new Date(dateAdded);
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function taxRateLabel(longTerm: boolean): string {
  return longTerm ? 'Long-term' : 'Short-term';
}

interface TaxLot extends PositionWithMarketData {
  longTerm: boolean;
  holdingDays: number;
  unrealizedGain: number;  // per lot total
  taxRate: number;         // estimated marginal rate (simplified)
  estimatedTax: number;
}

// Simplified tax bracket (single filer, 2024): use 15% LT / 22% ST as defaults
const LT_RATE = 0.15;
const ST_RATE = 0.22;

function buildLots(positions: PositionWithMarketData[]): TaxLot[] {
  return positions.map((p) => {
    const lt = isLongTerm(p.dateAdded);
    const days = holdingDays(p.dateAdded);
    const gain = (p.currentPrice - p.costBasisPerShare) * p.shares;
    const rate = lt ? LT_RATE : ST_RATE;
    return {
      ...p,
      longTerm: lt,
      holdingDays: days,
      unrealizedGain: gain,
      taxRate: rate,
      estimatedTax: gain > 0 ? gain * rate : 0,
    };
  });
}

// ─── Sell simulator ───────────────────────────────────────────────────────────

interface SellScenario {
  method: LotMethod;
  label: string;
  description: string;
  proceeds: number;
  costBasis: number;
  gain: number;
  estimatedTax: number;
  ltGain: number;
  stGain: number;
}

function simulateSell(
  lots: TaxLot[],
  sharesToSell: number,
  currentPrice: number,
  method: LotMethod,
): SellScenario {
  let sorted: TaxLot[];
  if (method === 'fifo') sorted = [...lots].sort((a, b) => a.dateAdded.localeCompare(b.dateAdded));
  else if (method === 'lifo') sorted = [...lots].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  else if (method === 'hifo') sorted = [...lots].sort((a, b) => b.costBasisPerShare - a.costBasisPerShare);
  else sorted = [...lots].sort((a, b) => a.costBasisPerShare - b.costBasisPerShare); // specific = lowest cost first for max tax

  let remaining = sharesToSell;
  let totalCost = 0;
  let ltGain = 0;
  let stGain = 0;

  for (const lot of sorted) {
    if (remaining <= 0) break;
    const use = Math.min(lot.shares, remaining);
    totalCost += use * lot.costBasisPerShare;
    const gain = use * (currentPrice - lot.costBasisPerShare);
    if (lot.longTerm) ltGain += gain;
    else stGain += gain;
    remaining -= use;
  }

  const proceeds = sharesToSell * currentPrice;
  const gain = proceeds - totalCost;
  const estimatedTax = Math.max(0, ltGain * LT_RATE + stGain * ST_RATE);

  const LABELS: Record<LotMethod, { label: string; description: string }> = {
    fifo: { label: 'FIFO', description: 'First in, first out — oldest lots sold first' },
    lifo: { label: 'LIFO', description: 'Last in, first out — newest lots sold first (usually short-term)' },
    hifo: { label: 'HIFO', description: 'Highest cost first — minimizes gains, reduces tax bill' },
    specific: { label: 'Specific ID', description: 'Lowest cost first — maximizes gains (not tax-optimal)' },
  };

  return {
    method,
    ...LABELS[method],
    proceeds,
    costBasis: totalCost,
    gain,
    estimatedTax,
    ltGain,
    stGain,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtK = (n: number) =>
  Math.abs(n) >= 1000
    ? `${n < 0 ? '-' : ''}$${(Math.abs(n) / 1000).toFixed(1)}k`
    : fmt(n);

export default function TaxLotsPage() {
  const { positions: rawPositions } = usePortfolioValue();
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [sellShares, setSellShares] = useState<Record<string, number>>({});

  const lots = useMemo(() => buildLots(rawPositions), [rawPositions]);

  // Group by ticker
  const byTicker = useMemo(() => {
    const map = new Map<string, TaxLot[]>();
    for (const lot of lots) {
      const existing = map.get(lot.ticker) ?? [];
      map.set(lot.ticker, [...existing, lot]);
    }
    // Sort by market value desc
    return [...map.entries()]
      .sort((a, b) => {
        const av = a[1].reduce((s, l) => s + l.marketValue, 0);
        const bv = b[1].reduce((s, l) => s + l.marketValue, 0);
        return bv - av;
      });
  }, [lots]);

  // Portfolio-wide stats
  const stats = useMemo(() => {
    const ltGains = lots.filter(l => l.unrealizedGain > 0 && l.longTerm).reduce((s, l) => s + l.unrealizedGain, 0);
    const stGains = lots.filter(l => l.unrealizedGain > 0 && !l.longTerm).reduce((s, l) => s + l.unrealizedGain, 0);
    const ltLosses = lots.filter(l => l.unrealizedGain < 0 && l.longTerm).reduce((s, l) => s + l.unrealizedGain, 0);
    const stLosses = lots.filter(l => l.unrealizedGain < 0 && !l.longTerm).reduce((s, l) => s + l.unrealizedGain, 0);
    const totalEstTax = lots.reduce((s, l) => s + l.estimatedTax, 0);
    const harvestOpportunity = Math.abs(ltLosses + stLosses); // potential tax loss harvest
    return { ltGains, stGains, ltLosses, stLosses, totalEstTax, harvestOpportunity };
  }, [lots]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white/90">Tax Lot Tracking</h1>
        <p className="text-sm text-white/40 mt-0.5">FIFO · LIFO · HIFO · Specific ID — tax-optimized lot selection</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'LT Unrealized Gains', value: fmtK(stats.ltGains), color: 'text-emerald-400', sub: `~${fmt(stats.ltGains * LT_RATE)} est. tax @ 15%` },
          { label: 'ST Unrealized Gains', value: fmtK(stats.stGains), color: 'text-amber-400', sub: `~${fmt(stats.stGains * ST_RATE)} est. tax @ 22%` },
          { label: 'Unrealized Losses', value: fmtK(stats.ltLosses + stats.stLosses), color: 'text-rose-400', sub: 'Tax loss harvest potential' },
          { label: 'Total Est. Tax (if sold)', value: fmtK(stats.totalEstTax), color: 'text-white/70', sub: 'Simplified estimate only' },
        ].map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 backdrop-blur-xl"
          >
            <p className="text-xs text-white/40 mb-1">{card.label}</p>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-[11px] text-white/25 mt-0.5">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Tax loss harvest alert */}
      {stats.harvestOpportunity > 500 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 flex items-center gap-3"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-amber-400/80">
            <span className="font-semibold">Tax-loss harvest opportunity:</span> You have {fmtK(stats.harvestOpportunity)} in unrealized losses that could be harvested to offset gains. Consult a tax advisor before acting.
          </p>
        </motion.div>
      )}

      {/* Disclaimer */}
      <p className="text-[11px] text-white/25 leading-relaxed">
        Estimates use simplified federal rates (15% long-term, 22% short-term). Actual taxes depend on income, state, filing status, and tax-loss carryovers.
        This is informational only — not tax advice. Consult a CPA.
      </p>

      {/* Lot rows by ticker */}
      <div className="space-y-3">
        {byTicker.map(([ticker, tickerLots]) => {
          const totalShares = tickerLots.reduce((s, l) => s + l.shares, 0);
          const totalValue = tickerLots.reduce((s, l) => s + l.marketValue, 0);
          const totalGain = tickerLots.reduce((s, l) => s + l.unrealizedGain, 0);
          const currentPrice = tickerLots[0]?.currentPrice ?? 0;
          const isExpanded = expandedTicker === ticker;
          const sellQty = sellShares[ticker] ?? 0;

          // Sell scenarios for this ticker
          const scenarios: SellScenario[] = sellQty > 0 && sellQty <= totalShares
            ? (['fifo', 'lifo', 'hifo', 'specific'] as LotMethod[]).map(m =>
                simulateSell(tickerLots, sellQty, currentPrice, m)
              )
            : [];

          const bestScenario = scenarios.length > 0
            ? scenarios.reduce((best, s) => s.estimatedTax < best.estimatedTax ? s : best)
            : null;

          return (
            <motion.div
              key={ticker}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.04] overflow-hidden"
            >
              {/* Ticker header row */}
              <button
                onClick={() => setExpandedTicker(isExpanded ? null : ticker)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <span className="text-base font-bold text-white/90">{ticker}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                      tickerLots.every(l => l.longTerm)
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : tickerLots.some(l => !l.longTerm)
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-white/10 text-white/40'
                    }`}>
                      {tickerLots.every(l => l.longTerm) ? 'All LT' : tickerLots.every(l => !l.longTerm) ? 'All ST' : 'Mixed'}
                    </span>
                    <span className="text-xs text-white/30">{tickerLots.length} lot{tickerLots.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold text-white/70">{totalShares.toFixed(3)} shares</div>
                    <div className="text-xs text-white/30">{fmt(totalValue)}</div>
                  </div>
                  <div className={`text-right ${totalGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <div className="text-sm font-semibold">{totalGain >= 0 ? '+' : ''}{fmt(totalGain)}</div>
                    <div className="text-xs opacity-70">unrealized</div>
                  </div>
                  <svg
                    width="16" height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="2"
                    className={`transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              {/* Expanded lot detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-5 border-t border-white/[0.06] pt-4">

                      {/* Lot table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/[0.06]">
                              {['Lot Date', 'Shares', 'Cost/Share', 'Current', 'Gain/Loss', 'Term', 'Hold', 'Est. Tax'].map((h) => (
                                <th key={h} className="px-2 py-2 text-left text-xs text-white/30 font-medium whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[...tickerLots].sort((a, b) => a.dateAdded.localeCompare(b.dateAdded)).map((lot) => (
                              <tr key={lot.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                                <td className="px-2 py-2.5 text-white/60 whitespace-nowrap">{lot.dateAdded.slice(0, 10)}</td>
                                <td className="px-2 py-2.5 text-white/70">{lot.shares.toFixed(3)}</td>
                                <td className="px-2 py-2.5 text-white/60">${lot.costBasisPerShare.toFixed(2)}</td>
                                <td className="px-2 py-2.5 text-white/70">${lot.currentPrice.toFixed(2)}</td>
                                <td className={`px-2 py-2.5 font-medium ${lot.unrealizedGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {lot.unrealizedGain >= 0 ? '+' : ''}{fmt(lot.unrealizedGain)}
                                </td>
                                <td className="px-2 py-2.5">
                                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                                    lot.longTerm ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                                  }`}>
                                    {taxRateLabel(lot.longTerm)}
                                  </span>
                                </td>
                                <td className="px-2 py-2.5 text-white/40 text-xs whitespace-nowrap">{lot.holdingDays}d</td>
                                <td className={`px-2 py-2.5 text-xs font-medium ${lot.estimatedTax > 0 ? 'text-amber-400' : 'text-white/30'}`}>
                                  {lot.estimatedTax > 0 ? fmt(lot.estimatedTax) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Sell simulator */}
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
                        <h3 className="text-sm font-semibold text-white/60">Sell Simulator</h3>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 max-w-xs">
                            <label className="text-xs text-white/40 block mb-1">Shares to sell</label>
                            <input
                              type="number"
                              min={0}
                              max={totalShares}
                              step={0.001}
                              value={sellQty || ''}
                              onChange={(e) => setSellShares(s => ({ ...s, [ticker]: parseFloat(e.target.value) || 0 }))}
                              className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 outline-none focus:border-cyan-500/40"
                              placeholder="0.000"
                            />
                          </div>
                          <div className="text-xs text-white/30 mt-5">
                            of {totalShares.toFixed(3)} available @ ${currentPrice.toFixed(2)}
                          </div>
                        </div>

                        {scenarios.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                            {scenarios.map((s) => (
                              <div
                                key={s.method}
                                className={`rounded-xl border p-3 space-y-1 ${
                                  bestScenario?.method === s.method
                                    ? 'border-emerald-500/30 bg-emerald-500/[0.07]'
                                    : 'border-white/[0.06] bg-white/[0.02]'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-white/70">{s.label}</span>
                                  {bestScenario?.method === s.method && (
                                    <span className="text-[10px] text-emerald-400 font-semibold">BEST</span>
                                  )}
                                </div>
                                <div className="text-xs text-white/40">{s.description}</div>
                                <div className="pt-1 space-y-0.5">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-white/40">Proceeds</span>
                                    <span className="text-white/70">{fmt(s.proceeds)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-white/40">Gain</span>
                                    <span className={s.gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                      {s.gain >= 0 ? '+' : ''}{fmt(s.gain)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-white/40">Est. Tax</span>
                                    <span className={`font-semibold ${s.estimatedTax > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                      {s.estimatedTax > 0 ? fmt(s.estimatedTax) : 'None'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs pt-0.5 border-t border-white/[0.06] mt-1">
                                    <span className="text-white/30">LT / ST</span>
                                    <span className="text-white/50 text-[11px]">{fmt(s.ltGain)} / {fmt(s.stGain)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {sellQty > totalShares && (
                          <p className="text-xs text-rose-400">Cannot sell more shares than you own ({totalShares.toFixed(3)}).</p>
                        )}
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {byTicker.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
            <path d="M9 14l2 2 4-4" /><path d="M3 7v4a1 1 0 001 1h3" /><path d="M7 3H4a1 1 0 00-1 1v3" /><path d="M21 7V4a1 1 0 00-1-1h-3" /><path d="M21 17v3a1 1 0 01-1 1h-3" /><path d="M3 17v3a1 1 0 001 1h3" />
          </svg>
          <p className="text-white/30 text-sm">No positions to track</p>
          <a href="/portfolio" className="text-xs text-cyan-400/70 hover:text-cyan-400 transition-colors">Add positions →</a>
        </div>
      )}
    </div>
  );
}
