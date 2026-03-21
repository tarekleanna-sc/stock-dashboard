/**
 * Applies RLS policies to all Supabase tables.
 * Run once: node scripts/fix-rls.mjs
 *
 * Uses the Supabase REST API with service_role key to call
 * the pg_catalog.pg_policies view and execute DDL via exec_sql RPC.
 */

const SUPABASE_URL = 'https://iaqzfiwopygfgbnguucx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcXpmaXdvcHlnZmdibmd1dWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA1MTAzMCwiZXhwIjoyMDg5NjI3MDMwfQ.ejjB6qaeY69_4Me_Uh7yAHTvbarJGUJP9MYqBaiMNzs';

const SQL = `
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_accounts" ON accounts;
DROP POLICY IF EXISTS "users_insert_own_accounts" ON accounts;
DROP POLICY IF EXISTS "users_update_own_accounts" ON accounts;
DROP POLICY IF EXISTS "users_delete_own_accounts" ON accounts;
CREATE POLICY "users_select_own_accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_select_own_positions" ON positions;
DROP POLICY IF EXISTS "users_insert_own_positions" ON positions;
DROP POLICY IF EXISTS "users_update_own_positions" ON positions;
DROP POLICY IF EXISTS "users_delete_own_positions" ON positions;
CREATE POLICY "users_select_own_positions" ON positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_positions" ON positions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_positions" ON positions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_positions" ON positions FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_select_own_watchlist" ON watchlist_items;
DROP POLICY IF EXISTS "users_insert_own_watchlist" ON watchlist_items;
DROP POLICY IF EXISTS "users_delete_own_watchlist" ON watchlist_items;
CREATE POLICY "users_select_own_watchlist" ON watchlist_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_watchlist" ON watchlist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_watchlist" ON watchlist_items FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_select_own_allocations" ON target_allocations;
DROP POLICY IF EXISTS "users_insert_own_allocations" ON target_allocations;
DROP POLICY IF EXISTS "users_update_own_allocations" ON target_allocations;
DROP POLICY IF EXISTS "users_delete_own_allocations" ON target_allocations;
CREATE POLICY "users_select_own_allocations" ON target_allocations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_allocations" ON target_allocations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_allocations" ON target_allocations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_allocations" ON target_allocations FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_select_own_snapshots" ON snapshots;
DROP POLICY IF EXISTS "users_insert_own_snapshots" ON snapshots;
DROP POLICY IF EXISTS "users_delete_own_snapshots" ON snapshots;
CREATE POLICY "users_select_own_snapshots" ON snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_snapshots" ON snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_snapshots" ON snapshots FOR DELETE USING (auth.uid() = user_id);
`;

async function runSQL(sql) {
  // Supabase exposes a /rest/v1/rpc/exec_sql endpoint only if the function exists.
  // Instead we use the Management API REST endpoint for the project.
  const projectRef = 'iaqzfiwopygfgbnguucx';
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Management API uses a personal access token, not service role key.
      // Falling back to direct pg endpoint below.
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (res.ok) {
    const data = await res.json();
    console.log('✅ Success via Management API:', data);
    return true;
  }

  console.log('Management API returned:', res.status, await res.text());
  return false;
}

async function testRead() {
  // Quick test: can the service role key read accounts?
  const res = await fetch(`${SUPABASE_URL}/rest/v1/accounts?select=id,name&limit=5`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  const data = await res.json();
  console.log('\n📊 Accounts in DB (via service role):', data);
}

async function main() {
  console.log('🔧 Attempting to apply RLS policies...\n');

  await testRead();

  const ok = await runSQL(SQL);

  if (!ok) {
    console.log('\n⚠️  Automatic SQL execution requires a Supabase Personal Access Token.');
    console.log('   The Management API does not accept service_role keys.\n');
    console.log('👉 Please run the SQL manually:');
    console.log('   1. Go to https://supabase.com/dashboard/project/iaqzfiwopygfgbnguucx/sql/new');
    console.log('   2. Open supabase-rls-setup.sql from the project root');
    console.log('   3. Paste and click RUN\n');
    console.log('   This fixes the data persistence issue (accounts/positions vanishing on refresh).\n');
  }
}

main().catch(console.error);
