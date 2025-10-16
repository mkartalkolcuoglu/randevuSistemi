import { requireAuth } from '../../../lib/auth-utils';
import PackagesClient from './packages-client';

export default async function PackagesPage() {
  const user = await requireAuth();

  return <PackagesClient tenantId={user.tenantId} user={user} />;
}

