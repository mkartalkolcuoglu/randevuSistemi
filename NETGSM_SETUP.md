# 📱 NetGSM SMS & OTP Entegrasyonu Kurulum Rehberi

## 🎯 Özellikler

✅ **SMS OTP Doğrulama** - Randevu sorgulama için SMS ile kod doğrulama
✅ **Güvenli Erişim** - 6 haneli kod, 120 saniye geçerlilik, 3 deneme hakkı
✅ **Rate Limiting** - 1 dakikada 1 SMS gönderimi
✅ **Otomatik Temizlik** - Expired OTP'ler günlük cron job ile temizlenir
✅ **Multi-Purpose** - Randevu sorgulama, yeni abonelik, şifre sıfırlama vb.

---

## 📋 Kurulum Adımları

### 1. NetGSM API Hesabı Oluşturma

**Adım 1:** https://www.netgsm.com.tr adresine gidin ve giriş yapın

**Adım 2:** Webportal → **Abonelik İşlemleri** → **Alt Kullanıcı Hesapları**

**Adım 3:** Yeni alt kullanıcı oluşturun:
- **Kullanıcı Türü:** Mutlaka **"API Kullanıcısı"** seçin
- Kullanıcı adı ve şifre belirleyin
- Bu bilgileri not edin

**Adım 4:** SMS paketi satın alın (API kullanımı için gerekli)

---

### 2. Database Migration (Neon SQL Editor)

```sql
-- Neon SQL Editor'de çalıştır:
-- apps/admin/prisma/migrations/add_otp_verification.sql dosyasındaki SQL'i kopyala ve çalıştır

CREATE TABLE IF NOT EXISTS otp_verifications (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL,
  tenant_id TEXT,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE NOT NULL,
  verified_at TIMESTAMP,
  attempts INTEGER DEFAULT 0 NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_phone_purpose ON otp_verifications(phone, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);
```

---

### 3. Environment Variables

**Vercel Dashboard → Project → Settings → Environment Variables:**

#### Admin App:
```bash
NETGSM_USERCODE=your-netgsm-usercode
NETGSM_PASSWORD=your-netgsm-password
NETGSM_MSGHEADER=
CRON_SECRET=your-random-secret-key-here
```

#### Web App:
```bash
NETGSM_USERCODE=your-netgsm-usercode
NETGSM_PASSWORD=your-netgsm-password
NETGSM_MSGHEADER=
```

**CRON_SECRET oluşturmak için:**
```bash
openssl rand -base64 32
```

---

### 4. Vercel Cron Job (Admin App)

`apps/admin/vercel.json` dosyasına eklendi:

```json
{
  "crons": [
    {
      "path": "/api/whatsapp/check-reminders",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/otp/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

OTP cleanup job'ı her gün saat 02:00'da çalışır.

---

## 🔧 Nasıl Çalışır?

### Randevu Sorgulama Flow

```
1. Kullanıcı telefon numarasını girer
       ↓
2. OTP generate edilir ve SMS gönderilir
       ↓
3. 120 saniye timer başlar
       ↓
4. Kullanıcı 6 haneli kodu girer
       ↓
5. Doğrulama yapılır (max 3 deneme)
       ↓
6. Başarılı ise randevular gösterilir
```

### SMS Metni

```
NetRandevu randevu sorgulama kodunuz: 123456. 2 dakika gecerlidir.
```

### Güvenlik Özellikleri

- **6 Haneli Kod:** Rastgele üretilir
- **120 Saniye Geçerlilik:** Kod 2 dakika sonra otomatik expire olur
- **3 Deneme Hakkı:** Yanlış kod girişinde max 3 deneme
- **Rate Limiting:** Aynı numara için 1 dakikada 1 SMS
- **IP Kaydı:** Her OTP isteği için IP adresi loglanır
- **Otomatik Temizlik:** Expired OTP'ler günlük silinir

---

## 📊 OTP Cleanup Cron Job

### Temizleme Kuralları

1. **Expired OTP'ler:** `expiresAt < now` → Hemen sil
2. **Eski Verified OTP'ler:** `verified = true AND verifiedAt < 24 hours ago` → Sil
3. **7 Günden Eski Tüm OTP'ler:** `createdAt < 7 days ago` → Sil

### Cron Schedule

- **Çalışma Saati:** Her gün 02:00 (gece)
- **Endpoint:** `/api/otp/cleanup`
- **Auth:** Bearer token (CRON_SECRET)

---

## 🧪 Test Etme

### 1. Manuel OTP Gönderme (Web App)

```bash
curl -X POST https://yourapp.vercel.app/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "05551234567",
    "purpose": "appointment_query"
  }'
```

**Başarılı Yanıt:**
```json
{
  "success": true,
  "message": "Doğrulama kodu gönderildi",
  "expiresIn": 120,
  "otpId": "otp_1234567890_xyz"
}
```

### 2. OTP Doğrulama

```bash
curl -X POST https://yourapp.vercel.app/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "05551234567",
    "code": "123456",
    "purpose": "appointment_query"
  }'
```

**Başarılı Yanıt:**
```json
{
  "success": true,
  "message": "Doğrulama başarılı",
  "sessionToken": "session_1234567890_abc",
  "phone": "905551234567"
}
```

### 3. OTP Cleanup Test (Admin App)

```bash
curl -X GET https://admin.yourapp.com/api/otp/cleanup \
  -H "Authorization: Bearer your-cron-secret"
