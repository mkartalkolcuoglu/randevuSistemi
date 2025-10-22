import { requireAuth, requirePageAccess } from '../../../lib/auth-utils';
import ServicesClient from './services-client';
import UnauthorizedAccess from '../../../components/UnauthorizedAccess';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const user = await requireAuth();
  
  // Check permission
  try {
    await requirePageAccess('services');
  } catch (error) {
    return <UnauthorizedAccess />;
  }

  return <ServicesClient user={user} />;
}