'use client';

import { useState } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useSubscription } from '@/hooks/useSubscription';
import type { PlanId } from '@/types/billing';

const ADMIN_EMAIL = 'tarekleanna@gmail.com';

const PLANS: { id: PlanId; label: string; color: string }[] = [
  { id: 'free', label: 'Free', color: 'text-white/50' },
  { id: 'pro', label: 'Pro', color: 'text-cyan-400' },
  { id: 'advisor', label: 'Advisor', color: 'text-violet-400' },
];

interface AdminPlanSwitcherProps {
  expanded: boolean;
}

export function AdminPlanSwitcher({ expanded }: AdminPlanSwitcherProps) {
  const { supabase, user } = useSupabase();
  const { plan } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Only render for the admin user
  if (!user || user.email !== ADMIN_EMAIL) return null;

  async function switchPlan(newPlan: PlanId) {
    if (newPlan === plan) { setShowMenu(false); return; }
    setLoading(true);
    setShowMenu(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/admin/set-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: newPlan }),
      });
      if (!res.ok) {
        const body = await res.json();
        console.error('Plan switch failed:', body.error);
      }
    } finally {
      setLoading(false);
    }
  }

  const currentPlanMeta = PLANS.find(p => p.id === plan) ?? PLANS[0];

  return (
    <div className="relative px-2 mt-1">
      <button
        onClick={() => setShowMenu(v => !v)}
        disabled={loading}
        className={`group relative flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 border border-amber-500/30 bg-amber-500/[0.07] hover:bg-amber-500/[0.12] transition-all disabled:opacity-50 ${
          expanded ? '' : 'justify-center'
        }`}
        title="Admin: Switch Plan"
      >
        {/* Shield icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>

        {expanded && (
          <span className="text-xs font-medium text-amber-400/80 whitespace-nowrap transition-all duration-200 opacity-100 truncate">
            {loading ? 'Switching…' : (
              <>
                Admin · <span className={currentPlanMeta.color}>{currentPlanMeta.label}</span>
              </>
            )}
          </span>
        )}

        {/* Tooltip when collapsed */}
        {!expanded && (
          <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-[#1a1a4e]/95 px-3 py-1.5 text-xs font-medium text-amber-400 opacity-0 shadow-lg backdrop-blur-xl transition-opacity duration-150 group-hover:opacity-100 border border-amber-500/20">
            Admin — Plan: {currentPlanMeta.label}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showMenu && (
        <div className="absolute bottom-full left-2 right-2 mb-1 rounded-xl border border-white/[0.09] bg-[#0d0d2b]/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
          <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-amber-400/60">
            Switch plan (admin)
          </p>
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => switchPlan(p.id)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-white/[0.06] transition-colors ${
                plan === p.id ? 'bg-white/[0.04]' : ''
              }`}
            >
              <span className={`font-semibold ${p.color}`}>{p.label}</span>
              {plan === p.id && (
                <span className="ml-auto text-white/30">✓ active</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
