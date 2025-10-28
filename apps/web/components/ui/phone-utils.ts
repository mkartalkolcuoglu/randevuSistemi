/**
 * Telefon numarası utility fonksiyonları
 * Standart format: 5xxxxxxxxx (10 haneli, 0 yok)
 * Display format: 5xx xxx xx xx
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
 * Çıktı: "555 123 45 67"
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  
  const normalized = normalizePhone(phone);
  
  // 5xx xxx xx xx formatı
  if (normalized.length >= 10) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 8)} ${normalized.slice(8, 10)}`;
  }
  
  // Henüz tam girilmemiş
  if (normalized.length > 6) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`;
  }
  
  if (normalized.length > 3) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
  }
  
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
export const PHONE_PLACEHOLDER = '5xx xxx xx xx';

/**
 * Telefon için max length (formatlanmış hali: "555 123 45 67" = 13 karakter)
 */
export const PHONE_MAX_LENGTH = 13;

