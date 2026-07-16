CREATE TABLE "payment_gateway_configurations" (
    "id" TEXT NOT NULL,
    "gateway" "PaymentGateway" NOT NULL,
    "public_key" TEXT,
    "secret_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_gateway_configurations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_gateway_configurations_gateway_key"
ON "payment_gateway_configurations"("gateway");