'use client';

import { useEffect, useRef } from 'react';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useSupabase } from '@/providers/SupabaseProvider';

/**
 * Automatically captures a daily portfolio snapshot on login.
 * Safe to call multiple times — only fires once per calendar day per user.
 * Must be called inside a component that also uses usePortfolioValue so that
 * totalValue is passed in after market data loads.
 */
export function useAutoSnapshot(totalValue: number, isLoadingPrices: boolean) {
  const { supabase, user } = useSupabase();
  const { snapshots, hydrated, addSnapshot } = usePortfolioStore();
  const hasFiredRef = useRef(false);

  useEffect(() => {
    // Wait until store is hydrated, prices have loaded, and we have a real value
    if (!hydrated || isLoadingPrices || totalValue <= 0 || !user) return;
    // Only fire once per hook mount (avoids double-firing in StrictMode / re-renders)
    if (hasFiredRef.current) return;

    const today = new Date().toISOString().split('T')[0];
    const alreadyHasToday = snapshots.some((s) => s.date === today);

    if (!alreadyHasToday) {
      hasFiredRef.current = true;
      addSnapshot(totalValue, supabase, user.id);
    } else {
      // Already captured today — mark as fired so we don't keep checking
      hasFiredRef.current = true;
    }
  }, [hydrated, isLoadingPrices, totalValue, user, snapshots, addSnapshot, supabase]);
}
