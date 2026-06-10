import { getAuthenticatedUser } from '../../lib/auth-utils';
import AdminShell from './admin-shell';

// Renders the sidebar once for every /admin page. Auth is enforced by middleware;
// getAuthenticatedUser only supplies the user data for the sidebar. On a transient DB
// blip it may return null → AdminShell renders without the sidebar rather than logging
// the (already-authenticated) user out.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();
  return <AdminShell user={user}>{children}</AdminShell>;
}
