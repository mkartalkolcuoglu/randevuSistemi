-- Neon'da çalıştır:

-- 1. Hangi tenant'lara randevu var?
SELECT tenantId, COUNT(*) as count
FROM appointments
GROUP BY tenantId
ORDER BY count DESC;

-- 2. Admin'de kullandığın tenant ID'yi kontrol et
-- Sen hangi tenant ID ile giriş yaptın?
-- Admin console'da görünen: cmgtljuhy0000jp04w9vtngz2

-- 3. O tenant'a ait randevular var mı?
SELECT COUNT(*) as count
FROM appointments
WHERE tenantId = 'cmgtljuhy0000jp04w9vtngz2';

-- 4. Örnek randevu göster
SELECT id, tenantId, customerName, serviceName, date, time
FROM appointments
WHERE tenantId = 'cmgtljuhy0000jp04w9vtngz2'
LIMIT 5;
