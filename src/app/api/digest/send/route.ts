import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * POST /api/digest/send
 * Sends a weekly portfolio summary email via Resend.
 * Body: {
 *   userId: string;
 *   toEmail: string;
 *   portfolioData: {
 *     totalValue: number;
 *     weekChange: number;
 *     weekChangePct: number;
 *     topGainers: { ticker: string; pct: number }[];
 *     topLosers: { ticker: string; pct: number }[];
 *     holdings: { ticker: string; marketValue: number; gainLossPct: number }[];
 *   }
 * }
 */

const RESEND_API = 'https://api.resend.com/emails';

function buildEmailHtml(data: {
  toEmail: string;
  totalValue: number;
  weekChange: number;
  weekChangePct: number;
  topGainers: { ticker: string; pct: number }[];
  topLosers: { ticker: string; pct: number }[];
  holdings: { ticker: string; marketValue: number; gainLossPct: number }[];
  date: string;
}): string {
  const fmt = (n: number) =>
    `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
  const glColor = (n: number) => (n >= 0 ? '#15803d' : '#dc2626');
  const weekUp = data.weekChange >= 0;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Weekly Portfolio Digest</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0d0d2b;padding:24px 28px;border-radius:12px 12px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:20px;font-weight:800;color:#22d3ee;">StockDash</span>
                    <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.4);">Weekly Portfolio Digest</p>
                  </td>
                  <td align="right" style="font-size:12px;color:rgba(255,255,255,0.4);">${data.date}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Total value card -->
          <tr>
            <td style="background:#fff;padding:28px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Total Portfolio Value</p>
              <p style="margin:0 0 8px;font-size:36px;font-weight:800;color:#0f172a;">${fmt(data.totalValue)}</p>
              <span style="display:inline-block;background:${weekUp ? '#dcfce7' : '#fee2e2'};color:${weekUp ? '#15803d' : '#dc2626'};padding:4px 12px;border-radius:100px;font-size:13px;font-weight:600;">
                ${weekUp ? '▲' : '▼'} ${pct(data.weekChangePct)} this week (${weekUp ? '+' : ''}${fmt(data.weekChange)})
              </span>
            </td>
          </tr>

          <!-- Top gainers + losers -->
          <tr>
            <td style="background:#fff;padding:0 28px 24px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Gainers -->
                  <td width="48%" style="vertical-align:top;padding-right:12px;">
                    <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.04em;">▲ Top Gainers</p>
                    ${data.topGainers.length === 0
                      ? '<p style="font-size:12px;color:#94a3b8;margin:0;">No gainers this week</p>'
                      : data.topGainers.map(g => `
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                          <tr>
                            <td style="font-size:13px;font-weight:700;color:#0f172a;">${g.ticker}</td>
                            <td align="right" style="font-size:13px;font-weight:600;color:#15803d;">${pct(g.pct)}</td>
                          </tr>
                        </table>
                      `).join('')
                    }
                  </td>
                  <td width="4%" style="background:#f1f5f9;width:1px;min-width:1px;" />
                  <!-- Losers -->
                  <td width="48%" style="vertical-align:top;padding-left:12px;">
                    <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.04em;">▼ Top Losers</p>
                    ${data.topLosers.length === 0
                      ? '<p style="font-size:12px;color:#94a3b8;margin:0;">No losers this week</p>'
                      : data.topLosers.map(l => `
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                          <tr>
                            <td style="font-size:13px;font-weight:700;color:#0f172a;">${l.ticker}</td>
                            <td align="right" style="font-size:13px;font-weight:600;color:#dc2626;">${pct(l.pct)}</td>
                          </tr>
                        </table>
                      `).join('')
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Holdings table -->
          ${data.holdings.length > 0 ? `
          <tr>
            <td style="background:#fff;padding:0 28px 24px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.04em;border-top:1px solid #f1f5f9;padding-top:20px;">Portfolio Holdings</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="font-size:10px;font-weight:600;color:#94a3b8;padding:4px 0;text-transform:uppercase;">Symbol</td>
                  <td align="right" style="font-size:10px;font-weight:600;color:#94a3b8;padding:4px 0;text-transform:uppercase;">Value</td>
                  <td align="right" style="font-size:10px;font-weight:600;color:#94a3b8;padding:4px 0;text-transform:uppercase;">Total G/L</td>
                </tr>
                ${data.holdings.map((h, i) => `
                  <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'};">
                    <td style="font-size:12px;font-weight:700;color:#0f172a;padding:6px 0;">${h.ticker}</td>
                    <td align="right" style="font-size:12px;color:#374151;padding:6px 0;">${fmt(h.marketValue)}</td>
                    <td align="right" style="font-size:12px;font-weight:600;color:${glColor(h.gainLossPct)};padding:6px 0;">${pct(h.gainLossPct)}</td>
                  </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- CTA -->
          <tr>
            <td style="background:#fff;padding:20px 28px 28px;text-align:center;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://stock-dashboard-delta-seven.vercel.app'}/dashboard"
                style="display:inline-block;background:#0d0d2b;color:#22d3ee;padding:12px 28px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;border:1px solid rgba(34,211,238,0.3);">
                Open Dashboard →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 0;text-align:center;">
              <p style="margin:0;font-size:10px;color:#94a3b8;">
                You're receiving this because you enabled weekly digests in StockDash.<br/>
                This is for informational purposes only and does not constitute investment advice.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

export async function POST(req: NextRequest) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 });
  }

  let body: {
    userId: string;
    toEmail: string;
    totalValue: number;
    weekChange: number;
    weekChangePct: number;
    topGainers: { ticker: string; pct: number }[];
    topLosers: { ticker: string; pct: number }[];
    holdings: { ticker: string; marketValue: number; gainLossPct: number }[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.toEmail || !body.userId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify user owns this userId using service client
  const supabase = createServiceClient();
  const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(body.userId);
  if (authError || !user || user.email !== body.toEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const html = buildEmailHtml({ ...body, date });

  const weekUp = body.weekChange >= 0;
  const subject = `Weekly Digest: Portfolio ${weekUp ? '▲' : '▼'} ${body.weekChangePct >= 0 ? '+' : ''}${body.weekChangePct.toFixed(2)}% · $${body.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  const resendRes = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'StockDash <digest@stockdash.app>',
      to: [body.toEmail],
      subject,
      html,
    }),
  });

  if (!resendRes.ok) {
    const err = await resendRes.text();
    return NextResponse.json({ error: `Resend error: ${err}` }, { status: 500 });
  }

  const result = await resendRes.json();
  return NextResponse.json({ ok: true, id: result.id });
}
