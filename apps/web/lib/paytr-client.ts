/**
 * PayTR iFrame API Client
 * Dokümantasyon: https://dev.paytr.com/en/iframe-api
 */

import crypto from 'crypto';

// PayTR API Configuration
const PAYTR_API_URL = 'https://www.paytr.com/odeme/api/get-token';
const PAYTR_MERCHANT_ID = process.env.PAYTR_MERCHANT_ID || '636960';
const PAYTR_MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY || 'rL2TjcA26mJbEgLE';
const PAYTR_MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT || 'dSDLbyHHk7Mm2xnt';

// Test mode: '1' for test, '0' for production
const PAYTR_TEST_MODE = process.env.PAYTR_TEST_MODE || '1';

/**
 * Sepet ürünü arayüzü
 */
export interface BasketItem {
  name: string;      // Ürün/Hizmet adı
  price: number;     // Birim fiyat (TL cinsinden, örn: 34.56)
  quantity: number;  // Miktar
}

/**
 * Ödeme başlatma parametreleri
 */
export interface PaymentInitiateParams {
  merchantOid: string;           // Sipariş numarası (unique, max 64 char)
  userIp: string;                // Kullanıcı IP adresi
  email: string;                 // Müşteri email (max 100 char)
  amount: number;                // Toplam tutar (TL cinsinden, örn: 34.56)
  basket: BasketItem[];          // Sepet ürünleri

  // Opsiyonel parametreler
  currency?: string;             // TL, EUR, USD, GBP, RUB (default: TL)
  noInstallment?: number;        // Taksit yapılmasın mı? 1: Evet, 0: Hayır
  maxInstallment?: number;       // Maksimum taksit sayısı (2-12)

  // Callback URLs
  successUrl?: string;           // Başarılı ödeme sonrası yönlendirme
  failUrl?: string;              // Başarısız ödeme sonrası yönlendirme
}

/**
 * PayTR token response
 */
export interface PayTRTokenResponse {
  status: 'success' | 'failed';
  token?: string;
  reason?: string;
}

/**
 * PayTR callback parametreleri
 */
export interface PayTRCallbackParams {
  merchant_oid: string;
  status: 'success' | 'failed';
  total_amount: string;          // PayTR format (kuruş cinsinden)
  hash: string;
  payment_type?: 'card' | 'eft';
  failed_reason_code?: string;
  failed_reason_msg?: string;
  test_mode?: string;
  payment_amount?: string;
  currency?: string;
  merchant_id?: string;
}

/**
 * Sepet dizisini PayTR formatında base64 encode eder
 *
 * @param basket Sepet ürünleri
 * @returns Base64 encoded JSON string
 */
export function encodeBasket(basket: BasketItem[]): string {
  const formattedBasket = basket.map(item => [
    item.name,
    // PayTR fiyatları kuruş cinsinden bekler (34.56 TL = 3456 kuruş)
    Math.round(item.price * 100).toString(),
    item.quantity.toString()
  ]);

  const basketJson = JSON.stringify(formattedBasket);
  return Buffer.from(basketJson, 'utf-8').toString('base64');
}

/**
 * PayTR token oluşturmak için hash üretir
 *
 * Hash Format: base64_encode(hash_hmac('sha256', hash_str + merchant_salt, merchant_key, true))
 *
 * @param params Hash için gerekli parametreler
 * @returns Base64 encoded hash string
 */
export function generatePayTRToken(params: {
  merchantId: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmount: number;  // Kuruş cinsinden (3456 = 34.56 TL)
  userBasket: string;     // Base64 encoded basket
  noInstallment: number;
  maxInstallment: number;
  currency: string;
  testMode: string;
  merchantSalt: string;
  merchantKey: string;
}): string {
  // Hash string oluştur (sıralama önemli!)
  const hashStr =
    params.merchantId +
    params.userIp +
    params.merchantOid +
    params.email +
    params.paymentAmount.toString() +
    params.userBasket +
    params.noInstallment.toString() +
    params.maxInstallment.toString() +
    params.currency +
    params.testMode;

  // Hash + Salt
  const hashWithSalt = hashStr + params.merchantSalt;

  // HMAC-SHA256 hash üret
  const hash = crypto
    .createHmac('sha256', params.merchantKey)
    .update(hashWithSalt)
    .digest();

  // Base64 encode
  return hash.toString('base64');
}

/**
 * PayTR callback'ten gelen hash'i doğrular
 *
 * @param merchantOid Sipariş numarası
 * @param status Ödeme durumu ('success' veya 'failed')
 * @param totalAmount Toplam tutar (kuruş cinsinden)
 * @param receivedHash PayTR'dan gelen hash
 * @returns true ise hash geçerli, false ise geçersiz
 */
