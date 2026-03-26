import { NextRequest, NextResponse } from 'next/server';
import { STRIPE_WEBHOOK_SECRET, verifyWebhookSignature } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// Stripe subscription shape (subset of what we need)
interface StripeSubscription {
  id: string;
  customer: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  current_period_end: number;
  cancel_at_period_end: boolean;
  metadata: { user_id?: string; plan?: string };
}

interface StripeCheckoutSession {
  customer: string;
  metadata: { user_id?: string };
}

interface StripeEvent {
  type: string;
  data: { object: unknown };
}

async function upsertSubscription(
  supabase: ReturnType<typeof createServiceClient>,
  sub: StripeSubscription
) {
  const userId = sub.metadata?.user_id;
  if (!userId) return;

  const plan = (sub.metadata?.plan ?? 'free') as 'free' | 'pro' | 'advisor';
  const status = sub.status;
  const currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();

  await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: sub.customer,
      stripe_subscription_id: sub.id,
      plan,
      status,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: sub.cancel_at_period_end,
    },
    { onConflict: 'user_id' }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  const isValid = await verifyWebhookSignature(body, sig, STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    console.error('[stripe/webhook] invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(body) as StripeEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await upsertSubscription(supabase, event.data.object as StripeSubscription);
        break;

      case 'customer.subscription.deleted': {
        const sub = event.data.object as StripeSubscription;
        const userId = sub.metadata?.user_id;
        if (userId) {
          await supabase
            .from('subscriptions')
            .update({ plan: 'free', status: 'canceled', stripe_subscription_id: null })
            .eq('user_id', userId);
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as StripeCheckoutSession;
        const userId = session.metadata?.user_id;
        const customerId = session.customer;
        if (userId && customerId) {
          await supabase
            .from('subscriptions')
            .update({ stripe_customer_id: customerId })
            .eq('user_id', userId);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('[stripe/webhook] handler error:', err);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
