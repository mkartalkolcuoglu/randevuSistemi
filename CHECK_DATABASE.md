# Database Kontrol - Randevular Neden Gözükmüyor?

## 🔍 Sorunu Tespit Etmek İçin

Neon SQL Editor'da şu query'leri çalıştır:

### 1. Randevu var mı?
```sql
SELECT COUNT(*) as total FROM appointments;
```

**Beklenen:** Eğer 0 ise hiç randevu yok demektir.

---

### 2. Randevu varsa, column name'leri doğru mu?
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;
```

**Beklenen column name'ler (snake_case):**
- id
- tenant_id
- customer_id
- customer_name
- customer_phone
- customer_email
- service_id
- service_name
- staff_id
- staff_name
- date
- time
- status
- notes
- price
- duration
- payment_type
- package_info
- payment_status
- payment_id
- whatsapp_sent
- whatsapp_sent_at
- reminder_sent
- reminder_sent_at
- created_at
- updated_at

**Eğer camelCase ise (tenantId, customerId, etc.):**
- Prisma schema'daki @map directive'lerini KALDIR
- Sadece camelCase field name'leri kullan

---

### 3. Örnek randevu göster
```sql
SELECT
  id,
  tenant_id,
  customer_name,
  service_name,
  staff_name,
  date,
  time,
  status,
  created_at
FROM appointments
ORDER BY created_at DESC
LIMIT 5;
```

**Bu query hata verirse:**
- Column name'ler camelCase'dir (tenantId)
- Prisma schema'dan @map'leri kaldır

**Bu query çalışırsa ama 0 row dönerse:**
- Database'de hiç randevu yok
- Web'den yeni randevu oluştur

---

### 4. Tenant ID kontrolü
```sql
SELECT DISTINCT tenant_id FROM appointments;
```

Bu, hangi tenant'lara randevu olduğunu gösterir.

Admin panelinde giriş yaptığın tenant ID ile eşleşiyor mu kontrol et.

---

## 🔧 Olası Senaryolar

### Senaryo 1: Column name'ler camelCase
**Çözüm:** Prisma schema'dan TÜM @map directive'lerini kaldır.

```bash
cd /Users/kartal.kolcuoglu/Desktop/randevu/apps/admin
# Schema'yı düzenle - @map'leri kaldır
npx prisma generate
git add -A
git commit -m "fix: remove @map directives (database uses camelCase)"
git push
```

---

### Senaryo 2: Column name'ler snake_case (doğru)
**Mevcut durum zaten doğru, başka sorun var.**

Web app schema'yı kontrol et:
```bash
cat apps/web/prisma/schema.prisma | grep -A 30 "model Appointment"
```

Eğer web app schema'sında @map YOKSA:
- Web app'e de @map ekle
- VEYA web app Prisma'yı admin'deki gibi yap

---

### Senaryo 3: Hiç randevu yok
Web'den test randevusu oluştur:
1. https://netrandevu.com/[tenant-slug]/randevu
2. Randevu oluştur
3. Admin panelde kontrol et

---

### Senaryo 4: Tenant ID eşleşmiyor
Admin panelde giriş yaptığın tenant ID:
```sql
-- Senin tenant'ını bul
SELECT id, slug, name FROM tenants;
```

Randevulardaki tenant ID'ler:
```sql
SELECT DISTINCT tenant_id FROM appointments;
```

Eşleşmiyorsa:
- Yanlış tenant'a giriş yapmışsın
- Veya randevular başka tenant'a ait

---

## 📊 Hızlı Test

Tek query ile herşeyi kontrol et:

```sql
-- Bu query çalışıyorsa: snake_case doğru
SELECT
  COUNT(*) as total_appointments,
  COUNT(DISTINCT tenant_id) as total_tenants,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM appointments;

-- Bu query HATA veriyorsa: camelCase kullanılıyor
-- Prisma schema'dan @map'leri KALDIR!
```

---

## 🎯 Sonuç

Bu query'leri çalıştırınca sonucu buraya yaz, ben sorunu tam olarak tespit edeyim.

**Örnekler:**
- "Query 1: 15 randevu var"
- "Query 2: Column name'ler camelCase (tenantId, customerId)"
- "Query 3: ERROR: column tenant_id does not exist"
