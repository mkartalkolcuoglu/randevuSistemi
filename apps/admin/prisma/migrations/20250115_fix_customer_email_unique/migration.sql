-- Fix Customer email unique constraint
-- Allow same email across different tenants (e.g., same person at multiple salons)

-- Drop old global unique constraint on email
ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_email_key";

-- Add composite unique constraint (tenantId + email)
-- This ensures each tenant can have their own customer with the same email
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customers_tenantId_email_key' 
        AND conrelid = 'customers'::regclass
    ) THEN
        ALTER TABLE "customers" ADD CONSTRAINT "customers_tenantId_email_key" 
        UNIQUE ("tenantId", email);
    END IF;
END $$;

