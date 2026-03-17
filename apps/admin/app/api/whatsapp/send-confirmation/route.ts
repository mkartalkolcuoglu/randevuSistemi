import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { sendWhatsAppMessage } from '../../../../lib/whapi-client';
import { formatPhoneForSMS } from '../../../../lib/netgsm-client';
import { getTemplate, renderTemplate } from '../../../../lib/message-templates';

export async function POST(request: NextRequest) {
  try {
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: 'Randevu ID gerekli' },
        { status: 400 }
      );
    }

    // Get appointment details
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Randevu bulunamadı' },
        { status: 404 }
      );
    }

    // Check if already sent
    if (appointment.whatsappSent) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp mesajı zaten gönderilmiş' },
        { status: 400 }
      );
    }

    // Get customer details
    const customer = await prisma.customer.findUnique({
      where: { id: appointment.customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    // Check if customer wants WhatsApp notifications
    if (!customer.whatsappNotifications) {
      console.log(`⏭️ Customer ${customer.firstName} ${customer.lastName} opted out of WhatsApp notifications`);
      return NextResponse.json(
        { success: false, error: 'Müşteri WhatsApp bildirimi almak istemiyor' },
        { status: 400 }
      );
    }

    // Check if customer has phone number
    if (!customer.phone) {
      return NextResponse.json(
        { success: false, error: 'Müşterinin telefon numarası yok' },
        { status: 400 }
      );
    }

    // Get tenant/business details
    const settings = await prisma.settings.findUnique({
      where: { tenantId: appointment.tenantId },
    });

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'İşletme ayarları bulunamadı' },
        { status: 404 }
      );
    }

    // Generate message
    // Check if appointment uses package
    // Paket kullanımını hem paymentStatus hem de paymentType'dan kontrol et
    const isPackage = appointment.paymentStatus === 'package_used' || appointment.paymentType === 'package';

    console.log('📦 Package check:', {
      appointmentId: appointment.id,
      paymentStatus: appointment.paymentStatus,
      paymentType: appointment.paymentType,
      isPackage: isPackage,
      price: appointment.price
    });

    // Build template variables
    const priceText = isPackage
      ? '📦 Paket kullanımı'
      : appointment.price
        ? `${appointment.price} TL`
        : '';

    const templateVars: Record<string, string> = {
      musteriAdi: appointment.customerName,
      tarih: appointment.date,
      saat: appointment.time,
      personel: appointment.staffName,
      hizmet: appointment.serviceName,
      ucret: priceText,
      isletmeAdi: settings.businessName || 'Randevu',
      isletmeTelefon: settings.businessPhone || '',
      isletmeAdres: settings.businessAddress || '',
    };

    // Prepare separate messages for WhatsApp and SMS
    const whatsappTemplate = getTemplate(settings.messageTemplates, 'whatsappConfirmation');
    const whatsappMessage = renderTemplate(whatsappTemplate, templateVars);

    const smsTemplate = getTemplate(settings.messageTemplates, 'smsConfirmation');
    const smsMessage = renderTemplate(smsTemplate, templateVars);

    // Check channel preference
    let notifSettings: any = {};
    try {
      notifSettings = settings.notificationSettings ? JSON.parse(settings.notificationSettings) : {};
    } catch { /* use defaults */ }
    const confirmChannel = notifSettings.confirmationChannel || 'whatsapp';

    if (confirmChannel === 'off') {
      return NextResponse.json({
        success: false,
        error: 'Onay mesajı gönderimi kapalı',
      }, { status: 400 });
    }

    let whatsappSent = false;
    let smsSent = false;

    // Send WhatsApp if channel includes it
    if (confirmChannel === 'whatsapp' || confirmChannel === 'both') {
      const result = await sendWhatsAppMessage({
        to: customer.phone,
        body: whatsappMessage,
      });
      whatsappSent = result.sent;
      if (!result.sent) {
        console.error('❌ WhatsApp send failed:', result.error);
      }
    }

    // Send SMS if channel includes it
    if (confirmChannel === 'sms' || confirmChannel === 'both') {
      const smsPhone = formatPhoneForSMS(customer.phone);
      const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.netrandevu.com'}/api/netgsm/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: smsPhone, message: smsMessage })
      });
      const smsResult = await smsResponse.json();
      smsSent = smsResult.success;
      if (!smsSent) {
        console.error('❌ SMS send failed:', smsResult.error);
      }
    }

    if (!whatsappSent && !smsSent) {
      return NextResponse.json(
        { success: false, error: 'Mesaj gönderilemedi', details: `Kanal: ${confirmChannel}` },
        { status: 500 }
      );
    }

    // Update appointment
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        whatsappSent: true,
        whatsappSentAt: new Date(),
      },
    });

    const channelInfo = whatsappSent && smsSent ? 'WhatsApp + SMS' : whatsappSent ? 'WhatsApp' : 'SMS';
    console.log(`✅ Confirmation sent for appointment ${appointmentId} via ${channelInfo}`);

    return NextResponse.json({
      success: true,
      message: `Onay mesajı gönderildi (${channelInfo})`,
    });

  } catch (error) {
    console.error('❌ Send confirmation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'WhatsApp mesajı gönderilirken hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

