-- Migration: add_price_alerts
-- User-defined price alerts per ticker

CREATE TABLE IF NOT EXISTS price_alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol       TEXT NOT NULL,
  target_price NUMERIC(18, 4) NOT NULL,
  direction    TEXT NOT NULL CHECK (direction IN ('above', 'below')),
  triggered    BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMP WITH TIME ZONE,
  notes        TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(user_id, triggered) WHERE triggered = FALSE;

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_alerts_own" ON price_alerts
  FOR ALL USING (auth.uid() = user_id);
