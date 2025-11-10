-- NEON SQL EDITOR'DA BU QUERY'LERİ ÇALIŞTIR
-- Basit, direkt kontrol

-- 1. Appointments tablosu var mı?
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'appointments'
) as table_exists;

-- 2. Kaç randevu var?
SELECT COUNT(*) as total FROM appointments;

-- 3. İlk 3 column name'i göster
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position
LIMIT 10;

-- 4. Örnek randevu (HERHANGİ BİR column name formatı ile)
SELECT * FROM appointments LIMIT 1;
