// Supabase Edge Function: daily-snapshot
// Runs on a schedule (via pg_cron or Supabase dashboard cron trigger).
// For each active user, fetches their current portfolio value and saves a snapshot.
//
// To deploy:  supabase functions deploy daily-snapshot
// To schedule (in Supabase dashboard SQL editor):
//   SELECT cron.schedule('daily-snapshot', '0 18 * * 1-5', $$
//     SELECT net.http_post(
//       url := 'https://<project-ref>.supabase.co/functions/v1/daily-snapshot',
//       headers := '{"Authorization": "Bearer <service-role-key>", "Content-Type": "application/json"}'::jsonb,
//       body := '{}'::jsonb
//     );
//   $$);

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FMP_API_KEY = Deno.env.get('FMP_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

interface PositionRow {
  user_id: string;
  symbol: string;
  shares: number;
  avg_cost: number;
}

interface AccountRow {
  user_id: string;
  cash_balance: number;
}

async function fetchPrice(symbol: string): Promise<number> {
  const url = `https://financialmodelingprep.com/stable/quote?symbol=${symbol}&apikey=${FMP_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return 0;
  const data = await res.json();
  return data?.[0]?.price ?? 0;
}

serve(async (_req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const today = new Date().toISOString().split('T')[0];

    // Get all users who have positions
    const { data: positions } = await supabase
      .from('positions')
      .select('user_id, symbol, shares, avg_cost');

    if (!positions || positions.length === 0) {
      return new Response(JSON.stringify({ message: 'No positions found' }), { status: 200 });
    }

    // Group by user
    const byUser = new Map<string, PositionRow[]>();
    for (const pos of positions as PositionRow[]) {
      const existing = byUser.get(pos.user_id) ?? [];
      existing.push(pos);
      byUser.set(pos.user_id, existing);
    }

    // Get cash balances
    const { data: accounts } = await supabase
      .from('accounts')
      .select('user_id, cash_balance');

    const cashByUser = new Map<string, number>();
    for (const acct of (accounts ?? []) as AccountRow[]) {
      cashByUser.set(acct.user_id, (cashByUser.get(acct.user_id) ?? 0) + (acct.cash_balance ?? 0));
    }

    // Collect all unique symbols
    const allSymbols = [...new Set(positions.map((p: PositionRow) => p.symbol))];

    // Fetch all prices in parallel (batched to avoid rate limit)
    const priceMap = new Map<string, number>();
    const batchSize = 10;
    for (let i = 0; i < allSymbols.length; i += batchSize) {
      const batch = allSymbols.slice(i, i + batchSize);
      const prices = await Promise.all(batch.map((s) => fetchPrice(s)));
      batch.forEach((s, idx) => priceMap.set(s, prices[idx]));
    }

    // Calculate portfolio value per user and upsert snapshot
    const snapshots = [];
    for (const [userId, userPositions] of byUser) {
      const marketValue = userPositions.reduce((sum, pos) => {
        const price = priceMap.get(pos.symbol) ?? 0;
        return sum + price * pos.shares;
      }, 0);
      const cash = cashByUser.get(userId) ?? 0;
      const totalValue = marketValue + cash;

      snapshots.push({ user_id: userId, date: today, total_value: totalValue });
    }

    const { error } = await supabase
      .from('snapshots')
      .upsert(snapshots, { onConflict: 'user_id,date' });

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: `Snapshots saved for ${snapshots.length} users`, date: today }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
