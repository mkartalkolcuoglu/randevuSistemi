-- Sync existing Tenant data to Settings table for WhatsApp integration
-- This will update all Settings records with phone/address from Tenant table

-- Update existing Settings records
UPDATE settings s
SET 
  "businessPhone" = t.phone,
  "businessAddress" = t.address,
  "businessEmail" = t."ownerEmail"
FROM tenants t
WHERE s."tenantId" = t.id;

-- Insert Settings for tenants that don't have a Settings record yet
INSERT INTO settings (
  id,
  "tenantId",
  "businessName",
  "businessPhone",
  "businessAddress",
  "businessEmail",
  appointment_time_interval,
  blacklist_threshold,
  "updatedAt"
)
SELECT 
  gen_random_uuid(),
  t.id,
  t."businessName",
  t.phone,
  t.address,
  t."ownerEmail",
  30, -- default appointment interval
  3,  -- default blacklist threshold
  NOW()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM settings s WHERE s."tenantId" = t.id
);

-- Verify the sync
SELECT 
  t."businessName" as business,
  t.phone as tenant_phone,
  t.address as tenant_address,
  s."businessPhone" as settings_phone,
  s."businessAddress" as settings_address
FROM tenants t
LEFT JOIN settings s ON s."tenantId" = t.id
ORDER BY t."businessName";

