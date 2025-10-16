-- Add packageInfo column to appointments table
-- This field stores JSON data about package usage when customer chooses to use their package for an appointment

ALTER TABLE "appointments" ADD COLUMN "packageInfo" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN "appointments"."packageInfo" IS 'JSON string containing package usage info: { customerPackageId, usageId, packageName, serviceId }';

