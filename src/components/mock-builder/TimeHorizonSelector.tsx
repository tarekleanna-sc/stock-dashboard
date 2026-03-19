'use client';

import { TimeHorizon, HORIZON_LABELS } from '@/types/analysis';

interface TimeHorizonSelectorProps {
  value: TimeHorizon;
  onChange: (v: TimeHorizon) => void;
}

const HORIZON_OPTIONS: { value: TimeHorizon; description: string }[] = [
  { value: 'short', description: '1-2 years' },
  { value: 'medium', description: '3-5 years' },
  { value: 'long', description: '5+ years' },
];

export default function TimeHorizonSelector({ value, onChange }: TimeHorizonSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
        {HORIZON_OPTIONS.map((option) => {
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border-b-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                    : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                }
              `}
            >
              {HORIZON_LABELS[option.value]}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-white/40 text-center">
        {HORIZON_OPTIONS.find((o) => o.value === value)?.description}
      </p>
    </div>
  );
}
