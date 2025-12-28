import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to verify token
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userType: string;
      tenantId?: string;
      customerId?: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET - Get tenant settings for booking (public for customers)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { id: tenantId } = await params;

    // Get tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        businessName: true,
        workingHours: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'İşletme bulunamadı' },
        { status: 404 }
      );
    }

    // Get settings
    const settings = await prisma.settings.findUnique({
      where: { tenantId },
      select: {
        appointmentTimeInterval: true,
        workingHours: true,
      },
    });

    // Parse working hours - prefer settings, fallback to tenant
    let workingHours = null;
    const workingHoursData = settings?.workingHours || tenant.workingHours;

    if (workingHoursData) {
      try {
        workingHours = typeof workingHoursData === 'string'
          ? JSON.parse(workingHoursData)
          : workingHoursData;
      } catch (e) {
        console.error('Error parsing workingHours:', e);
      }
    }

    // Default working hours if not set
    if (!workingHours) {
      workingHours = {
        monday: { start: '09:00', end: '18:00', closed: false },
        tuesday: { start: '09:00', end: '18:00', closed: false },
        wednesday: { start: '09:00', end: '18:00', closed: false },
        thursday: { start: '09:00', end: '18:00', closed: false },
        friday: { start: '09:00', end: '18:00', closed: false },
        saturday: { start: '09:00', end: '17:00', closed: false },
        sunday: { start: '10:00', end: '16:00', closed: true },
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        tenantId: tenant.id,
        businessName: tenant.businessName,
        workingHours,
        appointmentTimeInterval: settings?.appointmentTimeInterval || 30,
      },
    });
  } catch (error: any) {
    console.error('Get tenant settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
