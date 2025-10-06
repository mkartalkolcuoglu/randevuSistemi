import { requireAuth } from '../../../lib/auth-utils';
import AppointmentsClient from './appointments-client';

export const dynamic = 'force-dynamic';

// Server Component - server-side data fetch with tenant filtering
async function getAppointments(tenantId: string) {
  try {
    const baseUrl = 'http://localhost:3001/api/appointments';
    const url = `${baseUrl}?tenantId=${tenantId}`;
    
    const response = await fetch(url, {
      cache: 'no-store'
    });
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
}

export default async function AppointmentsPage() {
  const user = await requireAuth();
  const appointments = await getAppointments(user.id);

  return <AppointmentsClient initialAppointments={appointments} tenantId={user.id} user={user} />;
}