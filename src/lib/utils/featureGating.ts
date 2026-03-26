import type { PlanId } from '@/types/billing';

/**
 * Feature gating utility.
 * All feature checks are centralised here so plan limits are easy to audit.
 */

/** Tier hierarchy: free < pro < advisor */
const TIER: Record<PlanId, number> = { free: 0, pro: 1, advisor: 2 };

function atLeast(plan: PlanId | null | undefined, required: PlanId): boolean {
  return TIER[plan ?? 'free'] >= TIER[required];
}

// ─── Feature flags ────────────────────────────────────────────────────────────

/** Unlimited accounts/positions — free is capped at 2 accounts / 20 positions */
export function canAddUnlimitedPositions(plan: PlanId | null | undefined): boolean {
  return atLeast(plan, 'pro');
}

/** Max accounts on free plan */
export const FREE_ACCOUNT_LIMIT = 2;
/** Max positions on free plan (across all accounts) */
export const FREE_POSITION_LIMIT = 20;

/** CSV and PDF export */
export function canExport(plan: PlanId | null | undefined): boolean {
  return atLeast(plan, 'pro');
}

/** Price alerts */
export function canUseAlerts(plan: PlanId | null | undefined): boolean {
  return atLeast(plan, 'pro');
}

/** Benchmark comparison overlay */
export function canUseBenchmarks(plan: PlanId | null | undefined): boolean {
  return atLeast(plan, 'pro');
}

/** Dividend tracking */
export function canUseDividends(plan: PlanId | null | undefined): boolean {
  return atLeast(plan, 'pro');
}

/** Risk metrics panel (beta, Sharpe, volatility) */
export function canUseRiskMetrics(plan: PlanId | null | undefined): boolean {
  return atLeast(plan, 'pro');
}

/** Multi-client advisor mode */
export function canUseClients(plan: PlanId | null | undefined): boolean {
  return atLeast(plan, 'advisor');
}

/** Branded PDF reports */
export function canUseBrandedReports(plan: PlanId | null | undefined): boolean {
  return atLeast(plan, 'advisor');
}

/** Convenience: is user on a paid plan (pro or advisor)? */
export function isPaid(plan: PlanId | null | undefined): boolean {
  return atLeast(plan, 'pro');
}
