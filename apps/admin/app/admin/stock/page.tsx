import { requireAuth, requirePageAccess } from '../../../lib/auth-utils';
import StockClient from './stock-client';
import UnauthorizedAccess from '../../../components/UnauthorizedAccess';

export const dynamic = 'force-dynamic';

export default async function StockPage() {
  const user = await requireAuth();
  
  // Check permission
  try {
    await requirePageAccess('stock');
  } catch (error) {
    return <UnauthorizedAccess />;
  }

  return <StockClient initialProducts={[]} tenantId={user.id} user={user} />;
}
