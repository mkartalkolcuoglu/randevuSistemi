import { requireAuth, requirePageAccess } from '../../../lib/auth-utils';
import AppointmentsClient from './appointments-client';
import UnauthorizedAccess from '../../../components/UnauthorizedAccess';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

async function getAppointments(tenantId: string, userType: string, staffId?: string) {
  try {
    console.log('🔍 [Appointments] Fetching for tenant:', tenantId);
    console.log('👤 [Appointments] User type:', userType);

    // Build where clause
    const where: any = {
      tenantId: tenantId
    };

    // If user is staff, only show their appointments
    if (userType === 'staff' && staffId) {
      where.staffId = staffId;
      console.log('📌 [Appointments] Filtering by staffId:', staffId);
    }

    console.log('🔍 [Appointments] Query where:', JSON.stringify(where));

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ]
    });

    console.log('✅ [Appointments] Found:', appointments.length, 'appointments');
    if (appointments.length > 0) {
      console.log('📋 [Appointments] First appointment:', appointments[0]);
    }

    return appointments;
  } catch (error) {
    console.error('❌ [Appointments] Error fetching appointments:', error);
    console.error('❌ [Appointments] Error details:', error instanceof Error ? error.message : String(error));
    console.error('❌ [Appointments] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return [];
  }
}

export default async function AppointmentsPage() {
  try {
    const user = await requireAuth();

    // Check permission
    try {
      await requirePageAccess('appointments');
    } catch (error) {
      return <UnauthorizedAccess />;
    }

    const appointments = await getAppointments(user.tenantId, user.userType, user.staffId);
    return <AppointmentsClient initialAppointments={appointments} tenantId={user.tenantId} user={user} />;
  } catch (error) {
    console.error('Error in AppointmentsPage:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Hata Oluştu</h1>
          <p className="text-gray-600">Randevular sayfası yüklenirken bir hata oluştu.</p>
          <p className="text-sm text-gray-500 mt-2">{error instanceof Error ? error.message : 'Bilinmeyen hata'}</p>
        </div>
      </div>
    );
  }
}