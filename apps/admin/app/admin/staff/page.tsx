import { requireAuth } from '../../../lib/auth-utils';
import StaffClient from './staff-client';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const user = await requireAuth();

  return <StaffClient user={user} />;
}