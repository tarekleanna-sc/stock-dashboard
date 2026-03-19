'use client';

import { ReactNode } from 'react';

interface GlassBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'positive' | 'negative' | 'warning' | 'info';
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  default: 'bg-white/[0.08] text-white/70 border-white/[0.1]',
  positive: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/20',
  negative: 'bg-rose-500/15 text-rose-400 border-rose-400/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-400/20',
  info: 'bg-cyan-500/15 text-cyan-400 border-cyan-400/20',
};

export function GlassBadge({
  children,
  variant = 'default',
  className = '',
  onClick,
}: GlassBadgeProps) {
  return (
    <span
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 px-2.5 py-0.5
        text-xs font-medium rounded-full border
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
