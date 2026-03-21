-- ============================================================
-- Supabase RLS Setup — Portfolio Dashboard
-- Run this ONCE in your Supabase project:
--   Supabase Dashboard → SQL Editor → paste this → Run
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;

-- ── accounts ────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_select_own_accounts" ON accounts;
DROP POLICY IF EXISTS "users_insert_own_accounts" ON accounts;
DROP POLICY IF EXISTS "users_update_own_accounts" ON accounts;
DROP POLICY IF EXISTS "users_delete_own_accounts" ON accounts;

CREATE POLICY "users_select_own_accounts" ON accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_accounts" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_accounts" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_accounts" ON accounts
  FOR DELETE USING (auth.uid() = user_id);

-- ── positions ───────────────────────────────────────────────
DROP POLICY IF EXISTS "users_select_own_positions" ON positions;
DROP POLICY IF EXISTS "users_insert_own_positions" ON positions;
DROP POLICY IF EXISTS "users_update_own_positions" ON positions;
DROP POLICY IF EXISTS "users_delete_own_positions" ON positions;

CREATE POLICY "users_select_own_positions" ON positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_positions" ON positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_positions" ON positions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_positions" ON positions
  FOR DELETE USING (auth.uid() = user_id);

-- ── watchlist_items ─────────────────────────────────────────
DROP POLICY IF EXISTS "users_select_own_watchlist" ON watchlist_items;
DROP POLICY IF EXISTS "users_insert_own_watchlist" ON watchlist_items;
DROP POLICY IF EXISTS "users_delete_own_watchlist" ON watchlist_items;

CREATE POLICY "users_select_own_watchlist" ON watchlist_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_watchlist" ON watchlist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_watchlist" ON watchlist_items
  FOR DELETE USING (auth.uid() = user_id);

-- ── target_allocations ──────────────────────────────────────
DROP POLICY IF EXISTS "users_select_own_allocations" ON target_allocations;
DROP POLICY IF EXISTS "users_insert_own_allocations" ON target_allocations;
DROP POLICY IF EXISTS "users_update_own_allocations" ON target_allocations;
DROP POLICY IF EXISTS "users_delete_own_allocations" ON target_allocations;

CREATE POLICY "users_select_own_allocations" ON target_allocations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_allocations" ON target_allocations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_allocations" ON target_allocations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_allocations" ON target_allocations
  FOR DELETE USING (auth.uid() = user_id);

-- ── snapshots ───────────────────────────────────────────────
DROP POLICY IF EXISTS "users_select_own_snapshots" ON snapshots;
DROP POLICY IF EXISTS "users_insert_own_snapshots" ON snapshots;
DROP POLICY IF EXISTS "users_delete_own_snapshots" ON snapshots;

CREATE POLICY "users_select_own_snapshots" ON snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_snapshots" ON snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_snapshots" ON snapshots
  FOR DELETE USING (auth.uid() = user_id);
