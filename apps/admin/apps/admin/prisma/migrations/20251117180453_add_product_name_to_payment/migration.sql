-- AlterTable
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "product_name" VARCHAR(255);
