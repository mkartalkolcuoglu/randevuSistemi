-- Fix Customer email constraint to allow same email across different tenants
-- This allows the same person to book appointments at multiple salons

-- Step 1: Check existing constraints
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'customers'::regclass;

-- Step 2: Drop the old global email unique constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customers_email_key' 
        AND conrelid = 'customers'::regclass
    ) THEN
        ALTER TABLE customers DROP CONSTRAINT customers_email_key;
        RAISE NOTICE 'Dropped old email unique constraint';
    END IF;
END $$;

-- Step 3: Ensure the composite unique constraint exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customers_tenantId_email_key' 
        AND conrelid = 'customers'::regclass
    ) THEN
        ALTER TABLE customers ADD CONSTRAINT "customers_tenantId_email_key" 
        UNIQUE ("tenantId", email);
        RAISE NOTICE 'Created composite unique constraint';
    ELSE
        RAISE NOTICE 'Composite unique constraint already exists';
    END IF;
END $$;

-- Step 4: Verify the fix
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'customers'::regclass
AND contype = 'u';  -- u = unique constraint

