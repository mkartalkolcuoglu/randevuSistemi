-- Create transactions table for cash register management
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "paymentType" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "productId" TEXT,
    "productName" TEXT,
    "quantity" INTEGER,
    "cost" DOUBLE PRECISION,
    "profit" DOUBLE PRECISION,
    "appointmentId" TEXT,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

