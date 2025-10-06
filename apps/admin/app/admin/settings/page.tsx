import { requireAuth } from '../../../lib/auth-utils';
import SettingsClient from './settings-client';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await requireAuth();

  return <SettingsClient user={user} />;
}
