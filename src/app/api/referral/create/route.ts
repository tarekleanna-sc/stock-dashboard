import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createServiceClient } from "@/lib/supabase/service";

/**
 * POST /api/referral/create
 * Creates (or returns existing) referral code for the authenticated user.
 * Also seeds the referrals table row if it doesn't exist.
 *
 * Requires Supabase migration: add_referrals.sql
 * Table: referrals (id, user_id, code, referred_user_id, status, created_at)
 * Table: referral_codes (id, user_id, code, used_count, created_at)
 */

function generateCode(userId: string): string {
  // First 6 chars of userId + 4 random alphanumeric
  const base = userId.replace(/-/g, '').slice(0, 6).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SD-${base}${rand}`;
}

export async function POST(_req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();

  // Check if user already has a code
  const { data: existing } = await service
    .from('referral_codes')
    .select('code, used_count')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return NextResponse.json({ code: existing.code, usedCount: existing.used_count });
  }

  // Create new code
  const code = generateCode(user.id);
  const { data: created, error: createErr } = await service
    .from('referral_codes')
    .insert({ user_id: user.id, code, used_count: 0 })
    .select('code, used_count')
    .single();

  if (createErr) {
    return NextResponse.json({ error: createErr.message }, { status: 500 });
  }

  return NextResponse.json({ code: created.code, usedCount: created.used_count });
}
