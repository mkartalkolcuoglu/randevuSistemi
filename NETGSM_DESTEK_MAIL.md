# NetGSM Destek Talebi - Email Şablonu

## 📧 Email Bilgileri

**Kime:** NetGSM Müşteri Hizmetleri / Teknik Destek
**Nasıl Ulaşılır:** NetGSM web panelinden destek talebi açın veya müşteri hizmetlerini arayın

---

## ✉️ Email Şablonu (Türkçe)

**Konu:** API SMS Gönderimi - Error 40 (Msgheader Hatası)

---

Sayın NetGSM Destek Ekibi,

API üzerinden SMS göndermek istiyorum ancak **Error 40 (Mesaj başlığı hatalı)** hatası alıyorum.

**Hesap Bilgilerim:**
- Kullanıcı Kodu: 8503036723
- Hesap Tipi: API Kullanıcısı
- Kullanım Amacı: OTP/Doğrulama SMS gönderimi

**Aldığım Hata:**
```
Response Code: 40
Açıklama: Mesaj başlığı (header) hatalı
```

**Yaptığım Testler:**
1. ✅ Kullanıcı adı ve şifre doğru (Error 30 almıyorum)
2. ✅ XML formatı doğru
3. ❌ msgheader boş veya usercode ile doldurduğumda Error 40 alıyorum

**Test XML'im:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<mainbody>
  <header>
    <company dil="TR">Netgsm</company>
    <usercode>8503036723</usercode>
    <password>****</password>
    <type>1:n</type>
    <msgheader></msgheader>
  </header>
  <body>
    <msg><![CDATA[Test mesaji]]></msg>
    <no>905551234567</no>
  </body>
</mainbody>
```

**Sorularım:**

1. **Hesabımda SMS başlığı (msgheader) tanımlı mı?**
   Eğer tanımlı değilse nasıl tanımlanabilir?

2. **Numara ile SMS gönderimi yapabilir miyim?**
   (Msgheader yerine telefon numaramı kullanmak istiyorum: 8503036723)

3. **API kullanıcımın SMS gönderme izni var mı?**
   Eğer eksik bir yetkilendirme varsa aktif edebilir misiniz?

**Tercihim:** Özel bir başlık tanımlanana kadar **numara ile SMS gönderimi** yapmak istiyorum. Bu özelliği hesabımda aktif edebilir misiniz?

İlerleyen zamanda **"NETRANDEVU"** başlığını tanımlamayı düşünüyorum. Bunun için gerekli prosedür nedir?

Yardımlarınız için teşekkür ederim.

Saygılarımla,
[Adınız]
Telefon: 8503036723
Email: [Email adresiniz]

---

## 🔄 Alternatif Kısa Versiyon

**Konu:** SMS API - Error 40 Hatası - Msgheader Tanımlama

---

Merhaba,

API ile SMS göndermeye çalışıyorum ancak **Error 40** (msgheader hatası) alıyorum.

**Kullanıcı Kodu:** 8503036723

**Sorum:** Hesabımda numara ile SMS gönderimi aktif mi? Değilse aktif edebilir misiniz?

Alternatif olarak **"NETRANDEVU"** başlığını tanımlamak istiyorum. Gerekli işlemleri yapabilir misiniz?

Teşekkürler.

---

## 📞 Telefon Görüşmesi İçin Notlar

Eğer telefon ile ararsan (daha hızlı olabilir):

**Söyleyeceklerin:**

1. "Merhaba, API ile SMS göndermeye çalışıyorum ama Error 40 alıyorum"

2. "Kullanıcı kodum: 8503036723"

3. "Msgheader tanımlı değil galiba. Numara ile SMS gönderimi yapabilir miyim?"

4. **VEYA** "NETRANDEVU isminde bir başlık tanımlamak istiyorum, nasıl yapabilirim?"

**Beklenen Cevaplar:**

- ✅ "Hesabınızda numara ile gönderim aktif edildi" → Test et
- 📝 "Başlık başvurusu gerekli" → Form doldur
- 💰 "SMS krediniz bitmiş" → Paket satın al
- 🔧 "API yetkisi eksik" → Aktif etmelerini iste

---

## 🎯 Hedef Sonuç

1. **Hemen çözüm:** Numara ile SMS gönderimi aktif edilsin (8503036723)
2. **Uzun vadeli:** NETRANDEVU başlığı tanımlansın ve onaylansın

---

## ✅ Destek Yanıt Verdiğinde

**Eğer "Numara ile gönderim aktif edildi" derse:**

1. Hemen test et:
   ```bash
   ./test-netgsm.sh 8503036723 "Ozan.1903"
   ```

2. Response `00` veya `01` olmalı (başarılı)

3. Vercel'de `NETGSM_MSGHEADER` değişkenini **kaldır** veya boş bırak

**Eğer "Başlık tanımla" derse:**

1. NetGSM panelinde **İşlemler** → **Başlık Tanımlama**
2. Yeni başlık: `NETRANDEVU`
3. Onay bekle (1-2 iş günü)
4. Onaylandıktan sonra Vercel'de: `NETGSM_MSGHEADER=NETRANDEVU`

---

## 📋 Ek Bilgiler (İstenirse)

**Kullanım Amacı:**
Randevu sistemi için SMS OTP (tek kullanımlık şifre) gönderimi

**Günlük SMS Sayısı:**
Başlangıçta ~50-100 SMS/gün (büyüdükçe artabilir)

**SMS İçeriği Örneği:**
"NetRandevu doğrulama kodunuz: 123456. 2 dakika geçerlidir."

---

**NOT:** Bu email'i göndermeden önce NetGSM web panelinde **"Destek"** veya **"Ticket"** bölümünden de destek talebi açabilirsin. Genelde daha hızlı yanıt veriyorlar.
