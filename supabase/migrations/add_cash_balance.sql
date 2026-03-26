-- Migration: Add cash_balance column to accounts table
-- Run this in your Supabase SQL editor (Dashboard > SQL Editor > New Query)

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS cash_balance numeric DEFAULT 0;

-- Optional: backfill any existing rows to 0
UPDATE accounts SET cash_balance = 0 WHERE cash_balance IS NULL;
