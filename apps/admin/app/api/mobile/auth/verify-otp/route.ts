import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

    console.log('📱 Verify OTP - Input phone:', phone);
    console.log('📱 Verify OTP - Formatted phone:', formattedPhone);
    console.log('📱 Verify OTP - Code:', code);

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

    console.log('📱 Verify OTP - OTP Record found:', otpRecord ? 'Yes' : 'No');

    // For debugging, also check if any OTP exists for this phone
    if (!otpRecord) {
      const anyOtp = await prisma.otpVerification.findFirst({
        where: { phone: formattedPhone },
      });
      console.log('📱 Verify OTP - Any OTP for phone:', anyOtp ? `Yes (code: ${anyOtp.code}, expires: ${anyOtp.expiresAt})` : 'No');
    }

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

    // Find user in different contexts
    const phoneLastDigits = phone.replace(/^0/, '').slice(-10);

    // Check customers (only those with valid tenant)
    const customers = await prisma.customer.findMany({
      where: {
        phone: {
          contains: phoneLastDigits,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            businessName: true,
            slug: true,
          },
        },
      },
    });

    // Filter out any customers with null tenant (orphan records)
    const validCustomers = customers.filter(c => c.tenant !== null);

    // Check staff (only those with valid tenant) - use select to avoid missing columns
    const staffMembers = await prisma.staff.findMany({
      where: {
        phone: {
          contains: phoneLastDigits,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            businessName: true,
            slug: true,
          },
        },
      },
    });

    // Filter out any staff with null tenant (orphan records)
    const validStaff = staffMembers.filter(s => s.tenant !== null);

    // Check owners (using phone field since ownerPhone may not exist)
    const ownedTenants = await prisma.tenant.findMany({
      where: {
        phone: {
          contains: phoneLastDigits,
        },
      },
      select: {
        id: true,
        businessName: true,
        slug: true,
        ownerName: true,
        ownerEmail: true,
      },
    });

    // Collect all unique tenants
    const tenantsMap = new Map();

    // Add customer tenants
    validCustomers.forEach((c) => {
      if (!tenantsMap.has(c.tenant.id)) {
        tenantsMap.set(c.tenant.id, {
          ...c.tenant,
          userType: 'customer',
          customerId: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
        });
      }
    });

    // Add staff tenants (override customer if same tenant)
    validStaff.forEach((s) => {
      if (!tenantsMap.has(s.tenant.id)) {
        tenantsMap.set(s.tenant.id, {
          ...s.tenant,
          userType: 'staff',
          staffId: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email,
        });
      } else {
        // If already exists as customer, upgrade to staff
        const existing = tenantsMap.get(s.tenant.id);
        if (existing.userType === 'customer') {
          tenantsMap.set(s.tenant.id, {
            ...existing,
            userType: 'staff',
            staffId: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email,
          });
        }
      }
    });

    // Add owned tenants (override all if same tenant)
    ownedTenants.forEach((t) => {
      tenantsMap.set(t.id, {
        id: t.id,
        businessName: t.businessName,
        slug: t.slug,
        userType: 'owner',
        firstName: t.ownerName?.split(' ')[0] || '',
        lastName: t.ownerName?.split(' ').slice(1).join(' ') || '',
        email: t.ownerEmail,
      });
    });

    const allTenants = Array.from(tenantsMap.values());

    if (allTenants.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Bu telefon numarası ile kayıtlı kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // If only one tenant, auto-select
    if (allTenants.length === 1) {
      const tenantData = allTenants[0];

      const user = {
        id: tenantData.customerId || tenantData.staffId || tenantData.id,
        phone: formattedPhone,
        userType: tenantData.userType,
        tenantId: tenantData.id,
        tenantName: tenantData.businessName,
        customerId: tenantData.customerId,
        staffId: tenantData.staffId,
        firstName: tenantData.firstName,
        lastName: tenantData.lastName,
        email: tenantData.email,
      };

      // Generate JWT token
      const token = jwt.sign(
        {
          phone: formattedPhone,
          userType: tenantData.userType,
          tenantId: tenantData.id,
          customerId: tenantData.customerId,
          staffId: tenantData.staffId,
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return NextResponse.json({
        success: true,
        message: 'Giriş başarılı',
        user,
        token,
        tenants: [
          {
            id: tenantData.id,
            businessName: tenantData.businessName,
            slug: tenantData.slug,
          },
        ],
      });
    }

    // Multiple tenants - user needs to select
    // Generate temporary token
    const tempToken = jwt.sign(
      {
        phone: formattedPhone,
        tenantSelection: true,
      },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    // First tenant's user info for now
    const firstTenant = allTenants[0];
    const user = {
      id: firstTenant.customerId || firstTenant.staffId || firstTenant.id,
      phone: formattedPhone,
      userType: firstTenant.userType,
      firstName: firstTenant.firstName,
      lastName: firstTenant.lastName,
      email: firstTenant.email,
    };

    return NextResponse.json({
      success: true,
      message: 'Salon seçimi gerekiyor',
      user,
      token: tempToken,
      tenants: allTenants.map((t) => ({
        id: t.id,
        businessName: t.businessName,
        slug: t.slug,
      })),
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
