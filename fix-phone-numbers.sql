-- Telefon numaralarını standardize et
-- Format: 5xxxxxxxxx (10 haneli, başında 0 yok)

-- 1. Customers tablosu
UPDATE customers
SET phone = 
  CASE 
    -- Başında +90 varsa kaldır ve 0'ı kaldır
    WHEN phone LIKE '+90%' THEN SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 3, 10)
    -- Başında 0 varsa kaldır
    WHEN phone LIKE '0%' THEN SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 2, 10)
    -- Sadece rakamları al, ilk 10 hane
    ELSE SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 1, 10)
  END
WHERE phone IS NOT NULL 
  AND phone != ''
  AND (phone LIKE '0%' OR phone LIKE '+%' OR phone ~ '[^0-9]');

-- 2. Tenants tablosu
UPDATE tenants
SET phone = 
  CASE 
    WHEN phone LIKE '+90%' THEN SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 3, 10)
    WHEN phone LIKE '0%' THEN SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 2, 10)
    ELSE SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 1, 10)
  END
WHERE phone IS NOT NULL 
  AND phone != ''
  AND (phone LIKE '0%' OR phone LIKE '+%' OR phone ~ '[^0-9]');

-- 3. Staff tablosu
UPDATE staff
SET phone = 
  CASE 
    WHEN phone LIKE '+90%' THEN SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 3, 10)
    WHEN phone LIKE '0%' THEN SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 2, 10)
    ELSE SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 1, 10)
  END
WHERE phone IS NOT NULL 
  AND phone != ''
  AND (phone LIKE '0%' OR phone LIKE '+%' OR phone ~ '[^0-9]');

-- 4. Appointments tablosundaki customerPhone
UPDATE appointments
SET "customerPhone" = 
  CASE 
    WHEN "customerPhone" LIKE '+90%' THEN SUBSTRING(REGEXP_REPLACE("customerPhone", '[^0-9]', '', 'g'), 3, 10)
    WHEN "customerPhone" LIKE '0%' THEN SUBSTRING(REGEXP_REPLACE("customerPhone", '[^0-9]', '', 'g'), 2, 10)
    ELSE SUBSTRING(REGEXP_REPLACE("customerPhone", '[^0-9]', '', 'g'), 1, 10)
  END
WHERE "customerPhone" IS NOT NULL 
  AND "customerPhone" != ''
  AND ("customerPhone" LIKE '0%' OR "customerPhone" LIKE '+%' OR "customerPhone" ~ '[^0-9]');

-- Sonuçları kontrol et
SELECT 'Customers' as table_name, COUNT(*) as total, COUNT(DISTINCT phone) as unique_phones
FROM customers
WHERE phone IS NOT NULL
UNION ALL
SELECT 'Tenants', COUNT(*), COUNT(DISTINCT phone)
FROM tenants
WHERE phone IS NOT NULL
UNION ALL
SELECT 'Staff', COUNT(*), COUNT(DISTINCT phone)
FROM staff
WHERE phone IS NOT NULL
UNION ALL
SELECT 'Appointments', COUNT(*), COUNT(DISTINCT "customerPhone")
FROM appointments
WHERE "customerPhone" IS NOT NULL;

-- Örnek kayıtları göster
SELECT 'Sample Customer Phones' as info, phone 
FROM customers 
WHERE phone IS NOT NULL 
LIMIT 5;

