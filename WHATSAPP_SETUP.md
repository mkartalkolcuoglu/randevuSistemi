# 📱 WhatsApp Entegrasyonu Kurulum Rehberi

## 🎯 Özellikler

✅ **Randevu Onay Mesajları** - Randevu confirmed olunca otomatik gönderilir
✅ **Hatırlatma Mesajları** - Randevudan 2 saat önce otomatik gönderilir  
✅ **Müşteri Tercihi** - Müşteriler WhatsApp bildirimi almayı seçebilir
✅ **Otomatik Cron Job** - Her 10 dakikada bir hatırlatma kontrolü

---

## 📋 Kurulum Adımları

### 1. Database Migration (Neon SQL Editor)

```sql
-- Neon SQL Editor'de çalıştır:
-- apps/admin/prisma/migrations/add_whatsapp_fields.sql dosyasındaki SQL'i kopyala ve çalıştır
```

### 2. Vercel Environment Variables

Vercel Dashboard → Project → Settings → Environment Variables:

```bash
WHAPI_API_TOKEN=your-whapi-token-here
WHAPI_PHONE_NUMBER=905365052512
CRON_SECRET=your-random-secret-key-here
```

**CRON_SECRET oluşturmak için:**
```bash
openssl rand -base64 32
```

### 3. Vercel Cron Job

`apps/admin/vercel.json` dosyası zaten hazır:
```json
{
  "crons": [
    {
      "path": "/api/whatsapp/check-reminders",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

Deploy sonrası Vercel Dashboard'da görünecek.

---

## 🔧 Nasıl Çalışır?

### Randevu Onay Mesajı

```
Randevu Oluşturuldu
       ↓
Durum "confirmed" oldu
       ↓
📱 WhatsApp mesajı gönderildi
       ↓
appointment.whatsappSent = true
```

**Mesaj İçeriği:**
```
Merhaba {Ad},

Randevunuz başarıyla oluşturuldu! 🎉

📅 Tarih: 15.11.2025
🕐 Saat: 14:00
👤 Personel: Ayşe Yılmaz
✂️ Hizmet: Saç Kesimi
💰 Ücret: 150 TL
📍 Adres: Merkez Mah. Atatürk Cad. No:45

Görüşmek üzere! 😊

{İşletme Adı}
📞 +90 536 505 25 12
```

### Hatırlatma Mesajı

```
Cron Job (Her 10 dakika)
       ↓
2 saat sonraki randevuları bul
       ↓
Müşteri WhatsApp tercihi var mı?
       ↓
📱 Hatırlatma mesajı gönder
       ↓
appointment.reminderSent = true
```

**Mesaj İçeriği:**
```
Merhaba {Ad},

⏰ Randevunuza 2 saat kaldı!

📅 Tarih: 15.11.2025
🕐 Saat: 14:00
👤 Personel: Ayşe Yılmaz
📍 Adres: Merkez Mah. Atatürk Cad. No:45

Sizi bekliyoruz! 😊

{İşletme Adı}
📞 +90 536 505 25 12
```

---

## 🧪 Test Etme

### 1. Manuel Onay Mesajı Gönderme

```bash
curl -X POST https://admin.netrandevu.com/api/whatsapp/send-confirmation \
  -H "Content-Type: application/json" \
  -d '{"appointmentId": "your-appointment-id"}'
```

### 2. Manuel Hatırlatma Gönderme

```bash
curl -X POST https://admin.netrandevu.com/api/whatsapp/send-reminder \
  -H "Content-Type: application/json" \
  -d '{"appointmentId": "your-appointment-id"}'
```

### 3. Cron Job Test

```bash
curl -X GET https://admin.netrandevu.com/api/whatsapp/check-reminders \
  -H "Authorization: Bearer your-cron-secret"
```

---

## 📊 Monitoring

### Vercel Logs

```bash
vercel logs --follow
```

### Database Kontrol

```sql
-- Kaç mesaj gönderildi?
SELECT 
  COUNT(*) as total_appointments,
  COUNT(CASE WHEN whatsapp_sent = true THEN 1 END) as confirmations_sent,
  COUNT(CASE WHEN reminder_sent = true THEN 1 END) as reminders_sent
FROM appointments
WHERE status = 'confirmed';

-- WhatsApp tercihi olan müşteriler
SELECT 
  COUNT(*) as total_customers,
  COUNT(CASE WHEN whatsapp_notifications = true THEN 1 END) as whatsapp_enabled
FROM customers;
```

---

## 🔐 Güvenlik

- ✅ Cron endpoint Bearer token ile korunuyor
- ✅ Müşteri tercihi kontrol ediliyor
- ✅ Telefon numarası formatı doğrulanıyor
- ✅ Rate limiting (mesajlar arası 1 saniye)

---

## 🐛 Troubleshooting

### Mesaj Gönderilmiyor

1. **Whapi Token Kontrol:**
   ```bash
   curl -H "Authorization: Bearer YOUR_WHAPI_TOKEN" \
        https://gate.whapi.cloud/health
   ```

2. **Telefon Formatı:**
   - ✅ Doğru: `905365052512`
   - ❌ Yanlış: `+90 536 505 25 12`
   - ❌ Yanlış: `0536 505 25 12`

3. **Müşteri Tercihi:**
   ```sql
   SELECT whatsapp_notifications FROM customers WHERE phone = '5365052512';
   ```

### Cron Çalışmıyor

1. Vercel Dashboard → Cron Jobs → Logs kontrol et
2. CRON_SECRET environment variable set edilmiş mi?
3. vercel.json dosyası commit edilmiş mi?

---

## 📞 Whapi.cloud Bilgileri

- **Dashboard:** https://whapi.cloud/dashboard
- **Docs:** https://whapi.cloud/tr/docs
- **API URL:** https://gate.whapi.cloud/
- **Phone:** +90 536 505 25 12
- **Free Trial:** 5 gün
- **Pricing:** https://whapi.cloud/pricing

**Not:** Token bilgisini Whapi.cloud Dashboard'dan alabilirsiniz.

---

## 🎉 Tamamlandı!

Artık randevu sisteminiz WhatsApp entegrasyonu ile çalışıyor! 🚀

