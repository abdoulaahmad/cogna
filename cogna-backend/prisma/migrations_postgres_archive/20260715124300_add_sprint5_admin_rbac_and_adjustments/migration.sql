-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'SUPPORT', 'FINANCE');

-- CreateEnum
CREATE TYPE "AdjustmentRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "admin_role" "AdminRole";

-- CreateTable
CREATE TABLE "wallet_adjustment_requests" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "maker_id" TEXT NOT NULL,
    "checker_id" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "direction" "WalletTransactionDirection" NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "AdjustmentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_adjustment_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "wallet_adjustment_requests" ADD CONSTRAINT "wallet_adjustment_requests_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_adjustment_requests" ADD CONSTRAINT "wallet_adjustment_requests_maker_id_fkey" FOREIGN KEY ("maker_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_adjustment_requests" ADD CONSTRAINT "wallet_adjustment_requests_checker_id_fkey" FOREIGN KEY ("checker_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
