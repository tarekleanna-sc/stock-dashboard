'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import type { PriceAlert, AlertDirection } from '@/types/alerts';
import type { PositionWithMarketData } from '@/types/portfolio';

export interface PriceAlertWithStatus extends PriceAlert {
  currentPrice: number;
  distancePct: number; // % from current price to target
}

export function usePriceAlerts(enrichedPositions: PositionWithMarketData[]) {
  const { supabase, user } = useSupabase();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [newlyTriggered, setNewlyTriggered] = useState<PriceAlertWithStatus[]>([]);

  const loadAlerts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAlerts(
        data.map((r) => ({
          id: r.id,
          symbol: r.symbol,
          targetPrice: r.target_price,
          direction: r.direction as AlertDirection,
          triggered: r.triggered,
          triggeredAt: r.triggered_at,
          notes: r.notes,
          createdAt: r.created_at,
        }))
      );
    }
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Check alerts against current prices whenever enrichedPositions update
  useEffect(() => {
    if (!user || alerts.length === 0 || enrichedPositions.length === 0) return;

    const priceMap = new Map<string, number>();
    for (const p of enrichedPositions) {
      priceMap.set(p.ticker, p.currentPrice);
    }

    const triggerable = alerts.filter((a) => !a.triggered);
    const fired: PriceAlertWithStatus[] = [];

    for (const alert of triggerable) {
      const currentPrice = priceMap.get(alert.symbol);
      if (currentPrice === undefined) continue;

      const shouldTrigger =
        (alert.direction === 'above' && currentPrice >= alert.targetPrice) ||
        (alert.direction === 'below' && currentPrice <= alert.targetPrice);

      if (shouldTrigger) {
        const distancePct = ((currentPrice - alert.targetPrice) / alert.targetPrice) * 100;
        fired.push({ ...alert, currentPrice, distancePct });
      }
    }

    if (fired.length > 0) {
      setNewlyTriggered(fired);
      // Mark as triggered in Supabase
      for (const alert of fired) {
        supabase
          .from('price_alerts')
          .update({ triggered: true, triggered_at: new Date().toISOString() })
          .eq('id', alert.id)
          .then(() => {
            setAlerts((prev) =>
              prev.map((a) =>
                a.id === alert.id
                  ? { ...a, triggered: true, triggeredAt: new Date().toISOString() }
                  : a
              )
            );
          });
      }
    }
  }, [enrichedPositions, alerts, user, supabase]);

  const addAlert = useCallback(
    async (symbol: string, targetPrice: number, direction: AlertDirection, notes?: string) => {
      if (!user) return;
      const { data, error } = await supabase
        .from('price_alerts')
        .insert({
          user_id: user.id,
          symbol: symbol.toUpperCase(),
          target_price: targetPrice,
          direction,
          notes: notes ?? null,
        })
        .select()
        .single();

      if (!error && data) {
        setAlerts((prev) => [
          {
            id: data.id,
            symbol: data.symbol,
            targetPrice: data.target_price,
            direction: data.direction,
            triggered: false,
            triggeredAt: null,
            notes: data.notes,
            createdAt: data.created_at,
          },
          ...prev,
        ]);
      }
    },
    [supabase, user]
  );

  const deleteAlert = useCallback(
    async (id: string) => {
      await supabase.from('price_alerts').delete().eq('id', id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    },
    [supabase]
  );

  const dismissTriggered = useCallback(() => setNewlyTriggered([]), []);

  // Enrich active alerts with current prices
  const priceMap = new Map<string, number>();
  for (const p of enrichedPositions) priceMap.set(p.ticker, p.currentPrice);

  const enrichedAlerts: PriceAlertWithStatus[] = alerts.map((a) => {
    const currentPrice = priceMap.get(a.symbol) ?? 0;
    const distancePct =
      a.targetPrice > 0
        ? ((currentPrice - a.targetPrice) / a.targetPrice) * 100
        : 0;
    return { ...a, currentPrice, distancePct };
  });

  return {
    alerts: enrichedAlerts,
    loading,
    newlyTriggered,
    addAlert,
    deleteAlert,
    dismissTriggered,
    reload: loadAlerts,
  };
}
