'use client';

import Image from 'next/image';
import { useState } from 'react';
import { CHART_COLORS } from '@/lib/utils/constants';

interface StockLogoProps {
  ticker: string;
  logoUrl?: string;
  size?: number;
  className?: string;
}

// Generate a consistent color from ticker
function tickerColor(ticker: string): string {
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CHART_COLORS[Math.abs(hash) % CHART_COLORS.length];
}

export function StockLogo({ ticker, logoUrl, size = 40, className = '' }: StockLogoProps) {
  const [imgError, setImgError] = useState(false);
  const color = tickerColor(ticker);

  if (logoUrl && !imgError) {
    return (
      <div
        className={`relative flex-shrink-0 overflow-hidden rounded-xl bg-[#1a1c2e] ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={logoUrl}
          alt={ticker}
          fill
          className="object-contain p-1.5"
          onError={() => setImgError(true)}
          unoptimized
        />
      </div>
    );
  }

  // Fallback: gradient letter badge
  return (
    <div
      className={`flex-shrink-0 rounded-xl flex items-center justify-center font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}cc 0%, ${color}66 100%)`,
        fontSize: size * 0.38,
      }}
    >
      {ticker.slice(0, 1)}
    </div>
  );
}
