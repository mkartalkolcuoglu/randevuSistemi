-- Add WhatsApp notification fields to customers and appointments
-- Run this in Neon SQL Editor

-- Add WhatsApp notification preference to customers
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS whatsapp_notifications BOOLEAN DEFAULT true;

-- Add WhatsApp tracking fields to appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN DEFAULT false;

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMP;

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_whatsapp_sent 
ON appointments(whatsapp_sent);

CREATE INDEX IF NOT EXISTS idx_appointments_reminder_sent 
ON appointments(reminder_sent);

CREATE INDEX IF NOT EXISTS idx_appointments_status_date 
ON appointments(status, date);

CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_notifications 
ON customers(whatsapp_notifications);

-- Update existing customers to have WhatsApp notifications enabled by default
UPDATE customers 
SET whatsapp_notifications = true 
WHERE whatsapp_notifications IS NULL;

-- Verify changes
SELECT 
  'customers' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN whatsapp_notifications = true THEN 1 END) as whatsapp_enabled
FROM customers

UNION ALL

SELECT 
  'appointments' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN whatsapp_sent = true THEN 1 END) as whatsapp_sent_count
FROM appointments;

