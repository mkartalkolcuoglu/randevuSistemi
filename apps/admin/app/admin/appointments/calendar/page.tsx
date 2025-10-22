import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '../../../../lib/auth-utils';
import CalendarClient from './calendar-client';

export const dynamic = 'force-dynamic';

async function getAppointments(tenantId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');

    const response = await fetch(`${baseUrl}/api/appointments?tenantId=${tenantId}`, {
      headers: {
        'Cookie': `auth_token=${token?.value}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('Failed to fetch appointments');
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
}

export default async function CalendarPage() {
  const cookieStore = await cookies();
  const user = await getAuthenticatedUser(cookieStore);

  if (!user) {
    redirect('/login');
  }

  const appointments = await getAppointments(user.tenantId);

  return <CalendarClient initialAppointments={appointments} tenantId={user.tenantId} user={user} />;
}

