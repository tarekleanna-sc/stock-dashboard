'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import type { Subscription, PlanId } from '@/types/billing';

interface UseSubscriptionResult {
  subscription: Subscription | null;
  plan: PlanId;
  loading: boolean;
}

function mapRow(row: Record<string, unknown>): Subscription {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    stripeCustomerId: (row.stripe_customer_id as string | null) ?? null,
    stripeSubscriptionId: (row.stripe_subscription_id as string | null) ?? null,
    plan: (row.plan as PlanId) ?? 'free',
    status: (row.status as Subscription['status']) ?? 'active',
    currentPeriodEnd: (row.current_period_end as string | null) ?? null,
    cancelAtPeriodEnd: (row.cancel_at_period_end as boolean) ?? false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function useSubscription(): UseSubscriptionResult {
  const { supabase, user } = useSupabase();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchSubscription() {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!error && data) {
        setSubscription(mapRow(data as Record<string, unknown>));
      }
      setLoading(false);
    }

    fetchSubscription();

    // Realtime subscription updates (e.g. after Stripe webhook)
    const channel = supabase
      .channel('subscription-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.new) {
            setSubscription(mapRow(payload.new as Record<string, unknown>));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const effectivePlan: PlanId =
    subscription?.status === 'active' || subscription?.status === 'trialing'
      ? (subscription.plan ?? 'free')
      : 'free';

  return { subscription, plan: effectivePlan, loading };
}
