import { requireAuth } from '../../../lib/auth-utils';
import PerformansClient from './performans-client';

export const dynamic = 'force-dynamic';

export default async function PerformansPage() {
  const user = await requireAuth();

  return <PerformansClient user={user} />;
}

