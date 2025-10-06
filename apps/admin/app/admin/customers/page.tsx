import { requireAuth } from '../../../lib/auth-utils';
import CustomersClient from './customers-client';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const user = await requireAuth();

  return <CustomersClient initialCustomers={[]} tenantId={user.id} user={user} />;
}