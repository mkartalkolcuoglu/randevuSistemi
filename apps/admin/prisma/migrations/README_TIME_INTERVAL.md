# Appointment Time Interval Migration

## Migration: 20241027_add_appointment_time_interval.sql

Bu migration, Settings tablosuna `appointment_time_interval` field'ini ekler.

### Ne Değişti?

1. **Settings Tablosu:**
   - Yeni field: `appointment_time_interval` (INTEGER, default: 30)
   - Bu field randevu sayfalarında gösterilecek saat aralıklarını belirler (5, 10, 15, 20, 30, 45, 60 dakika)

### Manual Deployment (Neon/Vercel)

1. Neon dashboard'una git
2. SQL Editor'ü aç
3. `20241027_add_appointment_time_interval.sql` dosyasının içeriğini çalıştır:

```sql
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS appointment_time_interval INTEGER DEFAULT 30;

COMMENT ON COLUMN settings.appointment_time_interval IS 'Appointment time slot interval in minutes (5, 10, 15, 20, 30, 45, 60). Default: 30';

UPDATE settings 
SET appointment_time_interval = 30 
WHERE appointment_time_interval IS NULL;
```

### Kullanım

Kullanıcılar Admin Panel > Ayarlar > Randevu Ayarları bölümünden zaman aralığını değiştirebilir.

Bu ayar şu sayfalarda kullanılır:
- Admin Panel - Yeni Randevu
- Admin Panel - Randevu Düzenle
- Web App - Müşteri Randevu Sayfası

### Varsayılan Değer

30 dakika (kullanıcı tarafından değiştirilebilir)

