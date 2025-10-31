import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { sendWhatsAppMessage, generateReminderMessage } from '../../../../lib/whapi-client';

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
    if (appointment.reminderSent) {
      return NextResponse.json(
        { success: false, error: 'Hatırlatma mesajı zaten gönderilmiş' },
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
    const message = generateReminderMessage({
      customerName: appointment.customerName,
      date: appointment.date,
      time: appointment.time,
      staffName: appointment.staffName,
      businessName: settings.businessName,
      businessPhone: settings.businessPhone || '',
      businessAddress: settings.businessAddress || undefined,
    });

    // Send WhatsApp message
    const result = await sendWhatsAppMessage({
      to: customer.phone,
      body: message,
    });

    if (!result.sent) {
      return NextResponse.json(
        { success: false, error: result.error, details: result.details },
        { status: 500 }
      );
    }

    // Update appointment
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        reminderSent: true,
        reminderSentAt: new Date(),
      },
    });

    console.log(`✅ WhatsApp reminder sent for appointment ${appointmentId}`);

    return NextResponse.json({
      success: true,
      message: 'WhatsApp hatırlatma mesajı gönderildi',
      details: result.details,
    });

  } catch (error) {
    console.error('❌ Send reminder error:', error);
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

