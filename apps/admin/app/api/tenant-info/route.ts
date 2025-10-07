import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    // Session'dan tenant ID'yi al
    const cookieStore = await cookies();
    const tenantSession = cookieStore.get('tenant-session');
    
    if (!tenantSession) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    let tenantId;
    try {
      const sessionData = JSON.parse(tenantSession.value);
      tenantId = sessionData.tenantId;
    } catch (error) {
      // Fallback: assume direct tenant ID
      tenantId = tenantSession.value;
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401, headers: corsHeaders }
      );
    }

    try {
      // Tenant bilgilerini getir
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          businessName: true,
          slug: true,
          username: true,
          ownerName: true,
          ownerEmail: true,
          phone: true,
          address: true,
          businessType: true,
          businessDescription: true,
          workingHours: true,
          theme: true,
          createdAt: true,
          lastLogin: true
        }
      });

      if (!tenant) {
        return NextResponse.json(
          { success: false, error: 'Tenant not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      // JSON alanlarını parse et
      const parsedTheme = tenant.theme ? JSON.parse(tenant.theme) : {
        primaryColor: '#EC4899',
        secondaryColor: '#BE185D',
        logo: '',
        headerImage: ''
      };

      const responseData = {
        ...tenant,
        workingHours: tenant.workingHours ? JSON.parse(tenant.workingHours) : {
          monday: { start: '09:00', end: '18:00', closed: false },
          tuesday: { start: '09:00', end: '18:00', closed: false },
          wednesday: { start: '09:00', end: '18:00', closed: false },
          thursday: { start: '09:00', end: '18:00', closed: false },
          friday: { start: '09:00', end: '18:00', closed: false },
          saturday: { start: '09:00', end: '17:00', closed: false },
          sunday: { start: '10:00', end: '16:00', closed: true }
        },
        themeSettings: {
          primaryColor: parsedTheme.primaryColor || '#EC4899',
          secondaryColor: parsedTheme.secondaryColor || '#BE185D',
          logo: parsedTheme.logo || '',
          headerImage: parsedTheme.headerImage || ''
        },
        location: {
          latitude: parsedTheme.location?.latitude || '',
          longitude: parsedTheme.location?.longitude || '',
          address: tenant.address || ''
        }
      };

      return NextResponse.json({
        success: true,
        data: responseData
      }, { headers: corsHeaders });

    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error('Error fetching tenant info:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Session'dan tenant ID'yi al
    const cookieStore = await cookies();
    const tenantSession = cookieStore.get('tenant-session');
    
    if (!tenantSession) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    let tenantId;
    try {
      const sessionData = JSON.parse(tenantSession.value);
      tenantId = sessionData.tenantId;
    } catch (error) {
      // Fallback: assume direct tenant ID
      tenantId = tenantSession.value;
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401, headers: corsHeaders }
      );
    }
    const data = await request.json();

    try {
      // Güncelleme verilerini hazırla
      const updateData: any = {
        businessName: data.businessName,
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        phone: data.phone || null,
        address: data.businessAddress || null,
        businessType: data.businessType || 'other',
        businessDescription: data.businessDescription || null,
        workingHours: JSON.stringify(data.workingHours),
        theme: JSON.stringify({
          ...data.themeSettings,
          location: data.location // Location verisini theme içine ekle
        })
      };

      // Kullanıcı adı varsa ekle
      if (data.username) {
        updateData.username = data.username;
      }

      // Şifre varsa ekle
      if (data.password && data.password.trim() !== '') {
        updateData.password = data.password;
      }

      // Tenant'ı güncelle
      const updatedTenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: updateData,
        select: {
          id: true,
          businessName: true,
          slug: true,
          username: true,
          ownerName: true,
          ownerEmail: true,
          phone: true,
          address: true,
          businessType: true,
          businessDescription: true,
          workingHours: true,
          theme: true,
          createdAt: true,
          lastLogin: true
        }
      });

      // JSON alanlarını parse et
      const responseData = {
        ...updatedTenant,
        workingHours: JSON.parse(updatedTenant.workingHours),
        theme: JSON.parse(updatedTenant.theme)
      };

      return NextResponse.json({
        success: true,
        message: 'Tenant bilgileri başarıyla güncellendi',
        data: responseData
      }, { headers: corsHeaders });

    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error('Error updating tenant info:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
