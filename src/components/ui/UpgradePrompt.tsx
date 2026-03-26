'use client';

import { useRouter } from 'next/navigation';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';

interface UpgradePromptProps {
  title?: string;
  description?: string;
  requiredPlan?: 'pro' | 'advisor';
  compact?: boolean;
  className?: string;
}

export function UpgradePrompt({
  title = 'Upgrade to unlock',
  description = 'This feature is available on paid plans.',
  requiredPlan = 'pro',
  compact = false,
  className = '',
}: UpgradePromptProps) {
  const router = useRouter();
  const planLabel = requiredPlan === 'advisor' ? 'Advisor' : 'Pro';
  const planColor = requiredPlan === 'advisor' ? 'violet' : 'cyan';

  if (compact) {
    return (
      <div className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 ${className}`}>
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-${planColor}-500/15`}>
          <svg width="14" height="14" fill="none" stroke={planColor === 'cyan' ? '#22d3ee' : '#8b5cf6'} strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="text-xs text-white/40 truncate">{description}</p>
        </div>
        <GlassButton size="sm" onClick={() => router.push('/billing')}>
          Upgrade to {planLabel}
        </GlassButton>
      </div>
    );
  }

  return (
    <GlassCard className={`text-center py-10 ${className}`}>
      <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-${planColor}-500/10 flex items-center justify-center`}>
        <svg width="24" height="24" fill="none" stroke={planColor === 'cyan' ? '#22d3ee' : '#8b5cf6'} strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/50 text-sm max-w-xs mx-auto mb-6">{description}</p>
      <GlassButton onClick={() => router.push('/billing')}>
        Upgrade to {planLabel}
      </GlassButton>
    </GlassCard>
  );
}
