/**
 * NetGSM SMS API Client
 * Documentation: https://www.netgsm.com.tr/dokuman/
 */

const NETGSM_API_URL = 'https://api.netgsm.com.tr/sms/send/xml';
const NETGSM_USERCODE = process.env.NETGSM_USERCODE || '8503036723';
const NETGSM_PASSWORD = process.env.NETGSM_PASSWORD || '1A765-A';
const NETGSM_MSGHEADER = process.env.NETGSM_MSGHEADER || ''; // Boş ise numara ile gönderilir

interface SendSmsParams {
  to: string; // Recipient phone number (with country code, e.g., 905551234567)
  message: string; // SMS message text
}

interface SendSmsResponse {
  success: boolean;
  bulkId?: string; // NetGSM'den dönen bulk ID (başarılı ise)
  message?: string;
  error?: string;
  details?: any;
}

/**
 * Format phone number for SMS
 * Removes all non-numeric characters and ensures proper format
 */
export function formatPhoneForSMS(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');

  // If starts with 0, remove it (Turkish format)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // If doesn't start with country code, add Turkish code (90)
  if (!cleaned.startsWith('90')) {
    cleaned = '90' + cleaned;
  }

  return cleaned;
}

/**
 * Generate 6-digit OTP code
 */
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send SMS via NetGSM
 */
export async function sendSMS(params: SendSmsParams): Promise<SendSmsResponse> {
  try {
    const formattedPhone = formatPhoneForSMS(params.to);

    console.log('📱 Sending SMS:', {
      to: formattedPhone,
      messageLength: params.message.length
    });

    // NetGSM XML format
    const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<mainbody>
  <header>
    <company dil="TR">Netgsm</company>
    <usercode>${NETGSM_USERCODE}</usercode>
    <password>${NETGSM_PASSWORD}</password>
    <type>1:n</type>
    <msgheader>${NETGSM_MSGHEADER}</msgheader>
  </header>
  <body>
    <msg><![CDATA[${params.message}]]></msg>
    <no>${formattedPhone}</no>
  </body>
</mainbody>`;

    const response = await fetch(NETGSM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xmlBody,
    });

    const responseText = await response.text();
    console.log('📨 NetGSM Response:', responseText);

    // NetGSM Response Codes:
    // 00 veya 01 = Başarılı (+ bulk ID)
    // 20 = Mesaj metninde hata
    // 30 = Geçersiz kullanıcı adı/şifre
    // 40 = Mesaj başlığı (header) hatalı
    // 70 = Hatalı sorgulama

    const lines = responseText.trim().split(' ');
    const code = lines[0];
    const bulkId = lines[1];

    if (code === '00' || code === '01') {
      console.log('✅ SMS sent successfully. Bulk ID:', bulkId);
      return {
        success: true,
        bulkId: bulkId,
        message: 'SMS başarıyla gönderildi'
      };
    }

    // Error handling
    const errorMessages: Record<string, string> = {
      '20': 'Mesaj metninde hata var',
      '30': 'Geçersiz kullanıcı adı veya şifre',
      '40': 'Mesaj başlığı (header) hatalı',
      '50': 'Abone hesabınız ile API erişim izniz bulunmamaktadır',
      '51': 'Uygun olmayan tarih formatı',
      '70': 'Hatalı sorgulama',
      '85': 'Geçersiz karakter',
    };

    const errorMessage = errorMessages[code] || `Bilinmeyen hata kodu: ${code}`;

    console.error('❌ NetGSM error:', { code, errorMessage });

    return {
      success: false,
      error: errorMessage,
      details: { code, response: responseText }
    };

  } catch (error) {
    console.error('❌ SMS send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      details: error
    };
  }
}

/**
 * Send OTP SMS
 * Generates and sends a 6-digit verification code
 */
export async function sendOtpSMS(params: {
  to: string;
  code: string;
  purpose?: string;
}): Promise<SendSmsResponse> {
  const { to, code, purpose = 'randevu sorgulama' } = params;

  const message = `NetRandevu ${purpose} kodunuz: ${code}. 2 dakika gecerlidir.`;

  return sendSMS({ to, message });
}

/**
 * Generate OTP message text
 */
export function generateOtpMessage(code: string, purpose: string = 'randevu sorgulama'): string {
  return `NetRandevu ${purpose} kodunuz: ${code}. 2 dakika gecerlidir.`;
}
