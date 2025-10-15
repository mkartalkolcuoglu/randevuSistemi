-- Add packageId to transactions table
ALTER TABLE "transactions" ADD COLUMN "packageId" TEXT;

-- Create packages table
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- Create package_items table
CREATE TABLE "package_items" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_items_pkey" PRIMARY KEY ("id")
);

-- Create customer_packages table
CREATE TABLE "customer_packages" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "customer_packages_pkey" PRIMARY KEY ("id")
);

-- Create customer_package_usage table
CREATE TABLE "customer_package_usage" (
    "id" TEXT NOT NULL,
    "customerPackageId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "usedQuantity" INTEGER NOT NULL DEFAULT 0,
    "remainingQuantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_package_usage_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_packages" ADD CONSTRAINT "customer_packages_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "customer_package_usage" ADD CONSTRAINT "customer_package_usage_customerPackageId_fkey" FOREIGN KEY ("customerPackageId") REFERENCES "customer_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX "package_items_packageId_idx" ON "package_items"("packageId");
CREATE INDEX "customer_packages_customerId_idx" ON "customer_packages"("customerId");
CREATE INDEX "customer_packages_packageId_idx" ON "customer_packages"("packageId");
CREATE INDEX "customer_packages_tenantId_idx" ON "customer_packages"("tenantId");
CREATE INDEX "customer_package_usage_customerPackageId_idx" ON "customer_package_usage"("customerPackageId");

