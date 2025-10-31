/**
 * Whapi.cloud WhatsApp API Client
 * Documentation: https://whapi.cloud/tr/docs
 */

const WHAPI_API_URL = 'https://gate.whapi.cloud';
const WHAPI_TOKEN = process.env.WHAPI_API_TOKEN || 'APX4yYY4LGzHPj9mombXeiZQREHRPTQD';
const WHAPI_PHONE = process.env.WHAPI_PHONE_NUMBER || '905365052512';

interface SendMessageParams {
  to: string; // Recipient phone number (with country code, e.g., 905551234567)
  body: string; // Message text
}

interface SendMessageResponse {
  sent: boolean;
  message?: string;
  error?: string;
  details?: any;
}

/**
 * Format phone number for WhatsApp
 * Removes all non-numeric characters and ensures proper format
 */
export function formatPhoneForWhatsApp(phone: string): string {
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
 * Send WhatsApp message via Whapi.cloud
 */
export async function sendWhatsAppMessage(params: SendMessageParams): Promise<SendMessageResponse> {
  try {
    const formattedPhone = formatPhoneForWhatsApp(params.to);
    
    console.log('📱 Sending WhatsApp message:', {
      to: formattedPhone,
      messageLength: params.body.length
    });

    const response = await fetch(`${WHAPI_API_URL}/messages/text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        typing_time: 0,
        to: formattedPhone,
        body: params.body,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Whapi error:', data);
      return {
        sent: false,
        error: data.message || 'WhatsApp mesajı gönderilemedi',
        details: data
      };
    }

    console.log('✅ WhatsApp message sent successfully:', data);
    
    return {
      sent: true,
      message: 'Mesaj başarıyla gönderildi',
      details: data
    };

  } catch (error) {
    console.error('❌ WhatsApp send error:', error);
    return {
      sent: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      details: error
    };
  }
}

/**
 * Generate appointment confirmation message
 */
export function generateConfirmationMessage(appointment: {
  customerName: string;
  date: string;
  time: string;
  staffName: string;
  serviceName: string;
  price?: number;
  businessName: string;
  businessPhone: string;
  businessAddress?: string;
}): string {
  const { customerName, date, time, staffName, serviceName, price, businessName, businessPhone, businessAddress } = appointment;
  
  const firstName = customerName.split(' ')[0];
  
  let message = `Merhaba ${firstName},\n\n`;
  message += `Randevunuz başarıyla oluşturuldu! 🎉\n\n`;
  message += `📅 *Tarih:* ${date}\n`;
  message += `🕐 *Saat:* ${time}\n`;
  message += `👤 *Personel:* ${staffName}\n`;
  message += `✂️ *Hizmet:* ${serviceName}\n`;
  
  if (price) {
    message += `💰 *Ücret:* ${price} TL\n`;
  }
  
  if (businessAddress) {
    message += `📍 *Adres:* ${businessAddress}\n`;
  }
  
  message += `\nGörüşmek üzere! 😊\n\n`;
  message += `*${businessName}*\n`;
  message += `📞 ${businessPhone}`;
  
  return message;
}

/**
 * Generate appointment reminder message
 */
export function generateReminderMessage(appointment: {
  customerName: string;
  date: string;
  time: string;
  staffName: string;
  businessName: string;
  businessPhone: string;
  businessAddress?: string;
}): string {
  const { customerName, date, time, staffName, businessName, businessPhone, businessAddress } = appointment;
  
  const firstName = customerName.split(' ')[0];
  
  let message = `Merhaba ${firstName},\n\n`;
  message += `⏰ *Randevunuza 2 saat kaldı!*\n\n`;
  message += `📅 *Tarih:* ${date}\n`;
  message += `🕐 *Saat:* ${time}\n`;
  message += `👤 *Personel:* ${staffName}\n`;
  
  if (businessAddress) {
    message += `📍 *Adres:* ${businessAddress}\n`;
  }
  
  message += `\nSizi bekliyoruz! 😊\n\n`;
  message += `*${businessName}*\n`;
  message += `📞 ${businessPhone}`;
  
  return message;
}

/**
 * Generate customer response message
 * For when customer replies to messages
 */
export function generateCustomerResponseMessage(businessName: string, businessPhone: string): string {
  let message = `Merhaba! 👋\n\n`;
  message += `Randevunuzla ilgili değişiklik yapmak için lütfen bizimle iletişime geçin:\n\n`;
  message += `*${businessName}*\n`;
  message += `📞 ${businessPhone}\n\n`;
  message += `Size yardımcı olmaktan mutluluk duyarız! 😊`;
  
  return message;
}

