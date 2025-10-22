-- Add authentication fields to staff table
-- Run this SQL in your production database

-- Add new columns
ALTER TABLE staff ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'staff';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS permissions TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS can_login BOOLEAN DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Add unique constraint on username (only if column exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'staff_username_unique'
    ) THEN
        ALTER TABLE staff ADD CONSTRAINT staff_username_unique UNIQUE (username);
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_username ON staff(username);
CREATE INDEX IF NOT EXISTS idx_staff_tenant_canlogin ON staff("tenantId", can_login);

-- Display success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Staff authentication fields added successfully!';
END $$;

