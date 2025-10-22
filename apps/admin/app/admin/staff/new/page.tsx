import { requireAuth } from '../../../../lib/auth-utils';
import NewStaffForm from './new-staff-form';

export const dynamic = 'force-dynamic';

export default async function NewStaffPage() {
  const user = await requireAuth();

  return <NewStaffForm user={user} />;
}
