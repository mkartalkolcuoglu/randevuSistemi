import { requireAuth, requirePageAccess } from '../../../lib/auth-utils';
import KasaClient from './kasa-client';
import UnauthorizedAccess from '../../../components/UnauthorizedAccess';

export const dynamic = 'force-dynamic';

export default async function KasaPage() {
  const user = await requireAuth();
  
  // Check permission
  try {
    await requirePageAccess('kasa');
  } catch (error) {
    return <UnauthorizedAccess />;
  }

  return <KasaClient tenantId={user.id} user={user} />;
}

