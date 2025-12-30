import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Müşteri girişi için OTP doğrulama
 * Müşteri tenant'a bağlı değildir - tüm işletmelerdeki randevularını görebilir
 */
export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { success: false, message: 'Telefon numarası ve doğrulama kodu gerekli' },
        { status: 400 }
      );
    }

    // Format phone number
    let formattedPhone = phone.replace(/\s/g, '').replace(/^0/, '');
    if (!formattedPhone.startsWith('90')) {
      formattedPhone = '90' + formattedPhone;
    }

    console.log('📱 [CUSTOMER] Verify OTP - Phone:', formattedPhone);

    // Find OTP record
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        phone: formattedPhone,
        code,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz veya süresi dolmuş doğrulama kodu' },
        { status: 400 }
      );
    }

    // Delete used OTP
    await prisma.otpVerification.delete({
      where: { id: otpRecord.id },
    });

    // Find customer by phone (across all tenants)
    const phoneLastDigits = phone.replace(/^0/, '').slice(-10);

    // First get customers without tenant relation to avoid null tenant error
    const customersRaw = await prisma.customer.findMany({
      where: {
        phone: {
          contains: phoneLastDigits,
        },
      },
      select: {
        id: true,
        tenantId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    console.log('📱 [CUSTOMER] Found customers (raw):', customersRaw.length);

    // Kayıtlı müşteri yoksa, yeni müşteri olarak işaretle
    if (customersRaw.length === 0) {
      console.log('📱 [CUSTOMER] New customer - no existing records');

      // Yeni müşteri için geçici token oluştur
      const token = jwt.sign(
        {
          phone: formattedPhone,
          userType: 'customer',
          isNewCustomer: true,
          // customerId yok - henüz kayıt olmadı
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Yeni müşteri için user objesi
      const newUser = {
        id: null,
        phone: formattedPhone,
        userType: 'customer' as const,
        firstName: null,
        lastName: null,
        email: null,
        tenantId: null,
        tenantName: null,
        isNewCustomer: true,
      };

      return NextResponse.json({
        success: true,
        message: 'Yeni müşteri kaydı gerekiyor',
        user: newUser,
        token,
        isNewCustomer: true,
      });
    }

    // Get valid tenants for these customers
    const tenantIds = [...new Set(customersRaw.map(c => c.tenantId))];
    const validTenants = await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, businessName: true, slug: true },
    });
    const validTenantIds = new Set(validTenants.map(t => t.id));
    const tenantsById = new Map(validTenants.map(t => [t.id, t]));

    // Filter customers with valid tenants
    const customers = customersRaw
      .filter(c => validTenantIds.has(c.tenantId))
      .map(c => ({
        ...c,
        tenant: tenantsById.get(c.tenantId)!,
      }));

    console.log('📱 [CUSTOMER] Found customers (with valid tenants):', customers.length);

    // Müşteri kayıtları var ama tüm tenant'lar silinmiş - yeni müşteri gibi davran
    if (customers.length === 0) {
      console.log('📱 [CUSTOMER] Customer records exist but all tenants deleted - treating as new customer');

      const token = jwt.sign(
        {
          phone: formattedPhone,
          userType: 'customer',
          isNewCustomer: true,
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      const newUser = {
        id: null,
        phone: formattedPhone,
        userType: 'customer' as const,
        firstName: customersRaw[0]?.firstName || null,
        lastName: customersRaw[0]?.lastName || null,
        email: customersRaw[0]?.email || null,
        tenantId: null,
        tenantName: null,
        isNewCustomer: true,
      };

      return NextResponse.json({
        success: true,
        message: 'Yeni müşteri kaydı gerekiyor',
        user: newUser,
        token,
        isNewCustomer: true,
      });
    }

    // Use first customer's info (name, email)
    const firstCustomer = customers[0];

    // Create user object - NO tenantId for customers
    const user = {
      id: firstCustomer.id,
      phone: formattedPhone,
      userType: 'customer' as const,
      firstName: firstCustomer.firstName,
      lastName: firstCustomer.lastName,
      email: firstCustomer.email,
      // Customer is not bound to a single tenant
      tenantId: null,
      tenantName: null,
    };

    // Generate JWT token - customer token does NOT have tenantId
    const token = jwt.sign(
      {
        phone: formattedPhone,
        userType: 'customer',
        customerId: firstCustomer.id,
        // No tenantId - customer can see all their appointments across tenants
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return list of tenants where customer has records (for info only)
    const customerTenants = customers.map(c => ({
      id: c.tenant.id,
      businessName: c.tenant.businessName,
      slug: c.tenant.slug,
      customerId: c.id,
    }));

    console.log('📱 [CUSTOMER] Login successful, tenants:', customerTenants.length);

    return NextResponse.json({
      success: true,
      message: 'Giriş başarılı',
      user,
      token,
      customerTenants, // Info about which tenants customer is registered with
    });

  } catch (error: any) {
    console.error('❌ [CUSTOMER] Verify OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
