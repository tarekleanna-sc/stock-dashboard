/**
 * Stripe REST API client (no npm package — avoids security policy block).
 * All calls use the Stripe v1 REST API directly via fetch.
 */

const STRIPE_API = 'https://api.stripe.com/v1';

function auth() {
  return `Basic ${Buffer.from(`${process.env.STRIPE_SECRET_KEY ?? ''}:`).toString('base64')}`;
}

function toFormData(obj: Record<string, unknown>, prefix = ''): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    const fieldName = prefix ? `${prefix}[${key}]` : key;
    if (typeof value === 'object' && !Array.isArray(value)) {
      parts.push(toFormData(value as Record<string, unknown>, fieldName));
    } else if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        if (typeof item === 'object') {
          parts.push(toFormData(item as Record<string, unknown>, `${fieldName}[${idx}]`));
        } else {
          parts.push(`${encodeURIComponent(`${fieldName}[${idx}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else {
      parts.push(`${encodeURIComponent(fieldName)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.join('&');
}

async function stripePost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: auth(),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2025-01-27.acacia',
    },
    body: toFormData(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Stripe error: ${(err as { error?: { message?: string } }).error?.message ?? res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function createCustomer(email: string, metadata: Record<string, string>) {
  return stripePost<{ id: string }>('/customers', { email, metadata });
}

// ─── Checkout Sessions ───────────────────────────────────────────────────────

export async function createCheckoutSession(opts: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}) {
  return stripePost<{ url: string; id: string }>('/checkout/sessions', {
    customer: opts.customerId,
    mode: 'subscription',
    'line_items[0][price]': opts.priceId,
    'line_items[0][quantity]': 1,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    metadata: opts.metadata,
    'subscription_data[metadata][user_id]': opts.metadata.user_id,
    'subscription_data[metadata][plan]': opts.metadata.plan,
    allow_promotion_codes: true,
  });
}

// ─── Billing Portal ──────────────────────────────────────────────────────────

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  return stripePost<{ url: string }>('/billing_portal/sessions', {
    customer: customerId,
    return_url: returnUrl,
  });
}

// ─── Webhook signature verification ─────────────────────────────────────────

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';

export async function verifyWebhookSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  try {
    const sigParts = sigHeader.split(',');
    const tPart = sigParts.find((p) => p.startsWith('t='));
    const v1Part = sigParts.find((p) => p.startsWith('v1='));
    if (!tPart || !v1Part) return false;

    const timestamp = tPart.slice(2);
    const expectedSig = v1Part.slice(3);
    const signedPayload = `${timestamp}.${payload}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const computedSig = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison
    if (computedSig.length !== expectedSig.length) return false;
    let mismatch = 0;
    for (let i = 0; i < computedSig.length; i++) {
      mismatch |= computedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }

    // Also check timestamp is within 5 minutes
    const nowSec = Math.floor(Date.now() / 1000);
    const tolerance = 300;
    if (Math.abs(nowSec - parseInt(timestamp)) > tolerance) return false;

    return mismatch === 0;
  } catch {
    return false;
  }
}
