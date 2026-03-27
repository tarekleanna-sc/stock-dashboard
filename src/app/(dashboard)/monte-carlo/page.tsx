'use client';

import { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import PageHeader from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useRiskMetrics } from '@/hooks/useRiskMetrics';
import { formatCurrency, formatPercent } from '@/lib/utils/formatting';

// ─── Monte Carlo engine ───────────────────────────────────────────────────────

interface SimulationResult {
  year: number;
  p10: number;   // 10th percentile (bear case)
  p25: number;
  p50: number;   // median
  p75: number;
  p90: number;   // 90th percentile (bull case)
}

/**
 * Run N simulations of Geometric Brownian Motion for `years` years.
 * Each path assumes annual steps using the provided drift (mu) and volatility (sigma).
 */
function runMonteCarlo(
  initialValue: number,
  mu: number,       // annualized expected return (decimal, e.g. 0.08)
  sigma: number,    // annualized volatility (decimal, e.g. 0.18)
  years: number,
  numSims: number = 1000,
  annualContribution: number = 0,
): SimulationResult[] {
  if (initialValue <= 0) return [];

  // Box-Muller transform for normal random numbers
  function randNormal(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  // Each simulation produces an array of annual values [year0, year1, ..., yearN]
  const allPaths: number[][] = [];

  for (let s = 0; s < numSims; s++) {
    const path: number[] = [initialValue];
    let val = initialValue;
    for (let y = 1; y <= years; y++) {
      // GBM step: V_t = V_{t-1} * exp((mu - sigma^2/2) * dt + sigma * sqrt(dt) * Z)
      const dt = 1; // annual steps
      const z = randNormal();
      const drift = (mu - 0.5 * sigma * sigma) * dt;
      const diffusion = sigma * Math.sqrt(dt) * z;
      val = val * Math.exp(drift + diffusion) + annualContribution;
      path.push(Math.max(val, 0)); // floor at 0
    }
    allPaths.push(path);
  }

  // Compute percentiles for each year
  const results: SimulationResult[] = [];
  for (let y = 0; y <= years; y++) {
    const vals = allPaths.map((path) => path[y]).sort((a, b) => a - b);
    const p = (pct: number) => vals[Math.max(0, Math.floor((pct / 100) * vals.length) - 1)];
    results.push({
      year: y,
      p10: p(10),
      p25: p(25),
      p50: p(50),
      p75: p(75),
      p90: p(90),
    });
  }
  return results;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pctChg(from: number, to: number): number {
  return from > 0 ? ((to - from) / from) * 100 : 0;
}

const CURRENT_YEAR = new Date().getFullYear();

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: number }) {
  if (!active || !payload?.length) return null;
  const year = (CURRENT_YEAR + (label ?? 0));
  return (
    <div className="rounded-xl border border-white/[0.12] bg-[#0f1020]/95 px-4 py-3 text-xs shadow-xl backdrop-blur-2xl">
      <div className="mb-2 font-semibold text-white/80">Year {year}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium text-white">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Scenario cards ───────────────────────────────────────────────────────────

function ScenarioCard({ label, value, pct, variant, sub }: {
  label: string;
  value: number;
  pct: number;
  variant: 'positive' | 'negative' | 'default';
  sub: string;
}) {
  return (
    <GlassCard padding="sm">
      <div className="mb-1 text-xs text-white/40">{label}</div>
      <div className="text-xl font-bold text-white">{formatCurrency(value)}</div>
      <div className={`mt-0.5 text-sm font-medium ${
        variant === 'positive' ? 'text-emerald-400' : variant === 'negative' ? 'text-rose-400' : 'text-cyan-400'
      }`}>
        {pct >= 0 ? '+' : ''}{pct.toFixed(0)}%
      </div>
      <div className="mt-1 text-xs text-white/30">{sub}</div>
    </GlassCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MonteCarloPage() {
  const { enrichedPositions, totalValue, isLoading } = usePortfolioValue();
  const snapshots = usePortfolioStore((s) => s.snapshots);
  const riskMetrics = useRiskMetrics(enrichedPositions, snapshots);

  // Simulation parameters
  const [years, setYears] = useState(10);
  const [annualReturn, setAnnualReturn] = useState(8); // %
  const [volatility, setVolatility] = useState<number | null>(null); // null = use computed
  const [contribution, setContribution] = useState(0); // annual addition
  const [numSims] = useState(1000);

  // Use computed volatility from snapshots if available, else default 18%
  const effectiveVolatility = volatility ?? (
    riskMetrics.annualizedVolatility !== null
      ? Math.round(riskMetrics.annualizedVolatility)
      : 18
  );

  const simData = useMemo(() => {
    if (!totalValue || totalValue <= 0) return [];
    return runMonteCarlo(
      totalValue,
      annualReturn / 100,
      effectiveVolatility / 100,
      years,
      numSims,
      contribution,
    );
  }, [totalValue, annualReturn, effectiveVolatility, years, contribution, numSims]);

  const chartData = useMemo(() => {
    return simData.map((d) => ({
      yearLabel: d.year === 0 ? 'Now' : String(CURRENT_YEAR + d.year),
      year: d.year,
      'Bear (10%)': Math.round(d.p10),
      '25th pct': Math.round(d.p25),
      'Median (50%)': Math.round(d.p50),
      '75th pct': Math.round(d.p75),
      'Bull (90%)': Math.round(d.p90),
    }));
  }, [simData]);

  const finalData = simData[simData.length - 1];

  const successRate = useMemo(() => {
    // Probability final value > initial (beat inflation target)
    if (!finalData) return null;
    // Approximate using log-normal CDF
    const mu = annualReturn / 100;
    const sig = effectiveVolatility / 100;
    const yr = years;
    const logMean = Math.log(totalValue) + (mu - 0.5 * sig * sig) * yr;
    const logStd = sig * Math.sqrt(yr);
    // P(X > initialValue) where X is log-normal
    const z = (Math.log(totalValue) - logMean) / logStd;
    // Standard normal CDF approximation
    const erfApprox = (x: number) => {
      const t = 1 / (1 + 0.3275911 * Math.abs(x));
      const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
      return 1 - poly * Math.exp(-x * x);
    };
    const cdf = (x: number) => 0.5 * (1 + erfApprox(x / Math.SQRT2) * Math.sign(x));
    return Math.round((1 - cdf(z)) * 100);
  }, [finalData, annualReturn, effectiveVolatility, years, totalValue]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monte Carlo Simulation"
        description="Probabilistic portfolio projections based on expected returns and volatility"
      />

      {/* Parameter controls */}
      <GlassCard>
        <h3 className="mb-5 text-sm font-semibold text-white">Simulation Parameters</h3>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Years */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-white/60">Time Horizon</label>
              <span className="text-sm font-semibold text-white">{years}yr</span>
            </div>
            <input
              type="range"
              min={1} max={30} step={1}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="mt-1 flex justify-between text-[10px] text-white/25">
              <span>1yr</span><span>15yr</span><span>30yr</span>
            </div>
          </div>

          {/* Expected annual return */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-white/60">Expected Return</label>
              <span className="text-sm font-semibold text-white">{annualReturn}%/yr</span>
            </div>
            <input
              type="range"
              min={-5} max={25} step={0.5}
              value={annualReturn}
              onChange={(e) => setAnnualReturn(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="mt-1 flex justify-between text-[10px] text-white/25">
              <span>-5%</span><span>10%</span><span>25%</span>
            </div>
          </div>

          {/* Volatility */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-white/60">Annual Volatility</label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white">{effectiveVolatility}%</span>
                {riskMetrics.annualizedVolatility !== null && volatility === null && (
                  <GlassBadge variant="info">computed</GlassBadge>
                )}
              </div>
            </div>
            <input
              type="range"
              min={5} max={60} step={1}
              value={effectiveVolatility}
              onChange={(e) => setVolatility(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
            <div className="mt-1 flex justify-between text-[10px] text-white/25">
              <span>5%</span><span>30%</span><span>60%</span>
            </div>
            {riskMetrics.annualizedVolatility !== null && volatility !== null && (
              <button onClick={() => setVolatility(null)} className="mt-1 text-[10px] text-cyan-400/70 hover:text-cyan-400">
                Reset to computed ({Math.round(riskMetrics.annualizedVolatility)}%)
              </button>
            )}
          </div>

          {/* Annual contribution */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-white/60">Annual Contribution</label>
              <span className="text-sm font-semibold text-white">{formatCurrency(contribution)}</span>
            </div>
            <input
              type="range"
              min={0} max={100000} step={1000}
              value={contribution}
              onChange={(e) => setContribution(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="mt-1 flex justify-between text-[10px] text-white/25">
              <span>$0</span><span>$50k</span><span>$100k</span>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        {riskMetrics.annualizedVolatility !== null && (
          <div className="mt-4 flex flex-wrap gap-4 border-t border-white/[0.06] pt-4 text-xs text-white/40">
            <span>Portfolio vol (computed): <span className="text-white/70">{riskMetrics.annualizedVolatility.toFixed(1)}%</span></span>
            {riskMetrics.sharpeRatio !== null && (
              <span>Sharpe ratio: <span className="text-white/70">{riskMetrics.sharpeRatio.toFixed(2)}</span></span>
            )}
            <span>Simulations: <span className="text-white/70">{numSims.toLocaleString()}</span></span>
          </div>
        )}
      </GlassCard>

      {/* Outcome cards */}
      {finalData && totalValue > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <ScenarioCard label="Bear Case (10th)" value={finalData.p10} pct={pctChg(totalValue, finalData.p10)} variant="negative" sub="Worst 10% of outcomes" />
          <ScenarioCard label="25th Percentile" value={finalData.p25} pct={pctChg(totalValue, finalData.p25)} variant="default" sub="Below-median outcome" />
          <ScenarioCard label="Median (50th)" value={finalData.p50} pct={pctChg(totalValue, finalData.p50)} variant="default" sub="Most likely outcome" />
          <ScenarioCard label="75th Percentile" value={finalData.p75} pct={pctChg(totalValue, finalData.p75)} variant="positive" sub="Above-median outcome" />
          <ScenarioCard label="Bull Case (90th)" value={finalData.p90} pct={pctChg(totalValue, finalData.p90)} variant="positive" sub="Best 10% of outcomes" />
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <GlassCard>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Projection Paths</h3>
              <p className="mt-0.5 text-xs text-white/40">
                {numSims.toLocaleString()} simulated portfolios over {years} years — shaded band = 25th to 75th percentile
              </p>
            </div>
            {successRate !== null && (
              <div className="text-right">
                <div className="text-xs text-white/40">Probability of gain</div>
                <div className={`text-lg font-bold ${successRate >= 60 ? 'text-emerald-400' : successRate >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {successRate}%
                </div>
              </div>
            )}
          </div>

          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="yearLabel" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <YAxis
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                tickFormatter={(v) => {
                  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
                  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}k`;
                  return `$${v}`;
                }}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Confidence band 25th–75th */}
              <Area
                type="monotone"
                dataKey="25th pct"
                stroke="none"
                fill="url(#bandGradient)"
                fillOpacity={1}
                legendType="none"
              />
              <Area
                type="monotone"
                dataKey="75th pct"
                stroke="none"
                fill="none"
                legendType="none"
              />

              {/* Percentile lines */}
              <Line type="monotone" dataKey="Bear (10%)" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              <Line type="monotone" dataKey="25th pct" stroke="#6366f1" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="Median (50%)" stroke="#10b981" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="75th pct" stroke="#6366f1" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="Bull (90%)" stroke="#22d3ee" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />

              <Legend
                formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{value}</span>}
              />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      )}

      {/* Assumptions & disclaimer */}
      {isLoading && (
        <div className="text-center text-sm text-white/40 py-8">Loading portfolio data...</div>
      )}

      {!isLoading && totalValue <= 0 && (
        <GlassCard>
          <p className="text-center text-sm text-white/40 py-4">
            Add positions to your portfolio to run the Monte Carlo simulation.
          </p>
        </GlassCard>
      )}

      <GlassCard padding="sm">
        <p className="text-xs leading-relaxed text-white/30">
          <span className="text-white/50 font-medium">How it works:</span> This simulation models {numSims.toLocaleString()} random portfolio paths using Geometric Brownian Motion (GBM) — the same model underlying the Black-Scholes formula. Each year, the portfolio value is multiplied by a random return drawn from a log-normal distribution with the drift (expected return) and volatility parameters above. The percentile bands show the range of outcomes across all simulations. <span className="text-white/40">This is for educational purposes only and does not constitute financial advice. Past performance is not indicative of future results.</span>
        </p>
      </GlassCard>
    </div>
  );
}
