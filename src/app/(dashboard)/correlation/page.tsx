'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import PageHeader from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';
import type { HistoricalPrice } from '@/types/market';

// ─── Correlation math ─────────────────────────────────────────────────────────

function pearsonCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 10) return NaN;
  const aSlice = a.slice(0, n);
  const bSlice = b.slice(0, n);
  const meanA = aSlice.reduce((s, v) => s + v, 0) / n;
  const meanB = bSlice.reduce((s, v) => s + v, 0) / n;
  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < n; i++) {
    const da = aSlice[i] - meanA;
    const db = bSlice[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  if (denA === 0 || denB === 0) return NaN;
  return num / Math.sqrt(denA * denB);
}

function dailyReturns(prices: HistoricalPrice[]): number[] {
  const sorted = [...prices].sort((a, b) => a.date.localeCompare(b.date));
  const returns: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].close;
    const curr = sorted[i].close;
    if (prev > 0) returns.push((curr - prev) / prev);
  }
  return returns;
}

// ─── Color helper ─────────────────────────────────────────────────────────────

function corrColor(c: number): string {
  if (isNaN(c)) return 'rgba(255,255,255,0.05)';
  if (c >= 0.8) return 'rgba(239,68,68,0.55)';
  if (c >= 0.6) return 'rgba(249,115,22,0.45)';
  if (c >= 0.4) return 'rgba(234,179,8,0.35)';
  if (c >= 0.2) return 'rgba(34,197,94,0.20)';
  if (c >= 0) return 'rgba(34,197,94,0.10)';
  if (c >= -0.2) return 'rgba(99,102,241,0.15)';
  return 'rgba(99,102,241,0.35)';
}

function corrLabel(c: number): string {
  if (isNaN(c)) return '—';
  if (c >= 0.8) return 'Very High';
  if (c >= 0.6) return 'High';
  if (c >= 0.4) return 'Moderate';
  if (c >= 0.2) return 'Low';
  if (c >= 0) return 'Minimal';
  if (c >= -0.2) return 'Slight Neg';
  return 'Negative';
}

// ─── Diversification score ────────────────────────────────────────────────────

function diversificationScore(matrix: (number | null)[][], tickers: string[]): number {
  const n = tickers.length;
  if (n <= 1) return 100;
  let sum = 0, count = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const c = matrix[i][j];
      if (c !== null && !isNaN(c)) {
        sum += c;
        count++;
      }
    }
  }
  if (count === 0) return 50;
  const avgCorr = sum / count; // -1 to 1
  // Map: avgCorr 1 → score 0, avgCorr -1 → score 100, avgCorr 0 → score 50
  return Math.round(((1 - avgCorr) / 2) * 100);
}

// ─── Heatmap cell ─────────────────────────────────────────────────────────────

function HeatmapCell({ value, isSelf }: { value: number | null; isSelf: boolean }) {
  if (isSelf) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg bg-white/[0.08] text-xs font-bold text-white/60">
        1.00
      </div>
    );
  }
  if (value === null || isNaN(value)) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg bg-white/[0.03] text-xs text-white/20">
        —
      </div>
    );
  }
  return (
    <div
      className="flex h-full flex-col items-center justify-center rounded-lg text-xs font-medium transition-all hover:ring-1 hover:ring-white/30"
      style={{ background: corrColor(value) }}
      title={`${corrLabel(value)} (${value.toFixed(3)})`}
    >
      <span className="text-white/90 font-semibold">{value >= 0 ? '+' : ''}{value.toFixed(2)}</span>
    </div>
  );
}

// ─── Legend ──────────────────────────────────────────────────────────────────

