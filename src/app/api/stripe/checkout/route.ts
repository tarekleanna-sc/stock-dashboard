import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCustomer, createCheckoutSession } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, plan } = await req.json();
    if (!priceId) {
      return NextResponse.json({ error: 'priceId is required' }, { status: 400 });
    }

    // Fetch existing subscription row to get Stripe customer ID
    const { data: subRow } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = subRow?.stripe_customer_id as string | null;

    // Create Stripe customer if none exists
    if (!customerId) {
      const customer = await createCustomer(user.email ?? '', { supabase_user_id: user.id });
      customerId = customer.id;

      await supabase
        .from('subscriptions')
        .upsert({ user_id: user.id, stripe_customer_id: customerId, plan: 'free', status: 'active' })
        .eq('user_id', user.id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const session = await createCheckoutSession({
      customerId,
      priceId,
      successUrl: `${appUrl}/billing?session_id={CHECKOUT_SESSION_ID}&upgraded=true`,
      cancelUrl: `${appUrl}/billing?canceled=true`,
      metadata: { user_id: user.id, plan: plan ?? 'pro' },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[stripe/checkout]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
