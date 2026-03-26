export type PlanId = 'free' | 'pro' | 'advisor';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: PlanId;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number;          // monthly price in USD
  stripePriceId: string;  // set via NEXT_PUBLIC_STRIPE_PRICE_PRO / _ADVISOR env vars
  description: string;
  features: PlanFeature[];
  badge?: string;
  highlight?: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    stripePriceId: '',
    description: 'Get started with portfolio tracking',
    features: [
      { text: 'Up to 2 brokerage accounts', included: true },
      { text: 'Up to 20 positions', included: true },
      { text: 'Live market data', included: true },
      { text: 'Basic charts & analytics', included: true },
      { text: 'CSV / PDF export', included: false },
      { text: 'Price alerts', included: false },
      { text: 'Benchmark comparison', included: false },
      { text: 'Dividend tracking', included: false },
      { text: 'Risk metrics (Beta, Sharpe)', included: false },
      { text: 'Multi-client advisor mode', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? '',
    description: 'Powerful tools for active investors',
    highlight: true,
    badge: 'Most Popular',
    features: [
      { text: 'Unlimited accounts & positions', included: true },
      { text: 'Live market data', included: true },
      { text: 'All charts & analytics', included: true },
      { text: 'CSV & PDF export', included: true },
      { text: 'Price alerts (unlimited)', included: true },
      { text: 'Benchmark comparison', included: true },
      { text: 'Dividend tracking', included: true },
      { text: 'Risk metrics (Beta, Sharpe)', included: true },
      { text: 'Realized gains & tax summary', included: true },
      { text: 'Multi-client advisor mode', included: false },
    ],
  },
  {
    id: 'advisor',
    name: 'Advisor',
    price: 29.99,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ADVISOR ?? '',
    description: 'Built for financial advisors & RIAs',
    badge: 'Best Value',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited client portfolios', included: true },
      { text: 'Per-client dashboard view', included: true },
      { text: 'Branded PDF reports', included: true },
      { text: 'Client notes & CRM', included: true },
      { text: 'Priority support', included: true },
      { text: 'Early access to new features', included: true },
      { text: 'Multi-client advisor mode', included: true },
    ],
  },
];
