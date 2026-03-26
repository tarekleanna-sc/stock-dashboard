-- Migration: add_closed_positions
-- Tracks positions that have been sold (realized gain/loss)

CREATE TABLE IF NOT EXISTS closed_positions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id   UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  symbol       TEXT NOT NULL,
  shares       NUMERIC(18, 6) NOT NULL,
  avg_cost     NUMERIC(18, 4) NOT NULL,  -- cost basis per share
  sale_price   NUMERIC(18, 4) NOT NULL,  -- sale price per share
  closed_at    DATE NOT NULL DEFAULT CURRENT_DATE,
  notes        TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_closed_positions_user ON closed_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_closed_positions_user_year ON closed_positions(user_id, closed_at);

ALTER TABLE closed_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "closed_positions_own" ON closed_positions
  FOR ALL USING (auth.uid() = user_id);
