import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to verify token and get user info
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userType: string;
      tenantId: string;
      staffId?: string;
      ownerId?: string;
    };
    return decoded;
  } catch (err) {
    console.error('Token verification error:', err);
    return null;
  }
}

// GET - Get tenant settings (working hours, appointment interval, etc.)
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff and owners can access
    if (auth.userType !== 'staff' && auth.userType !== 'owner') {
      return NextResponse.json(
        { success: false, message: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      );
    }

    // Get tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
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
      where: { tenantId: auth.tenantId },
      select: {
        appointmentTimeInterval: true,
        workingHours: true,
        blacklistThreshold: true,
        reminderMinutes: true,
      },
    });

    console.log('🔧 Tenant settings debug:');
    console.log('  - tenantId:', auth.tenantId);
    console.log('  - settings found:', !!settings);
    console.log('  - settings.workingHours:', settings?.workingHours);
    console.log('  - tenant.workingHours:', tenant.workingHours);
    console.log('  - appointmentTimeInterval:', settings?.appointmentTimeInterval);

    // Parse working hours - prefer settings, fallback to tenant
    let workingHours = null;
    const workingHoursString = settings?.workingHours || tenant.workingHours;

    if (workingHoursString) {
      try {
        workingHours = typeof workingHoursString === 'string'
          ? JSON.parse(workingHoursString)
          : workingHoursString;
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
        blacklistThreshold: settings?.blacklistThreshold || 3,
        reminderMinutes: settings?.reminderMinutes || 120,
      },
    });
  } catch (error: any) {
    console.error('Get tenant settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
