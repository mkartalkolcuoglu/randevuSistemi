import { requireAuth, requirePageAccess } from '../../../lib/auth-utils';
import CustomersClient from './customers-client';
import UnauthorizedAccess from '../../../components/UnauthorizedAccess';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const user = await requireAuth();
  
  // Check permission
  try {
    await requirePageAccess('customers');
  } catch (error) {
    return <UnauthorizedAccess />;
  }

  return <CustomersClient initialCustomers={[]} tenantId={user.id} user={user} />;
}