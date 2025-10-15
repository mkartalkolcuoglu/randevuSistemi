import { requireAuth } from '../../../lib/auth-utils';
import KasaClient from './kasa-client';

export const dynamic = 'force-dynamic';

export default async function KasaPage() {
  const user = await requireAuth();

  return <KasaClient tenantId={user.id} user={user} />;
}

