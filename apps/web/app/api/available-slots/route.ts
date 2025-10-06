import { NextRequest, NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

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

  if (!serviceId || !date || !staffId) {
    return NextResponse.json(
      { success: false, error: 'Service ID, date, and staff ID are required' },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // Admin veritabanına bağlan ve mevcut randevuları kontrol et
    const dbPath = path.join(process.cwd(), '../admin/prisma/admin.db');
    const db = new Database(dbPath);
    
    // Bu staff için bu tarihte var olan randevuları getir
    const existingAppointments = db.prepare(`
      SELECT time, duration FROM appointments 
      WHERE staffId = ? AND date = ? AND status != 'cancelled'
    `).all(staffId, date);
    
    // Rezerve edilmiş saatleri hesapla
    const bookedTimes = new Set();
    existingAppointments.forEach(appointment => {
      const [hours, minutes] = appointment.time.split(':').map(Number);
      const startTime = hours * 60 + minutes; // dakika cinsinden
      const duration = appointment.duration || 60; // varsayılan 60 dakika
      
      // Randevu süresince tüm 30'luk dilimleri rezerve et
      for (let i = 0; i < duration; i += 30) {
        const timeInMinutes = startTime + i;
        const h = Math.floor(timeInMinutes / 60);
        const m = timeInMinutes % 60;
        const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        bookedTimes.add(timeString);
      }
    });
    
    const timeSlots = [];
    
    // Working hours: 9:00 AM to 6:00 PM with 30-minute intervals
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip lunch break (12:00-13:00)
        if (hour === 12) continue;
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Bu saat rezerve edilmiş mi kontrol et
        const isAvailable = !bookedTimes.has(timeString);
        
        timeSlots.push({
          time: timeString,
          available: isAvailable,
          staffId: staffId,
          staffName: 'Staff Member'
        });
      }
    }
    
    db.close();

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
  }
}
