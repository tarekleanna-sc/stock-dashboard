'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { formatPercent } from '@/lib/utils/formatting';
import type { BenchmarkDataPoint } from '@/hooks/useBenchmarkComparison';

interface PortfolioDataPoint {
  date: string;
  totalValue: number;
}

interface BenchmarkOverlayChartProps {
  snapshots: PortfolioDataPoint[];
  benchmarkData: BenchmarkDataPoint[];
  benchmarkLabel: string;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a4e]/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-white text-sm space-y-1">
      <p className="text-white/60 text-xs">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {entry.value >= 0 ? '+' : ''}{entry.value.toFixed(2)}%
        </p>
      ))}
    </div>
  );
};

export default function BenchmarkOverlayChart({
  snapshots,
  benchmarkData,
  benchmarkLabel,
}: BenchmarkOverlayChartProps) {
  // Normalize portfolio snapshots to % return from first date
  const normalizedPortfolio = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];
    const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
    const baseValue = sorted[0].totalValue;
    if (!baseValue) return [];
    return sorted.map((s) => ({
      date: s.date,
      portfolio: parseFloat((((s.totalValue - baseValue) / baseValue) * 100).toFixed(2)),
    }));
  }, [snapshots]);

  // Build a merged date-keyed dataset
  const mergedData = useMemo(() => {
    const benchmarkMap = new Map<string, number>();
    for (const b of benchmarkData) {
      benchmarkMap.set(b.date, b.returnPct);
    }

    return normalizedPortfolio.map((p) => ({
      date: p.date,
      portfolio: p.portfolio,
      benchmark: benchmarkMap.get(p.date) ?? null,
    }));
  }, [normalizedPortfolio, benchmarkData]);

  if (mergedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-white/40 text-sm">
        Portfolio history will build over time as you track your positions.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={mergedData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#ffffff60', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#ffffff60', fontSize: 11 }}
          tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
          axisLine={false}
          tickLine={false}
        />
        <ReferenceLine y={0} stroke="#ffffff20" strokeDasharray="3 3" />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}
        />
        <Line
          type="monotone"
          dataKey="portfolio"
          name="My Portfolio"
          stroke="#06b6d4"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        {benchmarkData.length > 0 && (
          <Line
            type="monotone"
            dataKey="benchmark"
            name={benchmarkLabel}
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
