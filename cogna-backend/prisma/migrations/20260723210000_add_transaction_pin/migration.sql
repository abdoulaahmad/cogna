-- Add transaction PIN fields to users table
-- Migration: 20260723210000_add_transaction_pin

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "transaction_pin_hash"    TEXT,
  ADD COLUMN IF NOT EXISTS "transaction_pin_enabled" BOOLEAN NOT NULL DEFAULT TRUE;
