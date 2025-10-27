import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateTimeSlots, parseWorkingHours, getWorkingHoursForDay } from '../../../lib/time-slots';

const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Tenant-Slug',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get('serviceId');
  const date = searchParams.get('date');
  const staffId = searchParams.get('staffId');
  const tenantSlug = request.headers.get('X-Tenant-Slug') || searchParams.get('tenantSlug');

  if (!serviceId || !date || !staffId) {
    return NextResponse.json(
      { success: false, error: 'Service ID, date, and staff ID are required' },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // Get tenant settings for appointmentTimeInterval and workingHours
    let appointmentTimeInterval = 30; // Default
    let workingHours = parseWorkingHours(null); // Default
    
    if (tenantSlug) {
      try {
        const tenant = await prisma.tenant.findUnique({
          where: { slug: tenantSlug },
          select: { id: true, workingHours: true }
        });
        
        if (tenant) {
          // Parse working hours
          workingHours = parseWorkingHours(tenant.workingHours);
          
          // Get settings for time interval
          const settings = await prisma.settings.findUnique({
            where: { tenantId: tenant.id },
            select: { appointmentTimeInterval: true }
          });
          
          if (settings?.appointmentTimeInterval) {
            appointmentTimeInterval = settings.appointmentTimeInterval;
          }
          
          console.log('⚙️ Settings loaded:', { interval: appointmentTimeInterval, workingHours });
        }
      } catch (error) {
        console.error('Error fetching settings, using defaults:', error);
      }
    }
    
    // Check if the selected day is a working day
    const dayHours = getWorkingHoursForDay(date, workingHours);
    
    if (!dayHours) {
      console.log('❌ Selected date is not a working day (closed)');
      return NextResponse.json({
        success: true,
        data: {
          date,
          slots: [],
          message: 'Bu gün işletme kapalı'
        }
      }, { headers: corsHeaders });
    }
    
    // Parse start and end hours for the day
    const [startHour] = dayHours.start.split(':').map(Number);
    const [endHour] = dayHours.end.split(':').map(Number);
    
    // Bu staff için bu tarihte var olan randevuları getir
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        staffId: staffId,
        date: date,
        status: {
          not: 'cancelled'
        }
      },
      select: {
        time: true,
        duration: true
      }
    });
    
    // Rezerve edilmiş saatleri hesapla
    const bookedTimes = new Set();
    existingAppointments.forEach(appointment => {
      const [hours, minutes] = appointment.time.split(':').map(Number);
      const startTime = hours * 60 + minutes; // dakika cinsinden
      const duration = appointment.duration || 60; // varsayılan 60 dakika
      
      // Randevu süresince tüm interval'luk dilimleri rezerve et
      for (let i = 0; i < duration; i += appointmentTimeInterval) {
        const timeInMinutes = startTime + i;
        const h = Math.floor(timeInMinutes / 60);
        const m = timeInMinutes % 60;
        const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        bookedTimes.add(timeString);
      }
    });
    
    // Get current time in Turkey timezone (UTC+3)
    const now = new Date();
    const turkeyOffset = 3 * 60; // Turkey is UTC+3
    const localOffset = now.getTimezoneOffset(); // Local timezone offset in minutes
    const turkeyTime = new Date(now.getTime() + (turkeyOffset + localOffset) * 60000);
    
    const selectedDate = new Date(date + 'T00:00:00');
    const todayInTurkey = new Date(turkeyTime.toISOString().split('T')[0] + 'T00:00:00');
    
    const isToday = selectedDate.getTime() === todayInTurkey.getTime();
    const currentHour = turkeyTime.getHours();
    const currentMinute = turkeyTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // Generate time slots dynamically based on tenant settings and working hours
    const allPossibleTimeSlots = generateTimeSlots(startHour, endHour, appointmentTimeInterval);
    
    const timeSlots = allPossibleTimeSlots.map(timeString => {
      const [hour, minute] = timeString.split(':').map(Number);
      const slotTimeInMinutes = hour * 60 + minute;
      
      // If today, check if time slot is in the past
      const isPast = isToday && slotTimeInMinutes <= currentTimeInMinutes;
      
      // Bu saat rezerve edilmiş mi kontrol et
      const isBooked = bookedTimes.has(timeString);
      
      // Available only if not booked AND not in the past
      const isAvailable = !isBooked && !isPast;
      
      return {
        time: timeString,
        available: isAvailable,
        staffId: staffId,
        staffName: 'Staff Member'
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        date,
        slots: timeSlots
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available slots' },
      { status: 500, headers: corsHeaders }
    );
  } finally {
    await prisma.$disconnect();
  }
}
