import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import PackagesClient from './packages-client';

async function requireAuth() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('tenantId')?.value;
  const user = cookieStore.get('user')?.value;

  if (!tenantId || !user) {
    redirect('/login');
  }

  return { tenantId, user: JSON.parse(user) };
}

export default async function PackagesPage() {
  const { tenantId, user } = await requireAuth();

  return <PackagesClient tenantId={tenantId} user={user} />;
}

