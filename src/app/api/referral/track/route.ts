import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@/lib/supabase/service';

/**
 * POST /api/referral/track
 * Tracks when a new user signs up using a referral code.
 * Called after successful signup, from auth callback.
 * Body: { code: string }
 */

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { code: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const service = createServiceClient();

  // Find referral code
  const { data: codeRow, error: codeErr } = await service
    .from('referral_codes')
    .select('id, user_id, code')
    .eq('code', body.code.toUpperCase().trim())
    .single();

  if (codeErr || !codeRow) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
  }

  // Prevent self-referral
  if (codeRow.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 });
  }

  // Check if already referred
  const { data: existing } = await service
    .from('referrals')
    .select('id')
    .eq('referred_user_id', user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Already tracked' }, { status: 409 });
  }

  // Record referral
  await service.from('referrals').insert({
    user_id: codeRow.user_id,
    code: codeRow.code,
    referred_user_id: user.id,
    status: 'pending',
  });

  // Increment used_count
  await service.rpc('increment_referral_count', { referral_code: codeRow.code });

  // Store referral in referred user's metadata so we can apply discount later
  await supabase.auth.updateUser({ data: { referred_by: body.code } });

  return NextResponse.json({ ok: true });
}
