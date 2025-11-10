# 🔧 NetGSM Error 40 - Mesaj Başlığı Hatalı

## ❌ Mevcut Durum

NetGSM'den **Error 40** alıyorsunuz:
```
40 = Mesaj başlığı (header) hatalı
```

Test sonuçları:
- ✅ Kullanıcı adı ve şifre **DOĞRU** (Error 30 almıyorsunuz)
- ❌ Mesaj başlığı (msgheader) **HATALI** (Error 40)

## 🔍 Sorunun Nedeni

NetGSM hesabınızda **hiç SMS başlığı tanımlanmamış**. SMS gönderebilmek için mutlaka bir başlık (header/originator) tanımlamanız gerekiyor.

## ✅ Çözüm - 2 Seçenek

### Seçenek 1: Özel Metin Başlık (Tavsiye Edilen)

**Avantajları:**
- Profesyonel görünüm
- Markanızı gösterir
- SMS'ler "NETRANDEVU" gibi bir isimle gelir

**Nasıl Yapılır:**

1. **NetGSM Paneli** → https://www.netgsm.com.tr → Giriş yap

2. **İşlemler** → **Başlık Tanımlama** (veya **SMS Başlıkları**)

3. **Yeni Başlık Ekle:**
   - **Başlık Adı**: `NETRANDEVU` (max 11 karakter, boşluksuz)
   - **Başlık Tipi**: Normal SMS
   - **Onay bekle**: NetGSM onaylaması gerekir (genelde 1-2 iş günü)

4. Onaylandıktan sonra Vercel environment variables:
   ```bash
   NETGSM_MSGHEADER=NETRANDEVU
   ```

**Not:** Başlık onaylanana kadar Seçenek 2'yi kullanın.

---

### Seçenek 2: Numara ile Gönderim (Hızlı Çözüm)

**Avantajları:**
- Anında kullanılabilir
- Onay beklemeye gerek yok
- SMS'ler telefon numaranızdan gelir

**Nasıl Yapılır:**

1. **NetGSM Paneli** → https://www.netgsm.com.tr → Giriş yap

2. **Hesap Ayarları** → **API Ayarları**

3. **Numara ile SMS Gönderimi** seçeneğini aktif edin

4. Telefon numaranızı doğrulayın: `8503036723`

5. Vercel environment variables (boş bırakın):
   ```bash
   NETGSM_MSGHEADER=
   ```
   veya
   ```bash
   # NETGSM_MSGHEADER değişkenini tamamen silip eklemeyin
   ```

**Not:** Bu durumda SMS'ler `8503036723` numarasından gönderilir.

---

## 🚀 Kod Değişiklikleri Yapıldı

Aşağıdaki dosyalarda `NETGSM_MSGHEADER` varsayılan değeri boş string olarak güncellendi:

- [apps/web/lib/netgsm-client.ts](apps/web/lib/netgsm-client.ts:10)
- [apps/admin/lib/netgsm-client.ts](apps/admin/lib/netgsm-client.ts:10)

```typescript
// Eski (YANLIŞ):
const NETGSM_MSGHEADER = process.env.NETGSM_MSGHEADER || process.env.NETGSM_USERCODE || '8503036723';

// Yeni (DOĞRU):
const NETGSM_MSGHEADER = process.env.NETGSM_MSGHEADER || '';
```

---

## 📝 Vercel Environment Variables Güncellemesi

### Web App için:
```bash
NETGSM_USERCODE=8503036723
NETGSM_PASSWORD=Ozan.1903
# NETGSM_MSGHEADER= (boş bırakın veya hiç eklemeyin)
```

### Admin App için:
```bash
NETGSM_USERCODE=8503036723
NETGSM_PASSWORD=Ozan.1903
# NETGSM_MSGHEADER= (boş bırakın veya hiç eklemeyin)
```

