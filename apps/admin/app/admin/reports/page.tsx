import { requireAuth, requirePageAccess } from '../../../lib/auth-utils';
import ReportsClient from './reports-client';
import UnauthorizedAccess from '../../../components/UnauthorizedAccess';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const user = await requireAuth();
  
  // Check permission
  try {
    await requirePageAccess('reports');
  } catch (error) {
    return <UnauthorizedAccess />;
  }

  return <ReportsClient user={user} />;
}