import { requireAuth, requirePageAccess } from '../../../lib/auth-utils';
import PackagesClient from './packages-client';
import UnauthorizedAccess from '../../../components/UnauthorizedAccess';

export const dynamic = 'force-dynamic';

export default async function PackagesPage() {
  const user = await requireAuth();
  
  // Check permission
  try {
    await requirePageAccess('packages');
  } catch (error) {
    return <UnauthorizedAccess />;
  }

  return <PackagesClient tenantId={user.tenantId} user={user} />;
}

