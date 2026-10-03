CREATE TYPE "WalletTransactionType" AS ENUM ('FUNDING', 'PURCHASE', 'REFUND', 'ADJUSTMENT', 'REVERSAL');
CREATE TYPE "WalletTransactionDirection" AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE "WalletFundingStatus" AS ENUM ('INITIALIZED', 'PENDING', 'COMPLETED', 'FAILED', 'REVERSED');

CREATE TABLE "wallets" (
  "id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "currency" TEXT NOT NULL DEFAULT 'NGN',
  "available_balance" DECIMAL(14,2) NOT NULL DEFAULT 0, "pending_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "lifetime_funded" DECIMAL(14,2) NOT NULL DEFAULT 0, "lifetime_spent" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 0, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "wallets_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "wallet_transactions" (
  "id" TEXT NOT NULL, "wallet_id" TEXT NOT NULL, "type" "WalletTransactionType" NOT NULL,
  "direction" "WalletTransactionDirection" NOT NULL, "amount" DECIMAL(14,2) NOT NULL, "currency" TEXT NOT NULL DEFAULT 'NGN',
  "balance_before" DECIMAL(14,2) NOT NULL, "balance_after" DECIMAL(14,2) NOT NULL, "reference" TEXT NOT NULL,
  "idempotency_key" TEXT NOT NULL, "external_reference" TEXT, "source" TEXT NOT NULL, "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "wallet_transactions_reference_key" ON "wallet_transactions"("reference");
CREATE UNIQUE INDEX "wallet_transactions_idempotency_key_key" ON "wallet_transactions"("idempotency_key");
CREATE UNIQUE INDEX "wallet_transactions_external_reference_key" ON "wallet_transactions"("external_reference");
CREATE INDEX "wallet_transactions_wallet_id_created_at_idx" ON "wallet_transactions"("wallet_id", "created_at");
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "wallet_fundings" (
  "id" TEXT NOT NULL, "wallet_id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "wallet_transaction_id" TEXT,
  "gateway" "PaymentGateway" NOT NULL, "reference" TEXT NOT NULL, "gateway_reference" TEXT, "authorization_url" TEXT, "idempotency_key" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL, "currency" TEXT NOT NULL DEFAULT 'NGN', "status" "WalletFundingStatus" NOT NULL DEFAULT 'INITIALIZED',
  "metadata" JSONB, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "wallet_fundings_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "wallet_fundings_wallet_transaction_id_key" ON "wallet_fundings"("wallet_transaction_id");
CREATE UNIQUE INDEX "wallet_fundings_reference_key" ON "wallet_fundings"("reference");
CREATE UNIQUE INDEX "wallet_fundings_gateway_reference_key" ON "wallet_fundings"("gateway_reference");
CREATE UNIQUE INDEX "wallet_fundings_idempotency_key_key" ON "wallet_fundings"("idempotency_key");
ALTER TABLE "wallet_fundings" ADD CONSTRAINT "wallet_fundings_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallet_fundings" ADD CONSTRAINT "wallet_fundings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallet_fundings" ADD CONSTRAINT "wallet_fundings_wallet_transaction_id_fkey" FOREIGN KEY ("wallet_transaction_id") REFERENCES "wallet_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "payment_events" (
  "id" TEXT NOT NULL, "gateway" "PaymentGateway" NOT NULL, "event_id" TEXT NOT NULL, "reference" TEXT,
  "payload_hash" TEXT NOT NULL, "event_type" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'RECEIVED', "payload" JSONB,
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "processed_at" TIMESTAMP(3), CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "payment_events_gateway_event_id_key" ON "payment_events"("gateway", "event_id");
CREATE UNIQUE INDEX "payment_events_gateway_payload_hash_key" ON "payment_events"("gateway", "payload_hash");
CREATE INDEX "payment_events_reference_idx" ON "payment_events"("reference");