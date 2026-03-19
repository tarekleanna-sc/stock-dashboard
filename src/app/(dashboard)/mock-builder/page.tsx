'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import RiskSlider from '@/components/mock-builder/RiskSlider';
import TimeHorizonSelector from '@/components/mock-builder/TimeHorizonSelector';
import MockPortfolioResultComponent from '@/components/mock-builder/MockPortfolioResult';
import { buildMockPortfolio } from '@/lib/analysis/mockBuilder';
import {
  RiskTolerance,
  TimeHorizon,
  MockPortfolioConfig,
  MockPortfolioResult,
} from '@/types/analysis';

export default function MockBuilderPage() {
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>('moderate');
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('medium');
  const [accountSize, setAccountSize] = useState<number>(100000);
  const [result, setResult] = useState<MockPortfolioResult | null>(null);

  const handleBuild = () => {
    const config: MockPortfolioConfig = {
      riskTolerance,
      timeHorizon,
      accountSize,
    };
    const portfolio = buildMockPortfolio(config);
    setResult(portfolio);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mock Portfolio Builder"
        description="Build a Carlson-style portfolio of fundamentally strong companies — quality businesses at reasonable prices"
      />

      <GlassCard className="p-6 space-y-8">
        {/* Step 1: Risk Tolerance */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-sm font-semibold text-cyan-300">
              1
            </div>
            <h3 className="text-lg font-semibold text-white">Risk Tolerance</h3>
          </div>
          <RiskSlider value={riskTolerance} onChange={setRiskTolerance} />
        </div>

        {/* Step 2: Time Horizon */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-sm font-semibold text-cyan-300">
              2
            </div>
            <h3 className="text-lg font-semibold text-white">Time Horizon</h3>
          </div>
          <TimeHorizonSelector value={timeHorizon} onChange={setTimeHorizon} />
        </div>

        {/* Step 3: Account Size */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-sm font-semibold text-cyan-300">
              3
            </div>
            <h3 className="text-lg font-semibold text-white">Account Size</h3>
          </div>
          <div className="flex items-center gap-3 max-w-sm">
            <span className="text-white/50 text-lg font-medium">$</span>
            <GlassInput
              type="number"
              value={accountSize}
              onChange={(e) => setAccountSize(parseFloat(e.target.value) || 0)}
              min={1000}
              step={1000}
              placeholder="100000"
              className="text-lg"
            />
          </div>
          <p className="text-xs text-white/30 mt-2">Minimum $1,000</p>
        </div>

        {/* Build Button */}
        <div className="pt-2">
          <GlassButton
            onClick={handleBuild}
            variant="primary"
            size="lg"
            disabled={accountSize < 1000}
            className="w-full sm:w-auto"
          >
            Build Portfolio
          </GlassButton>
        </div>
      </GlassCard>

      {/* Results */}
      {result && <MockPortfolioResultComponent result={result} />}
    </div>
  );
}
