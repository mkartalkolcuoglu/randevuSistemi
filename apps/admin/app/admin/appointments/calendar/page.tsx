import { cookies } from 'next/headers';
import { prisma } from '../../../../lib/prisma';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '../../../../lib/auth-utils';
import CalendarClient from './calendar-client';

export const dynamic = 'force-dynamic';

async function getAppointments(tenantId: string, userType: string, staffId?: string) {
  try {
    console.log('📅 [Calendar] Fetching appointments for tenant:', tenantId);
    console.log('👤 [Calendar] User type:', userType);
    console.log('🆔 [Calendar] Staff ID:', staffId);
    
    try {
      // Build where clause
      const where: any = {
        tenantId: tenantId
      };
      
      // If user is staff, only show their appointments
      if (userType === 'staff' && staffId) {
        where.staffId = staffId;
        console.log('📌 [Calendar] Filtering by staffId:', staffId);
      }
      
      const appointments = await prisma.appointment.findMany({
        where,
        orderBy: [
          { date: 'asc' },
          { time: 'asc' }
        ]
      });
      
      console.log('📊 [Calendar] Found', appointments.length, 'appointments');
      
      return appointments;
    } finally {
    }
  } catch (error) {
    console.error('❌ [Calendar] Error fetching appointments:', error);
    return [];
  }
}

export default async function CalendarPage() {
  const cookieStore = await cookies();
  const user = await getAuthenticatedUser(cookieStore);

  if (!user) {
    redirect('/login');
  }

  const appointments = await getAppointments(user.tenantId, user.userType, user.staffId);

  return <CalendarClient initialAppointments={appointments} tenantId={user.tenantId} user={user} />;
}

