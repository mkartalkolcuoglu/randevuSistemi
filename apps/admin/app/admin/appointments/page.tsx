import { requireAuth, requirePageAccess } from '../../../lib/auth-utils';
import AppointmentsClient from './appointments-client';
import UnauthorizedAccess from '../../../components/UnauthorizedAccess';

export const dynamic = 'force-dynamic';

// Server Component - server-side data fetch with tenant filtering
async function getAppointments(tenantId: string, userType: string, staffId?: string) {
  try {
    // Use Prisma directly instead of fetching from API
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log('🔍 Fetching appointments for tenant:', tenantId);
    console.log('👤 User type:', userType);
    console.log('🆔 Staff ID:', staffId);
    
    try {
      // Build where clause
      const where: any = {
        tenantId: tenantId
      };
      
      // If user is staff, only show their appointments
      if (userType === 'staff' && staffId) {
        where.staffId = staffId;
        console.log('📌 Filtering by staffId:', staffId);
      }
      
      const appointments = await prisma.appointment.findMany({
        where,
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
  
  // Check if user has permission to access appointments page
  try {
    await requirePageAccess('appointments');
  } catch (error) {
    console.log('❌ User does not have access to appointments page');
    return <UnauthorizedAccess />;
  }
  
  const appointments = await getAppointments(user.tenantId, user.userType, user.staffId);

  return <AppointmentsClient initialAppointments={appointments} tenantId={user.tenantId} user={user} />;
}