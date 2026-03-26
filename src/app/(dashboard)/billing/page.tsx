'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS } from '@/types/billing';
import type { PlanConfig } from '@/types/billing';

export default function BillingPage() {
  const { subscription, plan: currentPlan, loading } = useSubscription();
  const searchParams = useSearchParams();
  const router = useRouter();

  const upgraded = searchParams.get('upgraded') === 'true';
  const canceled = searchParams.get('canceled') === 'true';

  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [managingBilling, setManagingBilling] = useState(false);

  // Clear query params after showing banner
  useEffect(() => {
    if (upgraded || canceled) {
      const t = setTimeout(() => router.replace('/billing'), 4000);
      return () => clearTimeout(t);
    }
  }, [upgraded, canceled, router]);

  async function handleUpgrade(planConfig: PlanConfig) {
    if (!planConfig.stripePriceId) return;
    setUpgrading(planConfig.id);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: planConfig.stripePriceId, plan: planConfig.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setUpgrading(null);
    }
  }

  async function handleManageBilling() {
    setManagingBilling(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setManagingBilling(false);
    }
  }

  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <PageHeader
          title="Billing & Plans"
          description="Manage your subscription and unlock powerful features"
        />
        {subscription?.stripeSubscriptionId && (
          <GlassButton
            variant="ghost"
            onClick={handleManageBilling}
            disabled={managingBilling}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {managingBilling ? 'Redirecting...' : 'Manage Billing'}
          </GlassButton>
        )}
      </div>

      {/* Success / cancel banners */}
      {upgraded && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-emerald-300 font-medium">
            Your plan has been upgraded! Welcome to StockDash {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}.
          </p>
        </div>
      )}
      {canceled && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-300">
          Checkout was canceled. Your current plan is unchanged.
        </div>
      )}

      {/* Current plan summary */}
      {!loading && (
        <GlassCard>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Current Plan</p>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white capitalize">{currentPlan}</h2>
                {subscription?.status === 'trialing' && (
                  <GlassBadge variant="warning">Trial</GlassBadge>
                )}
                {subscription?.status === 'past_due' && (
                  <GlassBadge variant="negative">Past Due</GlassBadge>
                )}
                {subscription?.status === 'canceled' && (
                  <GlassBadge variant="default">Canceled</GlassBadge>
                )}
              </div>
              {periodEnd && (
                <p className="text-sm text-white/40 mt-1">
                  {subscription?.cancelAtPeriodEnd
                    ? `Cancels on ${periodEnd}`
                    : `Renews on ${periodEnd}`}
                </p>
              )}
            </div>
            {currentPlan !== 'free' && (
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  ${PLANS.find((p) => p.id === currentPlan)?.price ?? 0}
                  <span className="text-base font-normal text-white/40">/mo</span>
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((planConfig) => {
          const isCurrent = planConfig.id === currentPlan;
          const isHighlighted = planConfig.highlight;

          return (
            <div
              key={planConfig.id}
              className={`relative rounded-2xl border p-6 flex flex-col transition-all ${
                isCurrent
                  ? 'border-cyan-500/50 bg-cyan-500/5'
                  : isHighlighted
                  ? 'border-white/20 bg-white/[0.05]'
                  : 'border-white/[0.08] bg-white/[0.02]'
              }`}
            >
              {/* Badge */}
              {planConfig.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    planConfig.id === 'advisor'
                      ? 'bg-violet-500 text-white'
                      : 'bg-cyan-500 text-black'
                  }`}>
                    {planConfig.badge}
                  </span>
                </div>
              )}

              {/* Plan name + price */}
              <div className="mb-5">
                <h3 className="text-lg font-bold text-white mb-1">{planConfig.name}</h3>
                <p className="text-white/50 text-sm mb-4">{planConfig.description}</p>
                <div className="flex items-end gap-1">
                  {planConfig.price === 0 ? (
                    <span className="text-3xl font-bold text-white">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-white">${planConfig.price}</span>
                      <span className="text-white/40 text-sm mb-1">/month</span>
                    </>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 flex-1 mb-6">
                {planConfig.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    {feature.included ? (
                      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={`text-sm ${feature.included ? 'text-white/70' : 'text-white/25 line-through'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              {isCurrent ? (
                <button
                  disabled
                  className="w-full rounded-xl border border-cyan-500/30 py-2.5 text-sm font-medium text-cyan-400/60 bg-cyan-500/5 cursor-default"
                >
                  Current Plan
                </button>
              ) : planConfig.id === 'free' ? (
                <button
                  disabled
                  className="w-full rounded-xl border border-white/10 py-2.5 text-sm font-medium text-white/30 bg-white/[0.02] cursor-default"
                >
                  Free Forever
                </button>
              ) : (
                <GlassButton
                  className="w-full justify-center"
                  onClick={() => handleUpgrade(planConfig)}
                  disabled={upgrading === planConfig.id || !planConfig.stripePriceId}
                >
                  {upgrading === planConfig.id
                    ? 'Redirecting...'
                    : planConfig.stripePriceId
                    ? `Upgrade to ${planConfig.name}`
                    : 'Coming Soon'}
                </GlassButton>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <GlassCard>
        <h3 className="text-base font-semibold text-white mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
          {[
            {
              q: 'Can I cancel anytime?',
              a: 'Yes. Canceling is instant via the billing portal. You keep access until the end of the current billing period.',
            },
            {
              q: 'Will I lose my data if I downgrade?',
              a: 'No. Your accounts and positions are always preserved. Some features will be hidden until you re-upgrade.',
            },
            {
              q: 'Do you offer refunds?',
              a: 'We offer a 7-day money-back guarantee on new subscriptions. Contact support if you have any issues.',
            },
            {
              q: 'What payment methods do you accept?',
              a: 'All major credit and debit cards (Visa, Mastercard, Amex) via Stripe. All payments are secure and encrypted.',
            },
          ].map((item, i) => (
            <div key={i} className="border-b border-white/[0.06] last:border-0 pb-4 last:pb-0">
              <p className="text-sm font-medium text-white/80 mb-1">{item.q}</p>
              <p className="text-sm text-white/40">{item.a}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
