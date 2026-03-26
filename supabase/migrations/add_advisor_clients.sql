-- Migration: add_advisor_clients
-- Enables advisor mode: advisors can manage multiple clients' portfolios.
-- Each client has their own set of accounts and positions.

-- Client profiles managed by an advisor
CREATE TABLE IF NOT EXISTS clients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  email        TEXT,
  phone        TEXT,
  notes        TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_advisor ON clients(advisor_id);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_own" ON clients
  FOR ALL USING (auth.uid() = advisor_id);

-- Link accounts to a client (nullable = advisor's own account)
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_accounts_client ON accounts(client_id);

-- Allow advisors to see/manage accounts for their clients
-- (The existing RLS policy on accounts uses user_id = auth.uid(), which handles own accounts.
--  For advisor-managed client accounts, the advisor is the user_id, so no RLS change needed.)
