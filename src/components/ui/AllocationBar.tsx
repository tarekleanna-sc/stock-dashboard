'use client';

interface AllocationSegment {
  ticker: string;
  allocation: number; // 0–100
  color: string;
}

interface AllocationBarProps {
  segments: AllocationSegment[];
  height?: number;
}

export function AllocationBar({ segments, height = 8 }: AllocationBarProps) {
  const total = segments.reduce((sum, s) => sum + s.allocation, 0);
  if (total === 0) return null;

  return (
    <div
      className="flex w-full overflow-hidden rounded-full gap-px"
      style={{ height }}
    >
      {segments.map((seg, i) => (
        <div
          key={seg.ticker}
          title={`${seg.ticker} ${seg.allocation.toFixed(1)}%`}
          style={{
            width: `${(seg.allocation / total) * 100}%`,
            backgroundColor: seg.color,
            borderRadius:
              i === 0
                ? '9999px 0 0 9999px'
                : i === segments.length - 1
                ? '0 9999px 9999px 0'
                : '0',
          }}
        />
      ))}
    </div>
  );
}
