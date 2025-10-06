import { requireAuth } from '../../../lib/auth-utils';
import ReportsClient from './reports-client';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const user = await requireAuth();

  return <ReportsClient user={user} />;
}