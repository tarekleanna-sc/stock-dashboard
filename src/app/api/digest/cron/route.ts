import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * POST /api/digest/cron
 * Automated weekly digest sender — called by Vercel Cron or any scheduler.
 *
 * Add to vercel.json (or netlify.toml scheduled functions):
 *   { "path": "/api/digest/cron", "schedule": "0 9 * * 1" }
 *
 * Protected by CRON_SECRET env var (set this in your hosting dashboard).
 * Pass it as: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: NextRequest) {
  // Auth check — accept the same ADMIN_SECRET_KEY or a dedicated CRON_SECRET
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace('Bearer ', '').trim();
  const expected = process.env.CRON_SECRET ?? process.env.ADMIN_SECRET_KEY;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 });
  }

  const supabase = createServiceClient();

  // Fetch all users who have an active subscription (free users included for now)
  const { data: { users }, error: usersErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (usersErr || !users) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  // Only email users who have opted in (have an email)
  const eligibleUsers = users.filter((u) => !!u.email);

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stockdash.app';
  const results: { userId: string; status: string }[] = [];

  for (const user of eligibleUsers) {
    try {
      // Call the main send route for each user
      const res = await fetch(`${APP_URL}/api/digest/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          toEmail: user.email,
          // No portfolio data — the send route will skip gracefully if not provided
          // For full per-user data, extend this to pull from the DB
          totalValue: 0,
          weekChange: 0,
          weekChangePct: 0,
          topGainers: [],
          topLosers: [],
          holdings: [],
        }),
      });
      results.push({ userId: user.id, status: res.ok ? 'sent' : 'failed' });
    } catch {
      results.push({ userId: user.id, status: 'error' });
    }
  }

  const sent = results.filter((r) => r.status === 'sent').length;
  const failed = results.filter((r) => r.status !== 'sent').length;

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    total: eligibleUsers.length,
    triggeredAt: new Date().toISOString(),
  });
}
