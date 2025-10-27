-- Add appointment_time_interval column to settings table
-- This field controls the time slot intervals for appointment scheduling
-- Default: 30 minutes

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS appointment_time_interval INTEGER DEFAULT 30;

-- Add comment for documentation
COMMENT ON COLUMN settings.appointment_time_interval IS 'Appointment time slot interval in minutes (5, 10, 15, 20, 30, 45, 60). Default: 30';

-- Update existing records to have the default value
UPDATE settings 
SET appointment_time_interval = 30 
WHERE appointment_time_interval IS NULL;

