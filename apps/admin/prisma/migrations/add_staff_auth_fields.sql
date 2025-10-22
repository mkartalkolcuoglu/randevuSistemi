-- Add authentication fields to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'staff';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS permissions TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS can_login BOOLEAN DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_staff_username ON staff(username);
CREATE INDEX IF NOT EXISTS idx_staff_tenant_canlogin ON staff(tenant_id, can_login);

