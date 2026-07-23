-- Add crypto tracking columns to wallet_fundings
ALTER TABLE "wallet_fundings"
  ADD COLUMN IF NOT EXISTS "crypto_amount_usdt" DECIMAL(18, 8),
  ADD COLUMN IF NOT EXISTS "ngn_rate_locked" DECIMAL(14, 2);