```

**Başarılı Yanıt:**
```json
{
  "success": true,
  "message": "OTP cleanup completed",
  "stats": {
    "expiredDeleted": 15,
    "oldVerifiedDeleted": 8,
    "oldAllDeleted": 2,
    "totalDeleted": 25
  }
}
```

---

## 🎨 Kullanıcı Arayüzü

### Randevu Sorgulama Sayfası

**URL:** `/randevularim`

**Adım 1:** Telefon Girişi
- Kullanıcı 11 haneli telefon numarasını girer (05XXXXXXXXX)
- "Doğrulama Kodu Gönder" butonuna tıklar

**Adım 2:** OTP Girişi
- 6 haneli kod SMS ile gelir
- 120 saniyelik timer gösterilir
- Kod girişi için 3 deneme hakkı
- "Kodu Tekrar Gönder" butonu (60 saniye sonra aktif)
- "Telefon Numarasını Değiştir" butonu

**Adım 3:** Randevular Listelenir
- Doğrulama başarılı olursa `/randevularim/list` sayfasına yönlendirilir
- Kullanıcının tüm randevuları gösterilir

---

## 📞 NetGSM API Bilgileri

- **Dashboard:** https://www.netgsm.com.tr
- **Docs:** https://www.netgsm.com.tr/dokuman/
- **API URL:** https://api.netgsm.com.tr/sms/send/xml
- **Support:** NetGSM destek hattı

---

## 🐛 Troubleshooting

### SMS Gönderilmiyor

1. **NetGSM Credentials Kontrol:**
   ```bash
   echo "NETGSM_USERCODE: $NETGSM_USERCODE"
   echo "NETGSM_PASSWORD: $NETGSM_PASSWORD"
   ```

2. **API Test:**
   ```bash
   curl -X POST https://api.netgsm.com.tr/sms/send/xml \
     -H "Content-Type: application/xml" \
     -d '<?xml version="1.0" encoding="UTF-8"?>
     <mainbody>
       <header>
         <company dil="TR">Netgsm</company>
         <usercode>YOUR_USERCODE</usercode>
         <password>YOUR_PASSWORD</password>
         <type>1:n</type>
         <msgheader></msgheader>
       </header>
       <body>
         <msg><![CDATA[Test mesaji]]></msg>
         <no>905551234567</no>
       </body>
     </mainbody>'
   ```

3. **NetGSM Response Codes:**
   - `00` veya `01`: Başarılı
   - `20`: Mesaj metninde hata
   - `30`: Geçersiz kullanıcı adı/şifre
   - `40`: Mesaj başlığı hatalı
   - `50`: API erişim izni yok
   - `70`: Hatalı sorgulama

4. **Telefon Formatı:**
   - ✅ Doğru: `905551234567`
   - ❌ Yanlış: `+90 555 123 45 67`
   - ❌ Yanlış: `0555 123 45 67`

### OTP Doğrulama Hataları

**"OTP_NOT_FOUND":**
- SMS henüz gönderilmemiş
- Veya çok eski OTP (cleanup ile silinmiş)

**"OTP_EXPIRED":**
- 120 saniye geçmiş
- Yeni kod isteyin

**"MAX_ATTEMPTS_REACHED":**
- 3 deneme hakkı tükendi
- Yeni kod isteyin

**"INVALID_CODE":**
- Kod hatalı girilmiş
- Kalan deneme sayısını kontrol edin

### Cron Job Çalışmıyor

1. Vercel Dashboard → Cron Jobs → Logs kontrol et
2. CRON_SECRET environment variable set edilmiş mi?
3. vercel.json dosyası commit edilmiş mi?
4. Cron job endpoint'i manuel test et

---

## 🔐 Güvenlik Best Practices

1. **Environment Variables:** Hassas bilgileri asla kodda yazmayın
2. **Rate Limiting:** SMS spam'ini önleyin (1 dakikada 1 SMS)
3. **IP Logging:** Kötüye kullanım için IP kaydet
4. **Deneme Sınırı:** Max 3 deneme ile brute-force saldırısını önleyin
5. **Otomatik Expire:** 120 saniye sonra kod otomatik geçersiz olsun
6. **Cron Secret:** Cron endpoint'leri mutlaka Bearer token ile koruyun
7. **HTTPS Only:** Tüm API çağrıları HTTPS üzerinden yapılmalı

---

## 💰 NetGSM Fiyatlandırma

- **SMS Paketi:** Pakete göre değişir
- **API Kullanımı:** SMS kredisi tüketir
- **Free Trial:** Yeni hesaplarda deneme paketi olabilir

**Not:** SMS paketiniz bittiğinde API çalışmayı durdurur!

---

## 🚀 Yeni Kullanım Alanları Eklemek

### Örnek: Şifre Sıfırlama için OTP

**1. OTP Gönder:**
```typescript
await fetch('/api/otp/send', {
  method: 'POST',
  body: JSON.stringify({
    phone: '05551234567',
    purpose: 'password_reset', // Farklı purpose
    tenantId: 'tenant_123' // Opsiyonel
  })
});
```

**2. OTP Doğrula:**
```typescript
await fetch('/api/otp/verify', {
  method: 'POST',
  body: JSON.stringify({
    phone: '05551234567',
    code: '123456',
    purpose: 'password_reset' // Aynı purpose
  })
});
```

**3. SMS Metni Özelleştir:**
```typescript
// lib/netgsm-client.ts içinde
const purposeText = purpose === 'password_reset'
  ? 'şifre sıfırlama'
  : purpose === 'subscription'
  ? 'yeni abonelik'
  : 'doğrulama';
```

---

## 🎉 Tamamlandı!

Artık sisteminiz NetGSM SMS OTP entegrasyonu ile çalışıyor! 🚀

**Önemli:** Vercel'de environment variable'ları ayarlamayı unutmayın!
