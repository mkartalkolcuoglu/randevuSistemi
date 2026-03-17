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

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Randevu bulunamadı' },
        { status: 404 }
      );
    }

    if (appointment.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Randevu henüz tamamlanmamış' },
        { status: 400 }
      );
    }

    if (appointment.feedbackSent) {
      return NextResponse.json(
        { success: false, error: 'Anket zaten gönderilmiş' },
        { status: 400 }
      );
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.feedback.findUnique({
      where: { appointmentId },
    });

    if (existingFeedback) {
      return NextResponse.json(
        { success: false, error: 'Bu randevu için zaten değerlendirme yapılmış' },
        { status: 400 }
      );
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: appointment.customerId },
    });

    if (!customer?.phone) {
      return NextResponse.json(
        { success: false, error: 'Müşterinin telefon numarası yok' },
        { status: 400 }
      );
    }

    // Get tenant for slug
    const tenant = await prisma.tenant.findUnique({
      where: { id: appointment.tenantId },
      select: { slug: true, businessName: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'İşletme bulunamadı' },
        { status: 404 }
      );
    }

    // Get settings
    const settings = await prisma.settings.findUnique({
      where: { tenantId: appointment.tenantId },
    });

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'İşletme ayarları bulunamadı' },
        { status: 404 }
      );
    }

    // Parse notification settings
    let notifSettings: any = {};
    try {
      notifSettings = settings.notificationSettings ? JSON.parse(settings.notificationSettings) : {};
    } catch { /* use defaults */ }

    let surveyChannel = notifSettings.surveyChannel || 'whatsapp';

    // Resolve 'default' to the defaultChannel setting
    if (surveyChannel === 'default') {
      surveyChannel = notifSettings.defaultChannel || 'whatsapp';
    }

    if (surveyChannel === 'off') {
      return NextResponse.json(
        { success: false, error: 'Anket gönderimi kapalı' },
        { status: 400 }
      );
    }

    // Smart mode: choose channel based on customer preferences (Push > WhatsApp > SMS)
    let sendPush = false;
    let sendWhatsApp = false;
    let sendSms = false;

    if (surveyChannel === 'smart') {
      if (customer.expoPushToken) {
        sendPush = true;
      } else if (customer.whatsappNotifications !== false) {
        sendWhatsApp = true;
      } else if (customer.smsNotifications !== false) {
        sendSms = true;
      } else {
        return NextResponse.json({ success: false, error: 'Müşteri tüm bildirim kanallarını kapattı' }, { status: 400 });
      }
    } else {
      sendWhatsApp = surveyChannel === 'whatsapp' || surveyChannel === 'both';
      sendSms = surveyChannel === 'sms' || surveyChannel === 'both';
    }

    // Build survey link
    const webDomain = process.env.NEXT_PUBLIC_WEB_URL || 'https://netrandevu.com';
    const surveyLink = `${webDomain}/${tenant.slug}/degerlendirme/${appointmentId}`;

    // Template variables
    const templateVars: Record<string, string> = {
      musteriAdi: appointment.customerName,
      tarih: appointment.date,
      saat: appointment.time,
      personel: appointment.staffName,
      hizmet: appointment.serviceName,
      isletmeAdi: settings.businessName || tenant.businessName,
      anketLinki: surveyLink,
    };

    let pushSent = false;
    let whatsappSent = false;
    let smsSent = false;

    // Send Push Notification (priority in smart mode)
    if (sendPush && customer.expoPushToken) {
      const pushResult = await sendExpoPushNotification(
        customer.expoPushToken,
        `Memnuniyet Anketi - ${tenant.businessName}`,
        `${appointment.customerName}, randevunuzu değerlendirin!`,
        { type: 'survey', appointmentId, surveyLink }
      );
      pushSent = pushResult.success;

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
      const template = getTemplate(settings.messageTemplates, 'whatsappSurvey');
      const message = renderTemplate(template, templateVars);
      const result = await sendWhatsAppMessage({
        to: customer.phone,
        body: message,
      });
      whatsappSent = result.sent;
      if (!result.sent) {
        console.error('WhatsApp survey send failed:', result.error);
      }
    }

    // Send SMS
    if (sendSms) {
      const template = getTemplate(settings.messageTemplates, 'smsSurvey');
      const message = renderTemplate(template, templateVars);
      const smsPhone = formatPhoneForSMS(customer.phone);
      const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.netrandevu.com';
      const smsResponse = await fetch(`${adminUrl}/api/netgsm/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: smsPhone, message }),
      });
      const smsResult = await smsResponse.json();
      smsSent = smsResult.success;
      if (!smsSent) {
        console.error('SMS survey send failed:', smsResult.error);
      }
    }

    if (!pushSent && !whatsappSent && !smsSent) {
      return NextResponse.json(
        { success: false, error: 'Anket mesajı gönderilemedi' },
        { status: 500 }
      );
    }

    // Update appointment
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        feedbackSent: true,
        feedbackSentAt: new Date(),
      },
    });

    const channelInfo = pushSent ? 'Push' : whatsappSent && smsSent ? 'WhatsApp + SMS' : whatsappSent ? 'WhatsApp' : 'SMS';
    console.log(`Anket gönderildi: ${appointmentId} (${channelInfo})`);

    return NextResponse.json({
      success: true,
      message: `Anket mesajı gönderildi (${channelInfo})`,
    });
  } catch (error) {
    console.error('Send survey error:', error);
    return NextResponse.json(
      { success: false, error: 'Anket gönderilirken hata oluştu' },
      { status: 500 }
    );
  }
}
