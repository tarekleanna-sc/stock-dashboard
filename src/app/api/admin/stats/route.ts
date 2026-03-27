import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/service';

/**
 * GET /api/admin/stats
 * Returns SaaS metrics: user counts, plan distribution, MRR, churn.
 * Protected by ADMIN_SECRET_KEY env var.
 */

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  pro: 9.99,
  advisor: 29.99,
};

export async function GET(req: NextRequest) {
  // Simple secret-key auth for admin endpoint
  const secret = req.headers.get('x-admin-key') ?? req.nextUrl.searchParams.get('key');
  const expected = process.env.ADMIN_SECRET_KEY;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();

  // Fetch subscriptions
  const { data: subs, error: subErr } = await supabase
    .from('subscriptions')
    .select('plan, status, created_at, user_id');

  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }

  // Fetch total users (auth.users requires service role)
  const { data: { users }, error: usersErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const totalUsers = usersErr ? null : users?.length ?? 0;

  const activeSubs = (subs ?? []).filter(s => s.status === 'active');

  // Plan distribution
  const planCounts: Record<string, number> = { free: 0, pro: 0, advisor: 0 };
  for (const s of activeSubs) {
    planCounts[s.plan] = (planCounts[s.plan] ?? 0) + 1;
  }

  // Users without a subscription row (or free plan) are free users
  const paidSubs = activeSubs.filter(s => s.plan !== 'free');

  // MRR
  const mrr = paidSubs.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0), 0);
  const arr = mrr * 12;

  // New subscribers last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newSubs30d = activeSubs.filter(s => new Date(s.created_at) > thirtyDaysAgo).length;

  // Churn: canceled subscriptions
  const canceledSubs = (subs ?? []).filter(s => s.status === 'canceled');
  const newCanceled30d = canceledSubs.filter(s => new Date(s.created_at) > thirtyDaysAgo).length;

  // New users last 30d
  const newUsers30d = users
    ? users.filter(u => new Date(u.created_at) > thirtyDaysAgo).length
    : null;

  // Users by signup date for chart (last 30 days)
  const dailySignups: Record<string, number> = {};
  if (users) {
    for (const u of users) {
      const d = u.created_at.slice(0, 10);
      const dDate = new Date(d);
      if (dDate > thirtyDaysAgo) {
        dailySignups[d] = (dailySignups[d] ?? 0) + 1;
      }
    }
  }

  const dailySignupsArray = Object.entries(dailySignups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    totalUsers,
    newUsers30d,
    activeSubscriptions: activeSubs.length,
    paidSubscriptions: paidSubs.length,
    newSubs30d,
    canceledSubs: canceledSubs.length,
    newCanceled30d,
    planDistribution: planCounts,
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(arr * 100) / 100,
    dailySignups: dailySignupsArray,
    generatedAt: new Date().toISOString(),
  });
}
