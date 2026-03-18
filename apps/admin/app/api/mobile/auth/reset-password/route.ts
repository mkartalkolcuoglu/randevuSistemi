import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { username, code, newPassword } = await request.json();

    if (!username?.trim() || !code?.trim() || !newPassword?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Tüm alanlar gerekli' },
        { status: 400 }
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { success: false, message: 'Şifre en az 4 karakter olmalı' },
        { status: 400 }
      );
    }

    // Find tenant by username
    const tenant = await prisma.tenant.findFirst({
      where: { username: username.trim() },
      select: { id: true, phone: true },
    });

    if (!tenant || !tenant.phone) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Format phone
    let formattedPhone = tenant.phone.replace(/\s/g, '').replace(/^0/, '');
    if (!formattedPhone.startsWith('90')) {
      formattedPhone = '90' + formattedPhone;
    }

    // Verify OTP
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        phone: formattedPhone,
        code: code.trim(),
        purpose: 'password_reset',
        expiresAt: { gte: new Date() },
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: 'Doğrulama kodu geçersiz veya süresi dolmuş' },
        { status: 400 }
      );
    }

    // Update tenant password
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { password: newPassword.trim() },
    });

    // Delete used OTP
    await prisma.otpVerification.delete({
      where: { id: otpRecord.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Şifreniz başarıyla güncellendi',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
