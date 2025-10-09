-- DropIndex
DROP INDEX IF EXISTS "customers_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenantId_email_key" ON "customers"("tenantId", "email");

