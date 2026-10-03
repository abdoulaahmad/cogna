-- Migration: add_plisio_crypto_funding
-- Adds PLISIO to the PaymentGateway enum and adds crypto tracking columns to wallet_fundings.

-- Step 1: Add PLISIO to the PaymentGateway enum
-- PostgreSQL requires ALTER TYPE ... ADD VALUE (cannot be inside a transaction block)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'PLISIO'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentGateway')
  ) THEN
    ALTER TYPE "PaymentGateway" ADD VALUE 'PLISIO';
  END IF;
END $$;
