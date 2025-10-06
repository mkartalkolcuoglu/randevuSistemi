import { requireAuth } from '../../../lib/auth-utils';
import ServicesClient from './services-client';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const user = await requireAuth();

  return <ServicesClient user={user} />;
}