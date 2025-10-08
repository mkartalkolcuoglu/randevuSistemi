import { requireAuth } from '../../../lib/auth-utils';
import AppointmentsClient from './appointments-client';

export const dynamic = 'force-dynamic';

// Server Component - server-side data fetch with tenant filtering
async function getAppointments(tenantId: string) {
  try {
    // Use Prisma directly instead of fetching from API
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log('🔍 Fetching appointments for tenant:', tenantId);
    
    try {
      const appointments = await prisma.appointment.findMany({
        where: {
          tenantId: tenantId
        },
        orderBy: [
          { date: 'desc' },
          { time: 'desc' }
        ],
        take: 100 // Limit to 100 for performance
      });
      
      console.log('📊 Found', appointments.length, 'appointments');
      
      return appointments;
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    return [];
  }
}

export default async function AppointmentsPage() {
  const user = await requireAuth();
  const appointments = await getAppointments(user.id);

  return <AppointmentsClient initialAppointments={appointments} tenantId={user.id} user={user} />;
}