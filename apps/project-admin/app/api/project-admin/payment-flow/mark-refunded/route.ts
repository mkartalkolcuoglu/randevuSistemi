import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { appointmentId } = await req.json();

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: 'Randevu ID gerekli' },
        { status: 400 }
      );
    }

    // Randevuyu bul ve iade i_aretini güncelle
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        refundCompleted: true,
        refundCompletedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error marking refund:', error);
    return NextResponse.json(
      { success: false, error: '0ade i_areti kaydedilemedi' },
      { status: 500 }
    );
  }
}
