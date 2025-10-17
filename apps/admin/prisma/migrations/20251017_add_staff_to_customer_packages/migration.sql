-- Add staffId and staffName columns to customer_packages table
ALTER TABLE "customer_packages" ADD COLUMN IF NOT EXISTS "staffId" TEXT;
ALTER TABLE "customer_packages" ADD COLUMN IF NOT EXISTS "staffName" TEXT;

