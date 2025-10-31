-- Create transactions for existing completed/confirmed appointments
-- that don't have a transaction yet

INSERT INTO transactions (
  id,
  "tenantId",
  type,
  amount,
  description,
  "paymentType",
  "customerId",
  "customerName",
  "appointmentId",
  date,
  profit,
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid(),
  a."tenantId",
  'appointment',
  a.price,
  CONCAT('Randevu: ', a."serviceName", ' - ', a."customerName"),
  COALESCE(a."paymentType", 'cash'),
  a."customerId",
  a."customerName",
  a.id,
  a.date,
  0,
  NOW(),
  NOW()
FROM appointments a
WHERE 
  -- Only completed or confirmed appointments
  (a.status = 'completed' OR a.status = 'confirmed')
  -- Only appointments with a price
  AND a.price IS NOT NULL 
  AND a.price > 0
  -- Only appointments that don't have a transaction yet
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t."appointmentId" = a.id 
    AND t.type = 'appointment'
  );

-- Verify the created transactions
SELECT 
  COUNT(*) as total_transactions_created,
  SUM(amount) as total_amount
FROM transactions
WHERE type = 'appointment'
AND "createdAt" >= NOW() - INTERVAL '1 minute';

-- Show recent appointment transactions
SELECT 
  t.id,
  t."tenantId",
  t.amount,
  t.description,
  t.date,
  t."createdAt"
FROM transactions t
WHERE t.type = 'appointment'
ORDER BY t."createdAt" DESC
LIMIT 10;

