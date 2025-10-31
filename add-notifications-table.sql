-- Create notifications table for real-time notifications
-- Run this in Neon SQL Editor

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_read 
ON notifications("tenantId", read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications("createdAt" DESC);

-- Verify table creation
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