function Legend() {
  const items = [
    { label: '≥ 0.8 Very High', color: 'rgba(239,68,68,0.55)' },
    { label: '0.6–0.8 High', color: 'rgba(249,115,22,0.45)' },
    { label: '0.4–0.6 Moderate', color: 'rgba(234,179,8,0.35)' },
    { label: '0–0.4 Low', color: 'rgba(34,197,94,0.20)' },
    { label: '< 0 Negative', color: 'rgba(99,102,241,0.35)' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs text-white/40">Correlation:</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded" style={{ background: item.color }} />
          <span className="text-xs text-white/50">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Pair insights ─────────────────────────────────────────────────────────────

function PairInsights({ matrix, tickers }: { matrix: (number | null)[][]; tickers: string[] }) {
  const pairs = useMemo(() => {
    const result: { a: string; b: string; corr: number }[] = [];
    for (let i = 0; i < tickers.length; i++) {
      for (let j = i + 1; j < tickers.length; j++) {
        const c = matrix[i][j];
        if (c !== null && !isNaN(c)) {
          result.push({ a: tickers[i], b: tickers[j], corr: c });
        }
      }
    }
    return result.sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr));
  }, [matrix, tickers]);

  if (pairs.length === 0) return null;

  const topHigh = pairs.filter((p) => p.corr >= 0.7).slice(0, 4);
  const topNeg = pairs.filter((p) => p.corr < 0).slice(0, 4);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {topHigh.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold text-white/50">Highest Correlation (concentration risk)</h4>
          <div className="flex flex-col gap-2">
            {topHigh.map((p) => (
              <div key={`${p.a}-${p.b}`} className="flex items-center justify-between rounded-lg border border-rose-500/20 bg-rose-500/[0.05] px-3 py-2">
                <span className="text-sm font-medium text-white">{p.a} / {p.b}</span>
                <GlassBadge variant="negative">+{p.corr.toFixed(2)}</GlassBadge>
              </div>
            ))}
          </div>
        </div>
      )}
      {topNeg.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold text-white/50">Negative Correlation (natural hedge)</h4>
          <div className="flex flex-col gap-2">
            {topNeg.map((p) => (
              <div key={`${p.a}-${p.b}`} className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-2">
                <span className="text-sm font-medium text-white">{p.a} / {p.b}</span>
                <GlassBadge variant="positive">{p.corr.toFixed(2)}</GlassBadge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CorrelationPage() {
  const positions = usePortfolioStore((s) => s.positions);
  const { enrichedPositions } = usePortfolioValue();

  // Get top 12 holdings by market value to keep matrix readable
  const topTickers = useMemo(() => {
    return [...enrichedPositions]
      .sort((a, b) => b.marketValue - a.marketValue)
      .slice(0, 12)
      .map((p) => p.ticker);
  }, [enrichedPositions]);

  // Fetch 1-year historical prices for each ticker
  const oneYearAgo = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const histQueries = useQueries({
    queries: topTickers.map((ticker) => ({
      queryKey: ['historicalPrices', ticker, oneYearAgo],
      queryFn: async (): Promise<{ ticker: string; returns: number[] }> => {
        const params = new URLSearchParams({ symbol: ticker, from: oneYearAgo });
        const res = await fetch(`/api/stock/historical?${params}`);
        if (!res.ok) return { ticker, returns: [] };
        const prices: HistoricalPrice[] = await res.json();
        return { ticker, returns: dailyReturns(prices) };
      },
      staleTime: 60 * 60 * 1000,
      enabled: topTickers.length > 0,
    })),
  });

  const isLoading = histQueries.some((q) => q.isLoading);
  const returnsByTicker = useMemo(() => {
    const map: Record<string, number[]> = {};
    histQueries.forEach((q, i) => {
      if (q.data) map[topTickers[i]] = q.data.returns;
    });
    return map;
  }, [histQueries, topTickers]);

  // Build correlation matrix
  const matrix = useMemo((): (number | null)[][] => {
    return topTickers.map((tickerA) => {
      return topTickers.map((tickerB) => {
        if (tickerA === tickerB) return 1;
        const a = returnsByTicker[tickerA];
        const b = returnsByTicker[tickerB];
        if (!a?.length || !b?.length) return null;
        const c = pearsonCorrelation(a, b);
        return isNaN(c) ? null : Math.round(c * 1000) / 1000;
      });
    });
  }, [topTickers, returnsByTicker]);

  const divScore = useMemo(() => diversificationScore(matrix, topTickers), [matrix, topTickers]);
  const avgCorr = useMemo(() => {
    let sum = 0, count = 0;
    for (let i = 0; i < topTickers.length; i++) {
      for (let j = i + 1; j < topTickers.length; j++) {
        const c = matrix[i][j];
        if (c !== null && !isNaN(c)) { sum += c; count++; }
      }
    }
    return count > 0 ? sum / count : null;
  }, [matrix, topTickers]);

  const cellSize = topTickers.length <= 6 ? 60 : topTickers.length <= 8 ? 52 : 44;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Correlation Matrix"
        subtitle="How your holdings move together — identifies concentration risk and natural hedges"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <GlassCard padding="sm">
          <div className="text-xs text-white/40 mb-1">Diversification Score</div>
          <div className={`text-2xl font-bold ${divScore >= 70 ? 'text-emerald-400' : divScore >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>{divScore}/100</div>
          <div className="text-xs text-white/30 mt-0.5">{divScore >= 70 ? 'Well diversified' : divScore >= 40 ? 'Moderate diversification' : 'High concentration'}</div>
        </GlassCard>
        <GlassCard padding="sm">
          <div className="text-xs text-white/40 mb-1">Avg Correlation</div>
          <div className="text-2xl font-bold text-white">{avgCorr !== null ? avgCorr.toFixed(2) : '—'}</div>
          <div className="text-xs text-white/30 mt-0.5">Among holding pairs</div>
        </GlassCard>
        <GlassCard padding="sm">
          <div className="text-xs text-white/40 mb-1">Holdings Analyzed</div>
          <div className="text-2xl font-bold text-cyan-400">{topTickers.length}</div>
          <div className="text-xs text-white/30 mt-0.5">Top by market value</div>
        </GlassCard>
        <GlassCard padding="sm">
          <div className="text-xs text-white/40 mb-1">Data Window</div>
          <div className="text-2xl font-bold text-white">1yr</div>
          <div className="text-xs text-white/30 mt-0.5">Daily returns</div>
        </GlassCard>
      </div>

      {/* Heatmap */}
      <GlassCard>
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-white">Correlation Heatmap</h3>
          {isLoading && <span className="text-xs text-white/40 animate-pulse">Loading price history…</span>}
        </div>

        {topTickers.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">
            Add positions to your portfolio to see correlation data.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div style={{ minWidth: (topTickers.length + 1) * (cellSize + 6) }}>
              {/* Column headers */}
              <div className="flex items-end" style={{ paddingLeft: 80 }}>
                {topTickers.map((t) => (
                  <div
                    key={t}
                    style={{ width: cellSize, marginRight: 4 }}
                    className="text-center"
                  >
                    <span className="text-xs font-semibold text-white/60"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'inline-block' }}
                    >
                      {t}
                    </span>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {topTickers.map((rowTicker, ri) => (
                <div key={rowTicker} className="flex items-center" style={{ marginTop: 4 }}>
                  {/* Row label */}
                  <div style={{ width: 76, flexShrink: 0 }} className="text-right pr-3">
                    <span className="text-xs font-semibold text-white/60">{rowTicker}</span>
                  </div>
                  {/* Cells */}
                  {topTickers.map((colTicker, ci) => (
                    <div
                      key={colTicker}
                      style={{ width: cellSize, height: cellSize, marginRight: 4, flexShrink: 0 }}
                    >
                      <HeatmapCell
                        value={matrix[ri][ci] as number | null}
                        isSelf={ri === ci}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <Legend />
        </div>
      </GlassCard>

      {/* Pair insights */}
      {topTickers.length >= 2 && !isLoading && (
        <GlassCard>
          <h3 className="mb-4 text-sm font-semibold text-white">Key Pair Insights</h3>
          <PairInsights matrix={matrix} tickers={topTickers} />
        </GlassCard>
      )}

      {/* Info */}
      <GlassCard padding="sm">
        <p className="text-xs leading-relaxed text-white/30">
          <span className="text-white/50 font-medium">How it works:</span> Correlation coefficients (-1 to +1) are calculated using Pearson correlation on daily log returns over the past year. A correlation near +1 means the holdings tend to rise and fall together (concentration risk). A correlation near -1 means they tend to move in opposite directions (natural hedge). Values near 0 indicate low statistical relationship. Shows top 12 holdings by market value.
        </p>
      </GlassCard>
    </div>
  );
}
