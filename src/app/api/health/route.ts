import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Returns which API keys are configured (boolean only — never exposes key values).
 * Useful for diagnosing missing env vars on Netlify or any hosting platform.
 *
 * Example response:
 * {
 *   "ok": true,
 *   "keys": {
 *     "FMP_API_KEY": true,
 *     "FINNHUB_API_KEY": false,
 *     "SUPABASE": true,
 *     "STRIPE": false,
 *     "RESEND_API_KEY": false
 *   },
 *   "warnings": ["FINNHUB_API_KEY not set — using FMP only for quotes"]
 * }
 */
export async function GET() {
  const keys = {
    FMP_API_KEY: !!process.env.FMP_API_KEY,
    FINNHUB_API_KEY: !!process.env.FINNHUB_API_KEY,
    SUPABASE: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE: !!process.env.STRIPE_SECRET_KEY,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    ADMIN_SECRET_KEY: !!process.env.ADMIN_SECRET_KEY,
  };

  const warnings: string[] = [];
  if (!keys.FMP_API_KEY) warnings.push('FMP_API_KEY not set — market prices and P&L will show $0');
  if (!keys.FINNHUB_API_KEY) warnings.push('FINNHUB_API_KEY not set — using FMP only for quotes (lower rate limit)');
  if (!keys.SUPABASE) warnings.push('Supabase env vars missing — auth and data will not work');
  if (!keys.STRIPE) warnings.push('STRIPE_SECRET_KEY not set — billing/upgrades will not work');
  if (!keys.RESEND_API_KEY) warnings.push('RESEND_API_KEY not set — email digests will not send');

  const critical = !keys.FMP_API_KEY || !keys.SUPABASE;

  return NextResponse.json(
    { ok: !critical, keys, warnings },
    { status: 200 }
  );
}
