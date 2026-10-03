-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_active_position_idx" ON "products"("active", "position");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_user_id_created_at_idx" ON "payments"("user_id", "created_at" DESC);

-- DropIndex
DROP INDEX IF EXISTS "wallet_transactions_wallet_id_created_at_idx";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "wallet_transactions_wallet_id_created_at_idx" ON "wallet_transactions"("wallet_id", "created_at" DESC);

-- DropIndex
DROP INDEX IF EXISTS "wallet_fundings_user_id_created_at_idx";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "wallet_fundings_user_id_created_at_idx" ON "wallet_fundings"("user_id", "created_at" DESC);
