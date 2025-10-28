/**
 * Telefon numarası utility fonksiyonları
 * Standart format: 5xxxxxxxxx (10 haneli, 0 yok)
 * Display format: 555 555 55 55 (3-3-2-2)
 */

/**
 * Telefonu normalize et (database için)
 * Girdi: "0555 123 45 67", "555 123 45 67", "5551234567"
 * Çıktı: "5551234567"
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  // Sadece rakamları al
  const digits = phone.replace(/\D/g, '');
  
  // Başındaki 0'ı kaldır
  const withoutZero = digits.startsWith('0') ? digits.slice(1) : digits;
  
  // İlk 10 haneyi al (5xxxxxxxxx)
  return withoutZero.slice(0, 10);
}

/**
 * Telefonu formatla (UI için)
 * Girdi: "5551234567"
 * Çıktı: "555 555 55 55"
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  
  const normalized = normalizePhone(phone);
  
  // 555 555 55 55 formatı (3-3-2-2)
  if (normalized.length >= 10) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 8)} ${normalized.slice(8, 10)}`;
  }
  
  // Henüz tam girilmemiş - kademeli format
  if (normalized.length > 8) {
    // 8+ karakter: "555 555 55 5"
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 8)} ${normalized.slice(8)}`;
  }
  
  if (normalized.length > 6) {
    // 7-8 karakter: "555 555 55"
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`;
  }
  
  if (normalized.length > 3) {
    // 4-6 karakter: "555 555"
    return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
  }
  
  // 1-3 karakter: "555"
  return normalized;
}

/**
 * Telefon input'u için onChange handler
 * Real-time formatting yapar
 */
export function handlePhoneInput(value: string): string {
  return formatPhone(value);
}

/**
 * Telefon numarasını validate et
 * 5 ile başlamalı ve 10 haneli olmalı
 */
export function validatePhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^5\d{9}$/.test(normalized);
}

/**
 * Telefon için placeholder
 */
export const PHONE_PLACEHOLDER = '555 555 55 55';

/**
 * Telefon için max length (formatlanmış hali: "555 555 55 55" = 13 karakter + buffer)
 */
export const PHONE_MAX_LENGTH = 15;

