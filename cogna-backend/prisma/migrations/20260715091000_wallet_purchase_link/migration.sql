ALTER TABLE "wallet_transactions" ADD COLUMN "order_id" TEXT;
CREATE INDEX "wallet_transactions_order_id_idx" ON "wallet_transactions"("order_id");
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;