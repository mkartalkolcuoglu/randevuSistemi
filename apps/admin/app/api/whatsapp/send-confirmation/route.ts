import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { sendWhatsAppMessage, generateConfirmationMessage } from '../../../../lib/whapi-client';

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
    const isPackage = appointment.paymentStatus === 'package_used';

    const message = generateConfirmationMessage({
      customerName: appointment.customerName,
      date: appointment.date,
      time: appointment.time,
      staffName: appointment.staffName,
      serviceName: appointment.serviceName,
      price: appointment.price || undefined,
      businessName: settings.businessName,
      businessPhone: settings.businessPhone || '',
      businessAddress: settings.businessAddress || undefined,
      isPackage, // Paket kullanımı mı?
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
        whatsappSent: true,
        whatsappSentAt: new Date(),
      },
    });

    console.log(`✅ WhatsApp confirmation sent for appointment ${appointmentId}`);

    return NextResponse.json({
      success: true,
      message: 'WhatsApp onay mesajı gönderildi',
      details: result.details,
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

