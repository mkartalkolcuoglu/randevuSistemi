-- Neon'da bu query'yi çalıştır
-- Column name'ler camelCase mi snake_case mi?

SELECT column_name
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position
LIMIT 15;

-- Beklenen sonuç:
-- camelCase: id, tenantId, customerId, customerName, serviceId...
-- VEYA
-- snake_case: id, tenant_id, customer_id, customer_name, service_id...