export function validateCallbackHash(
  merchantOid: string,
  status: string,
  totalAmount: string,
  receivedHash: string
): boolean {
  // Hash string oluştur (sıralama önemli!)
  const hashStr = merchantOid + PAYTR_MERCHANT_SALT + status + totalAmount;

  // HMAC-SHA256 hash üret
  const calculatedHash = crypto
    .createHmac('sha256', PAYTR_MERCHANT_KEY)
    .update(hashStr)
    .digest('base64');

  console.log('🔐 [PAYTR] Hash Validation:', {
    merchantOid,
    status,
    totalAmount,
    receivedHash: receivedHash.substring(0, 20) + '...',
    calculatedHash: calculatedHash.substring(0, 20) + '...',
    isValid: calculatedHash === receivedHash
  });

  return calculatedHash === receivedHash;
}

/**
 * PayTR'dan iframe token alır
 *
 * @param params Ödeme parametreleri
 * @returns PayTR token response
 */
export async function initiatePayment(
  params: PaymentInitiateParams
): Promise<PayTRTokenResponse> {
  try {
    console.log('💳 [PAYTR] Initiating payment:', {
      merchantOid: params.merchantOid,
      email: params.email,
      amount: params.amount,
      basketItems: params.basket.length
    });

    // Tutarı kuruş cinsine çevir (34.56 TL -> 3456)
    const paymentAmount = Math.round(params.amount * 100);

    // Sepeti encode et
    const userBasket = encodeBasket(params.basket);

    // Varsayılan değerler
    const currency = params.currency || 'TL';
    const noInstallment = params.noInstallment ?? 0; // 0: Taksit var, 1: Taksit yok
    const maxInstallment = params.maxInstallment || 0; // 0: Sınırsız

    // PayTR token üret
    const paytrToken = generatePayTRToken({
      merchantId: PAYTR_MERCHANT_ID,
      userIp: params.userIp,
      merchantOid: params.merchantOid,
      email: params.email,
      paymentAmount,
      userBasket,
      noInstallment,
      maxInstallment,
      currency,
      testMode: PAYTR_TEST_MODE,
      merchantSalt: PAYTR_MERCHANT_SALT,
      merchantKey: PAYTR_MERCHANT_KEY
    });

    // PayTR API'ye POST request
    const formData = new URLSearchParams({
      merchant_id: PAYTR_MERCHANT_ID,
      user_ip: params.userIp,
      merchant_oid: params.merchantOid,
      email: params.email,
      payment_amount: paymentAmount.toString(),
      paytr_token: paytrToken,
      user_basket: userBasket,
      debug_on: PAYTR_TEST_MODE, // Test modunda hata detayları
      no_installment: noInstallment.toString(),
      max_installment: maxInstallment.toString(),
      user_name: params.email.split('@')[0], // Email'den ad çıkar
      user_address: 'Türkiye',
      user_phone: '5555555555',
      merchant_ok_url: params.successUrl || `${process.env.NEXT_PUBLIC_WEB_URL || 'https://netrandevu.com'}/payment/success`,
      merchant_fail_url: params.failUrl || `${process.env.NEXT_PUBLIC_WEB_URL || 'https://netrandevu.com'}/payment/failed`,
      timeout_limit: '30',
      currency: currency,
      test_mode: PAYTR_TEST_MODE
    });

    console.log('🚀 [PAYTR] Sending request to PayTR API...');

    const response = await fetch(PAYTR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const responseText = await response.text();
    console.log('📥 [PAYTR] Raw response:', responseText);

    let result: PayTRTokenResponse;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ [PAYTR] Failed to parse response:', e);
      return {
        status: 'failed',
        reason: 'Invalid response from PayTR: ' + responseText
      };
    }

    if (result.status === 'success' && result.token) {
      console.log('✅ [PAYTR] Token generated successfully');
      return result;
    } else {
      console.error('❌ [PAYTR] Token generation failed:', result.reason);
      return result;
    }

  } catch (error) {
    console.error('❌ [PAYTR] Error initiating payment:', error);
    return {
      status: 'failed',
      reason: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test için PayTR yapılandırmasını yazdırır
 */
export function logPayTRConfig() {
  console.log('🔧 [PAYTR] Configuration:', {
    merchantId: PAYTR_MERCHANT_ID,
    merchantKey: '***' + PAYTR_MERCHANT_KEY.slice(-4),
    merchantSalt: '***' + PAYTR_MERCHANT_SALT.slice(-4),
    testMode: PAYTR_TEST_MODE,
    apiUrl: PAYTR_API_URL
  });
}
