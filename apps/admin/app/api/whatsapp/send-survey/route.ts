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

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Randevu bulunamadi' },
        { status: 404 }
      );
    }

    if (appointment.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Randevu henuz tamamlanmamis' },
        { status: 400 }
      );
    }

    if (appointment.feedbackSent) {
      return NextResponse.json(
        { success: false, error: 'Anket zaten gonderilmis' },
        { status: 400 }
      );
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.feedback.findUnique({
      where: { appointmentId },
    });

    if (existingFeedback) {
      return NextResponse.json(
        { success: false, error: 'Bu randevu icin zaten degerlendirme yapilmis' },
        { status: 400 }
      );
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: appointment.customerId },
    });

    if (!customer?.phone) {
      return NextResponse.json(
        { success: false, error: 'Musterinin telefon numarasi yok' },
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
        { success: false, error: 'Isletme bulunamadi' },
        { status: 404 }
      );
    }

    // Get settings
    const settings = await prisma.settings.findUnique({
      where: { tenantId: appointment.tenantId },
    });

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Isletme ayarlari bulunamadi' },
        { status: 404 }
      );
    }

    // Parse notification settings
    let notifSettings: any = {};
    try {
      notifSettings = settings.notificationSettings ? JSON.parse(settings.notificationSettings) : {};
    } catch { /* use defaults */ }

    const surveyChannel = notifSettings.surveyChannel || 'whatsapp';

    if (surveyChannel === 'off') {
      return NextResponse.json(
        { success: false, error: 'Anket gonderimi kapali' },
        { status: 400 }
      );
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

    let whatsappSent = false;
    let smsSent = false;

    // Send WhatsApp
    if (surveyChannel === 'whatsapp' || surveyChannel === 'both') {
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
    if (surveyChannel === 'sms' || surveyChannel === 'both') {
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

    if (!whatsappSent && !smsSent) {
      return NextResponse.json(
        { success: false, error: 'Anket mesaji gonderilemedi' },
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

    const channelInfo = whatsappSent && smsSent ? 'WhatsApp + SMS' : whatsappSent ? 'WhatsApp' : 'SMS';
    console.log(`Anket gonderildi: ${appointmentId} (${channelInfo})`);

    return NextResponse.json({
      success: true,
      message: `Anket mesaji gonderildi (${channelInfo})`,
    });
  } catch (error) {
    console.error('Send survey error:', error);
    return NextResponse.json(
      { success: false, error: 'Anket gonderilirken hata olustu' },
      { status: 500 }
    );
  }
}