**Önemli:**
- Eğer özel başlık tanımladıysanız ve onaylandıysa: `NETGSM_MSGHEADER=NETRANDEVU`
- Numara ile gönderim yapacaksanız: `NETGSM_MSGHEADER` değişkenini **tamamen kaldırın** veya boş bırakın

---

## 🧪 Test Etme

Değişiklikleri yaptıktan sonra deployment'ı bekleyin ve test edin:

```bash
curl -X POST https://netrandevu.com/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "05551234567",
    "purpose": "appointment_query"
  }'
```

**Başarılı yanıt:**
```json
{
  "success": true,
  "message": "Doğrulama kodu gönderildi",
  "expiresIn": 120
}
```

**Başarısız yanıt (Error 40 devam ediyorsa):**
```json
{
  "success": false,
  "error": "Mesaj başlığı (header) hatalı"
}
```

---

## 🔧 Manuel Test (Terminal'den)

```bash
# Boş msgheader ile test
curl -s -X POST https://api.netgsm.com.tr/sms/send/xml \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<mainbody>
  <header>
    <company dil="TR">Netgsm</company>
    <usercode>8503036723</usercode>
    <password>Ozan.1903</password>
    <type>1:n</type>
    <msgheader></msgheader>
  </header>
  <body>
    <msg><![CDATA[Test mesaji]]></msg>
    <no>905551234567</no>
  </body>
</mainbody>'
```

**Beklenen sonuç:**
- `00` veya `01` = Başarılı
- `40` = Hala başlık sorunu var, NetGSM destek ile konuşun

---

## 📞 NetGSM Destek

Eğer yukarıdaki çözümler işe yaramazsa NetGSM destek ekibiyle iletişime geçin:

**İletişim:**
- Website: https://www.netgsm.com.tr
- Destek: NetGSM müşteri hizmetleri
- Email: Panelden destek talebi açabilirsiniz

**Sorulacak Sorular:**
1. "API kullanıcısı ile SMS gönderebilmek için msgheader tanımlamam gerekiyor mu?"
2. "Numara ile SMS gönderimi nasıl aktif edilir?"
3. "Error 40 alıyorum, msgheader sorununu nasıl çözebilirim?"

---

## 📋 Hata Kodları Referansı

| Kod | Anlamı | Çözüm |
|-----|--------|-------|
| 00/01 | Başarılı | ✅ SMS gönderildi |
| 20 | Mesaj metni hatası | Mesaj içeriğini kontrol et |
| 30 | Yanlış kullanıcı adı/şifre | Credentials'ı düzelt |
| **40** | **Msgheader hatası** | **Başlık tanımla veya numara ile gönderim aktif et** |
| 50 | API erişim izni yok | API kullanıcısı oluştur |
| 70 | Hatalı sorgulama | XML formatını kontrol et |

---

## ✅ Deployment Sonrası Yapılacaklar

1. **Kodu deploy edin:**
   ```bash
   git add .
   git commit -m "fix: update NetGSM msgheader configuration"
   git push
   ```

2. **Vercel'de environment variable'ları güncelleyin**

3. **Deployment tamamlanınca test edin**

4. **Eğer hala Error 40 alıyorsanız NetGSM destek ile konuşun**

---

## 💡 Önerilen Akış

1. ✅ **Şimdi:** Kodu deploy et (zaten değişiklik yapıldı)
2. 📞 **Bugün:** NetGSM destek ile konuş, "Numara ile SMS gönderimi" aktif et
3. 🧪 **Bugün:** Test et - Error 40 gitmeli
4. 📝 **İlerde:** Özel başlık (NETRANDEVU) tanımla ve onayla
5. 🔄 **Gelecek:** Onaylandığında `NETGSM_MSGHEADER=NETRANDEVU` olarak güncelle

---

**Son Güncelleme:** 2025-11-10

**Status:** 🔧 Kod değişiklikleri yapıldı | ⏳ NetGSM panel ayarı bekleniyor
