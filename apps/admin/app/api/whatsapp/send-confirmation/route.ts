import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { sendWhatsAppMessage } from '../../../../lib/whapi-client';
import { formatPhoneForSMS } from '../../../../lib/netgsm-client';
import { getTemplate, renderTemplate } from '../../../../lib/message-templates';
import { sendExpoPushNotification } from '../../../../lib/expo-push';

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
    let confirmChannel = notifSettings.confirmationChannel || 'whatsapp';

    // Resolve 'default' to the defaultChannel setting
    if (confirmChannel === 'default') {
      confirmChannel = notifSettings.defaultChannel || 'whatsapp';
    }

    if (confirmChannel === 'off') {
      return NextResponse.json({
        success: false,
        error: 'Onay mesajı gönderimi kapalı',
      }, { status: 400 });
    }

    // Smart mode: choose channel based on customer preferences (Push > WhatsApp > SMS)
    let sendPush = false;
    let sendWhatsApp = false;
    let sendSms = false;

    if (confirmChannel === 'smart') {
      if (customer.expoPushToken) {
        sendPush = true;
      } else if (customer.whatsappNotifications !== false) {
        sendWhatsApp = true;
      } else if (customer.smsNotifications !== false) {
        sendSms = true;
      } else {
        console.log(`⏭️ Customer ${customer.firstName} opted out of all notifications`);
        return NextResponse.json({ success: false, error: 'Müşteri tüm bildirim kanallarını kapattı' }, { status: 400 });
      }
    } else {
      sendWhatsApp = confirmChannel === 'whatsapp' || confirmChannel === 'both';
      sendSms = confirmChannel === 'sms' || confirmChannel === 'both';
    }

    // Respect customer notification preferences
    if (sendWhatsApp && customer.whatsappNotifications === false) {
      console.log(`⏭️ Customer opted out of WhatsApp, skipping`);
      sendWhatsApp = false;
    }
    if (sendSms && customer.smsNotifications === false) {
      console.log(`⏭️ Customer opted out of SMS, skipping`);
      sendSms = false;
    }

    if (!sendWhatsApp && !sendSms) {
      return NextResponse.json({ success: false, error: 'Müşteri bildirim almak istemiyor' }, { status: 400 });
    }

    let pushSent = false;
    let whatsappSent = false;
    let smsSent = false;

    // Send Push Notification (priority in smart mode)
    if (sendPush && customer.expoPushToken) {
      const pushResult = await sendExpoPushNotification(
        customer.expoPushToken,
        `Randevu Onayı - ${settings.businessName || 'Randevu'}`,
        `${appointment.date} ${appointment.time} tarihli ${appointment.serviceName} randevunuz onaylandı.`,
        { type: 'confirmation', appointmentId: appointment.id }
      );
      pushSent = pushResult.success;

      // If push failed due to invalid token, clear it and fallback
      if (!pushSent) {
        if (pushResult.invalidToken) {
          await prisma.customer.update({ where: { id: customer.id }, data: { expoPushToken: null } });
        }
        // Fallback to WhatsApp > SMS
        if (customer.whatsappNotifications !== false) {
          sendWhatsApp = true;
        } else if (customer.smsNotifications !== false) {
          sendSms = true;
        }
      }
    }

    // Send WhatsApp
    if (sendWhatsApp) {
      const result = await sendWhatsAppMessage({
        to: customer.phone,
        body: whatsappMessage,
      });
      whatsappSent = result.sent;
      if (!result.sent) {
        console.error('❌ WhatsApp send failed:', result.error);
      }
    }

    // Send SMS
    if (sendSms) {
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

    if (!pushSent && !whatsappSent && !smsSent) {
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

    const channelInfo = pushSent ? 'Push' : whatsappSent && smsSent ? 'WhatsApp + SMS' : whatsappSent ? 'WhatsApp' : 'SMS';
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

