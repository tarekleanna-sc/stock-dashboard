-- ─── Referral System ─────────────────────────────────────────────────────────
-- Run after: add_subscriptions.sql

-- Table: referral_codes — one code per user
CREATE TABLE IF NOT EXISTS referral_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code         text NOT NULL UNIQUE,
  used_count   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own code
CREATE POLICY "Users can read own referral code" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

-- Table: referrals — one row per referred signup
CREATE TABLE IF NOT EXISTS referrals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- referrer
  code              text NOT NULL,
  referred_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- new user
  status            text NOT NULL DEFAULT 'pending',  -- 'pending' | 'rewarded' | 'ineligible'
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referred_user_id)  -- each user can only be referred once
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Referrers can see their own referral list
CREATE POLICY "Users can read own referrals" ON referrals
  FOR SELECT USING (auth.uid() = user_id);

-- Helper function to increment used_count atomically
CREATE OR REPLACE FUNCTION increment_referral_count(referral_code text)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE referral_codes SET used_count = used_count + 1 WHERE code = referral_code;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_user_id ON referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
