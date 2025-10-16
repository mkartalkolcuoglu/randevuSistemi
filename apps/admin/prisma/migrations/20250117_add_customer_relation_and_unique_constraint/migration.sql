-- Add unique constraint to prevent duplicate package assignments
-- This ensures one customer can only have one active assignment per package
CREATE UNIQUE INDEX IF NOT EXISTS "customer_packages_customerId_packageId_key" 
ON "customer_packages"("customerId", "packageId");

