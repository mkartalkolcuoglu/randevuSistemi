import { requireAuth, requirePageAccess } from '../../../lib/auth-utils';
import SettingsClient from './settings-client';
import UnauthorizedAccess from '../../../components/UnauthorizedAccess';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await requireAuth();
  
  // Check permission
  try {
    await requirePageAccess('settings');
  } catch (error) {
    return <UnauthorizedAccess />;
  }

  return <SettingsClient user={user} />;
}
