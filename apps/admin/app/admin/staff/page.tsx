import { requireAuth, requirePageAccess } from '../../../lib/auth-utils';
import StaffClient from './staff-client';
import UnauthorizedAccess from '../../../components/UnauthorizedAccess';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const user = await requireAuth();
  
  // Check permission
  try {
    await requirePageAccess('staff');
  } catch (error) {
    return <UnauthorizedAccess />;
  }

  return <StaffClient user={user} />;
}