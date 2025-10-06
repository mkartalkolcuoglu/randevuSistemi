import { requireAuth } from '../../../lib/auth-utils';
import StockClient from './stock-client';

export const dynamic = 'force-dynamic';

export default async function StockPage() {
  const user = await requireAuth();

  return <StockClient initialProducts={[]} tenantId={user.id} user={user} />;
}
