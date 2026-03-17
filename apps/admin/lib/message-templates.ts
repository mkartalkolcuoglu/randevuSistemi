/**
 * Message Templates - Varsayılan şablonlar ve yardımcı fonksiyonlar
 */

export const DEFAULT_TEMPLATES = {
  whatsappConfirmation: `Merhaba {musteriAdi},

Randevunuz basariyla olusturuldu! 🎉

📅 *Tarih:* {tarih}
🕐 *Saat:* {saat}
👤 *Personel:* {personel}
💼 *Hizmet:* {hizmet}
💰 *Ucret:* {ucret}
📍 *Adres:* {isletmeAdres}

Gorusmek uzere! 😊

*{isletmeAdi}*
📞 {isletmeTelefon}`,

  smsConfirmation: `{isletmeAdi} randevunuz olusturuldu. Tarih: {tarih}, Saat: {saat}, Personel: {personel}, Hizmet: {hizmet}, Ucret: {ucret}. Gorusmek uzere! Tel: {isletmeTelefon}`,

  whatsappReminder: `Merhaba {musteriAdi},

⏰ *Randevunuza {hatirlatmaSuresi} kaldi!*

📅 *Tarih:* {tarih}
🕐 *Saat:* {saat}
👤 *Personel:* {personel}
💼 *Hizmet:* {hizmet}
📍 *Adres:* {isletmeAdres}

Sizi bekliyoruz! 😊

*{isletmeAdi}*
📞 {isletmeTelefon}`,

  smsReminder: `{isletmeAdi} randevunuz {hatirlatmaSuresi}. Tarih: {tarih}, Saat: {saat}, Hizmet: {hizmet}. Gorusmek uzere!`,

  staffDailyReminder: `🌅 Gunaydin {personelAdi}!

📅 *{gun}, {tarih}*

Bugun {randevuSayisi} randevunuz var:

{randevuListesi}

Iyi calismalar! 💪

_{isletmeAdi}_`,

  ownerDailyReminder: `🌙 Iyi aksamlar {sahipAdi}!

📊 *{gun}, {tarih} - Gunluk Ozet*

━━━━━━━━━━━━━━━━━━━━

👥 *Musteri Istatistikleri*
✅ Gelen Musteri: {gelenMusteri}
❌ Iptal: {iptalSayisi}
⚠️ Gelmedi: {gelmediler}
📋 Toplam Randevu: {toplamRandevu}

━━━━━━━━━━━━━━━━━━━━

💰 *Gelir Raporu*
💵 Nakit: {nakitGelir} TL
💳 Kredi Karti: {kartGelir} TL
🎁 Paket: {paketGelir} TL

━━━━━━━━━━━━━━━━━━━━

💎 *Toplam Gelir: {toplamGelir} TL*

_{isletmeAdi}_`,

  whatsappSurvey: `Merhaba {musteriAdi},

{isletmeAdi}'deki randevunuz tamamlandi! 🎉

Hizmetimizden memnun kaldiniz mi? Geri bildiriminiz bizim icin cok degerli.

📝 Degerlendirme yapmak icin: {anketLinki}

Tesekkurler! 🙏
*{isletmeAdi}*`,

  smsSurvey: `{isletmeAdi} randevunuz tamamlandi. Degerlendirme icin: {anketLinki} Tesekkurler!`
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
  { key: '{musteriAdi}', label: 'Musteri Adi' },
  { key: '{tarih}', label: 'Tarih' },
  { key: '{saat}', label: 'Saat' },
  { key: '{personel}', label: 'Personel' },
  { key: '{hizmet}', label: 'Hizmet' },
  { key: '{ucret}', label: 'Ucret' },
  { key: '{isletmeAdi}', label: 'Isletme Adi' },
  { key: '{isletmeTelefon}', label: 'Isletme Telefon' },
  { key: '{isletmeAdres}', label: 'Isletme Adres' },
  { key: '{hatirlatmaSuresi}', label: 'Hatirlatma Suresi' },
];

/**
 * Personel mesajları için kullanılabilir değişkenler
 */
export const STAFF_VARIABLES = [
  { key: '{personelAdi}', label: 'Personel Adi' },
  { key: '{gun}', label: 'Gun (Pazartesi, Sali...)' },
  { key: '{tarih}', label: 'Tarih' },
  { key: '{randevuSayisi}', label: 'Randevu Sayisi' },
  { key: '{randevuListesi}', label: 'Randevu Listesi' },
  { key: '{isletmeAdi}', label: 'Isletme Adi' },
];

/**
 * Sahip günlük özet değişkenleri
 */
export const OWNER_VARIABLES = [
  { key: '{sahipAdi}', label: 'Sahip Adi' },
  { key: '{gun}', label: 'Gun' },
  { key: '{tarih}', label: 'Tarih' },
  { key: '{gelenMusteri}', label: 'Gelen Musteri' },
  { key: '{iptalSayisi}', label: 'Iptal Sayisi' },
  { key: '{gelmediler}', label: 'Gelmediler' },
  { key: '{toplamRandevu}', label: 'Toplam Randevu' },
  { key: '{nakitGelir}', label: 'Nakit Gelir' },
  { key: '{kartGelir}', label: 'Kart Gelir' },
  { key: '{paketGelir}', label: 'Paket Gelir' },
  { key: '{toplamGelir}', label: 'Toplam Gelir' },
  { key: '{isletmeAdi}', label: 'Isletme Adi' },
];

/**
 * Anket mesajı değişkenleri
 */
export const SURVEY_VARIABLES = [
  { key: '{musteriAdi}', label: 'Musteri Adi' },
  { key: '{tarih}', label: 'Tarih' },
  { key: '{saat}', label: 'Saat' },
  { key: '{personel}', label: 'Personel' },
  { key: '{hizmet}', label: 'Hizmet' },
  { key: '{isletmeAdi}', label: 'Isletme Adi' },
  { key: '{anketLinki}', label: 'Anket Linki' },
];
