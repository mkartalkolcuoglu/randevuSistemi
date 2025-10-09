-- Fix customer email unique constraint to be per-tenant
-- Step 1: Drop the existing unique constraint on email
ALTER TABLE customers DROP CONSTRAINT IF EXISTS "customers_email_key";

-- Step 2: Add composite unique constraint on (tenantId, email)
ALTER TABLE customers ADD CONSTRAINT "customers_tenantId_email_key" UNIQUE ("tenantId", "email");

-- Verify the change
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint 
WHERE conrelid = 'customers'::regclass;

