# 💳 PayTR Ödeme Entegrasyonu - Özet

## ✅ Tamamlanan İşlemler

### 1. Database Schema
- **Payment** modeli eklendi (ödeme kayıtları için)
- **Appointment** modeline `paymentStatus` ve `paymentId` alanları eklendi
- Migration SQL Neon'da başarıyla çalıştırıldı

### 2. Backend API
- ✅ `/api/payment/initiate` - Ödeme başlatma
- ✅ `/api/payment/callback` - PayTR callback handler
- ✅ PayTR client library (token generation, hash validation)
- ✅ Transaction oluşturma kontrolü (packageInfo kontrolü eklendi)

### 3. Environment Variables (Vercel'de eklendi)
```
PAYTR_MERCHANT_ID=636960
PAYTR_MERCHANT_KEY=rL2TjcA26mJbEgLE
PAYTR_MERCHANT_SALT=dSDLbyHHk7Mm2xnt
PAYTR_TEST_MODE=1
NEXT_PUBLIC_WEB_URL=https://netrandevu.com
```

---

## 🎯 Ödeme Akışı

### Senaryo 1: Paket Kullanımı
```
Kullanıcı randevu oluşturur
  → Paket seçeneği var mı? EVET
  → "Paket Kullan" seçilir
  → Randevu oluşturulur
  → paymentStatus: "package_used"
  → Transaction oluşturulmaz (çünkü paket zaten ödenmiş)
```

### Senaryo 2: Kart ile Ödeme
```
Kullanıcı randevu oluşturur
  → "Kredi Kartı ile Öde" seçilir
  → Payment kaydı oluşturulur (status: pending)
  → PayTR iframe açılır
  → Kullanıcı kart bilgisi girer
  → Ödeme başarılı olursa:
    ├─ Callback gelir
    ├─ Payment güncellenir (status: success)
    ├─ Randevu oluşturulur (paymentStatus: "paid")
    └─ Transaction oluşturulur
```

### Senaryo 3: Ödeme Yapmadan İlerle
```
Kullanıcı randevu oluşturur
  → "Ödeme Yapmadan İlerle" seçilir
  → Randevu oluşturulur
  → paymentStatus: "pending"
  → Admin panel'de "Ödeme Bekliyor" olarak görünür
  → Admin manuel ödeme alabilir
```

---

## 📊 Payment Status Değerleri

| Status | Anlamı | Gösterim |
|--------|--------|----------|
| `pending` | Ödeme yapılmadı | ⏳ Ödeme Bekliyor |
| `paid` | Kart ile ödendi | ✅ Ödeme Alındı (Kredi Kartı) |
| `package_used` | Paket kullanıldı | 🎁 Paket Kullanıldı |
| `failed` | Ödeme başarısız | ❌ Ödeme Başarısız |

---

## 🔧 PayTR Callback URL
**URL:** `https://netrandevu.com/api/payment/callback`

Bu URL'i PayTR panelinde kaydetmeniz gerekiyor:
1. https://www.paytr.com → Giriş yap
2. Mağaza Paneli → Destek & Kurulum → Entegrasyon Bilgileri
3. Callback URL'i kaydet

---

## 🧪 Test Etme

### Test Kartları (PayTR Test Modu)
PayTR test modunda aşağıdaki kartları kullanabilirsiniz:
- **Başarılı:** 4355 0840 0000 0001
- **CVV:** 000
- **Tarih:** Gelecekte bir tarih

### Manuel API Test
```bash
# 1. Payment initiate
curl -X POST https://netrandevu.com/api/payment/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "xxx",
    "customerEmail": "test@example.com",
    "amount": 100,
    "serviceName": "Test Hizmeti"
  }'

# Response: { iframeUrl: "https://www.paytr.com/odeme/guvenli/TOKEN" }
```

---

## 📝 Sonraki Adımlar

### Öncelikli:
1. ✅ Web app randevu akışına ödeme UI'ı ekle
2. ⏳ Admin panel'de ödeme durumu gösterimi
3. ⏳ Admin panel'de manuel ödeme alma özelliği
4. ⏳ Randevu iptal edilince otomatik iade

### Gelecek:
- Fatura/Makbuz oluşturma
- Paraşüt entegrasyonu
- Ödeme raporları
- Toplu ödeme alma

---

## 🐛 Sorun Giderme

### Callback Gelmiyor
- PayTR test modunda callback gönderilmeyebilir
- Canlı moda geçince düzelir
- Manuel test için callback endpoint'ini Postman ile test edin

### Transaction Duplicate
- `packageInfo` kontrolü eklendi
- Paket kullanılan randevularda Transaction oluşturulmaz
- Log'larda "Skipping - Package used" mesajı görünür

### Ödeme Başarısız
- PayTR dönen hata kodlarını kontrol edin
- `failed_reason_code` ve `failed_reason_msg` log'larda görünür

---

## 📞 İletişim

**PayTR Destek:** https://www.paytr.com/destek-merkezi
**PayTR Docs:** https://dev.paytr.com

---

Oluşturulma Tarihi: 2025-01-10
