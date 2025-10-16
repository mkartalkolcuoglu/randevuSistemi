-- Add staffId and staffName columns to transactions table
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "staffId" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "staffName" TEXT;

