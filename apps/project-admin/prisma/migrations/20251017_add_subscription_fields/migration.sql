-- Add subscription fields to tenants table
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscriptionStart" TIMESTAMP(3);
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscriptionEnd" TIMESTAMP(3);

