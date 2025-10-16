import { requireAuth } from '../../../lib/auth-utils';
import PackagesClient from './packages-client';

export const dynamic = 'force-dynamic';

export default async function PackagesPage() {
  const user = await requireAuth();

  return <PackagesClient tenantId={user.tenantId} user={user} />;
}

