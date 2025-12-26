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
      phone: string;
      userType: string;
      tenantId: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET - Get available time slots
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const date = searchParams.get('date');
    const serviceId = searchParams.get('serviceId');

    if (!staffId || !date) {
      return NextResponse.json(
        { success: false, message: 'Personel ve tarih gerekli' },
        { status: 400 }
      );
    }

    // Get service duration
    let serviceDuration = 30; // Default
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { duration: true },
      });
      if (service) {
        serviceDuration = service.duration;
      }
    }

    // Get staff working hours
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { workingHours: true },
    });

    // Get tenant settings for working hours
    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: { settings: true },
    });

    const tenantSettings = tenant?.settings as any;

    // Get day of week
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Determine working hours
    let startHour = 9;
    let endHour = 18;

    // Check staff-specific hours
    const staffHours = staff?.workingHours as any;
    if (staffHours && staffHours[dayOfWeek]) {
      if (staffHours[dayOfWeek].closed) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
      const start = staffHours[dayOfWeek].start;
      const end = staffHours[dayOfWeek].end;
      if (start) startHour = parseInt(start.split(':')[0]);
      if (end) endHour = parseInt(end.split(':')[0]);
    } else if (tenantSettings?.workingHours) {
      // Fallback to tenant hours
      const tenantHours = tenantSettings.workingHours[dayOfWeek];
      if (tenantHours?.closed) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
      if (tenantHours?.start) startHour = parseInt(tenantHours.start.split(':')[0]);
      if (tenantHours?.end) endHour = parseInt(tenantHours.end.split(':')[0]);
    }

    // Get existing appointments for the day
    const appointments = await prisma.appointment.findMany({
      where: {
        staffId,
        date,
        status: {
          notIn: ['cancelled'],
        },
      },
      include: {
        service: {
          select: { duration: true },
        },
      },
    });

    // Generate all possible time slots
    const slots: { time: string; available: boolean }[] = [];
    const slotInterval = 30; // 30 minute slots

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotInterval) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Check if this slot is in the past
        const now = new Date();
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);

        if (slotDate < now) {
          slots.push({ time: timeStr, available: false });
          continue;
        }

        // Check if slot conflicts with existing appointments
        let isAvailable = true;
        const slotStart = hour * 60 + minute;
        const slotEnd = slotStart + serviceDuration;

        for (const apt of appointments) {
          const [aptHour, aptMinute] = apt.time.split(':').map(Number);
          const aptStart = aptHour * 60 + aptMinute;
          const aptEnd = aptStart + apt.service.duration;

          // Check overlap
          if (slotStart < aptEnd && slotEnd > aptStart) {
            isAvailable = false;
            break;
          }
        }

        slots.push({ time: timeStr, available: isAvailable });
      }
    }

    return NextResponse.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    console.error('Get availability error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
