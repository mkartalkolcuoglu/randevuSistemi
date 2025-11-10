-- Check appointments table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- Also check if there are any appointments
SELECT COUNT(*) as total_appointments FROM appointments;

-- Check a sample appointment (if any exist)
SELECT * FROM appointments LIMIT 1;
