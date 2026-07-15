CREATE TYPE "ApiKeyEnvironment" AS ENUM ('TEST', 'LIVE');
CREATE TYPE "UserCapabilityType" AS ENUM ('DEVELOPER');

CREATE TABLE "user_capabilities" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" "UserCapabilityType" NOT NULL,
  "enabled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_capabilities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_capabilities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "user_capabilities_user_id_type_key" ON "user_capabilities"("user_id", "type");
ALTER TABLE "api_keys" ADD COLUMN "environment" "ApiKeyEnvironment" NOT NULL DEFAULT 'TEST', ADD COLUMN "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], ADD COLUMN "expires_at" TIMESTAMP(3);