/**
 * Message Templates - Varsayılan şablonlar ve yardımcı fonksiyonlar
 */

export const DEFAULT_TEMPLATES = {
  whatsappConfirmation: `Merhaba {musteriAdi},

Randevunuz başarıyla oluşturuldu! 🎉

📅 *Tarih:* {tarih}
🕐 *Saat:* {saat}
👤 *Personel:* {personel}
💼 *Hizmet:* {hizmet}
💰 *Ücret:* {ucret}
📍 *Adres:* {isletmeAdres}

Görüşmek üzere! 😊

*{isletmeAdi}*
📞 {isletmeTelefon}`,

  smsConfirmation: `{isletmeAdi} randevunuz oluşturuldu. Tarih: {tarih}, Saat: {saat}, Personel: {personel}, Hizmet: {hizmet}, Ücret: {ucret}. Görüşmek üzere! Tel: {isletmeTelefon}`,

  whatsappReminder: `Merhaba {musteriAdi},

⏰ *Randevunuza {hatirlatmaSuresi} kaldı!*

📅 *Tarih:* {tarih}
🕐 *Saat:* {saat}
👤 *Personel:* {personel}
💼 *Hizmet:* {hizmet}
📍 *Adres:* {isletmeAdres}

Sizi bekliyoruz! 😊

*{isletmeAdi}*
📞 {isletmeTelefon}`,

  smsReminder: `{isletmeAdi} randevunuz {hatirlatmaSuresi}. Tarih: {tarih}, Saat: {saat}, Hizmet: {hizmet}. Görüşmek üzere!`,

  staffDailyReminder: `🌅 Günaydın {personelAdi}!

📅 *{gun}, {tarih}*

Bugün {randevuSayisi} randevunuz var:

{randevuListesi}

İyi çalışmalar! 💪

_{isletmeAdi}_`,

  ownerDailyReminder: `🌙 İyi akşamlar {sahipAdi}!

📊 *{gun}, {tarih} - Günlük Özet*

━━━━━━━━━━━━━━━━━━━━

👥 *Müşteri İstatistikleri*
✅ Gelen Müşteri: {gelenMusteri}
❌ İptal: {iptalSayisi}
⚠️ Gelmedi: {gelmediler}
📋 Toplam Randevu: {toplamRandevu}

━━━━━━━━━━━━━━━━━━━━

💰 *Gelir Raporu*
💵 Nakit: {nakitGelir} TL
💳 Kredi Kartı: {kartGelir} TL
🎁 Paket: {paketGelir} TL

━━━━━━━━━━━━━━━━━━━━

💎 *Toplam Gelir: {toplamGelir} TL*

_{isletmeAdi}_`,

  whatsappSurvey: `Merhaba {musteriAdi},

{isletmeAdi}'deki randevunuz tamamlandı! 🎉

Hizmetimizden memnun kaldınız mı? Geri bildiriminiz bizim için çok değerli.

📝 Değerlendirme yapmak için: {anketLinki}

Teşekkürler! 🙏
*{isletmeAdi}*`,

  smsSurvey: `{isletmeAdi} randevunuz tamamlandı. Değerlendirme için: {anketLinki} Teşekkürler!`
};

/**
 * Şablondaki değişkenleri verilen değerlerle değiştirir
 */
export function renderTemplate(template: string, variables: Record<string, string>): string {
  return Object.entries(variables).reduce(
    (msg, [key, value]) => msg.replace(new RegExp(`\\{${key}\\}`, 'g'), value || ''),
    template
  );
}

/**
 * Tenant'ın özel şablonunu al, yoksa varsayılanı döndür
 */
export function getTemplate(
  messageTemplates: string | null | undefined,
  key: keyof typeof DEFAULT_TEMPLATES
): string {
  if (!messageTemplates) return DEFAULT_TEMPLATES[key];

  try {
    const templates = typeof messageTemplates === 'string'
      ? JSON.parse(messageTemplates)
      : messageTemplates;
    return templates[key] || DEFAULT_TEMPLATES[key];
  } catch {
    return DEFAULT_TEMPLATES[key];
  }
}

/**
 * Müşteri mesajları için kullanılabilir değişkenler
 */
export const CUSTOMER_VARIABLES = [
  { key: '{musteriAdi}', label: 'Müşteri Adı' },
  { key: '{tarih}', label: 'Tarih' },
  { key: '{saat}', label: 'Saat' },
  { key: '{personel}', label: 'Personel' },
  { key: '{hizmet}', label: 'Hizmet' },
  { key: '{ucret}', label: 'Ücret' },
  { key: '{isletmeAdi}', label: 'İşletme Adı' },
  { key: '{isletmeTelefon}', label: 'İşletme Telefon' },
  { key: '{isletmeAdres}', label: 'İşletme Adres' },
  { key: '{hatirlatmaSuresi}', label: 'Hatırlatma Süresi' },
];

/**
 * Personel mesajları için kullanılabilir değişkenler
 */
export const STAFF_VARIABLES = [
  { key: '{personelAdi}', label: 'Personel Adı' },
  { key: '{gun}', label: 'Gün (Pazartesi, Salı...)' },
  { key: '{tarih}', label: 'Tarih' },
  { key: '{randevuSayisi}', label: 'Randevu Sayısı' },
  { key: '{randevuListesi}', label: 'Randevu Listesi' },
  { key: '{isletmeAdi}', label: 'İşletme Adı' },
];

/**
 * Sahip günlük özet değişkenleri
 */
export const OWNER_VARIABLES = [
  { key: '{sahipAdi}', label: 'Sahip Adı' },
  { key: '{gun}', label: 'Gün' },
  { key: '{tarih}', label: 'Tarih' },
  { key: '{gelenMusteri}', label: 'Gelen Müşteri' },
  { key: '{iptalSayisi}', label: 'İptal Sayısı' },
  { key: '{gelmediler}', label: 'Gelmediler' },
  { key: '{toplamRandevu}', label: 'Toplam Randevu' },
  { key: '{nakitGelir}', label: 'Nakit Gelir' },
  { key: '{kartGelir}', label: 'Kart Gelir' },
  { key: '{paketGelir}', label: 'Paket Gelir' },
  { key: '{toplamGelir}', label: 'Toplam Gelir' },
  { key: '{isletmeAdi}', label: 'İşletme Adı' },
];

/**
 * Anket mesajı değişkenleri
 */
export const SURVEY_VARIABLES = [
  { key: '{musteriAdi}', label: 'Müşteri Adı' },
  { key: '{tarih}', label: 'Tarih' },
  { key: '{saat}', label: 'Saat' },
  { key: '{personel}', label: 'Personel' },
  { key: '{hizmet}', label: 'Hizmet' },
  { key: '{isletmeAdi}', label: 'İşletme Adı' },
  { key: '{anketLinki}', label: 'Anket Linki' },
];
