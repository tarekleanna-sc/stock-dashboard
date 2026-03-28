import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

const ADMIN_EMAIL = 'tarekleanna@gmail.com';

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();

  // Verify the requesting user is the admin
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { plan } = await req.json();
  if (!['free', 'pro', 'advisor'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  // Upsert the subscription row for this user
  const { error } = await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: user.id,
        plan,
        status: 'active',
        stripe_customer_id: null,
        stripe_subscription_id: null,
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, plan });
}
