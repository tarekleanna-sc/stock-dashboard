'use client';

interface DriftIndicatorProps {
  drift: number;
}

export default function DriftIndicator({ drift }: DriftIndicatorProps) {
  const absDrift = Math.abs(drift);
  const maxBarWidth = 40;
  const barWidth = Math.min(absDrift * 3, maxBarWidth);
  const isOverweight = drift > 0;

  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="relative w-24 h-4 flex items-center">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />

        {/* Drift bar */}
        {absDrift > 0.1 && (
          <div
            className={`absolute top-0.5 bottom-0.5 rounded-sm transition-all duration-300 ${
              isOverweight
                ? 'bg-rose-400/60 right-1/2'
                : 'bg-emerald-400/60 left-1/2'
            }`}
            style={{
              width: `${barWidth}%`,
            }}
          />
        )}
      </div>

      <span
        className={`text-xs font-medium tabular-nums min-w-[3rem] text-right ${
          absDrift < 2
            ? 'text-white/40'
            : isOverweight
            ? 'text-rose-400'
            : 'text-emerald-400'
        }`}
      >
        {drift > 0 ? '+' : ''}
        {drift.toFixed(1)}%
      </span>
    </div>
  );
}
