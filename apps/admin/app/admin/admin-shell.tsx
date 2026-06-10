'use client';

import { usePathname } from 'next/navigation';
import AdminHeader from './admin-header';
import type { ClientUser } from '../../lib/client-permissions';

// Wraps every /admin page with the fixed sidebar + content offset.
// No sidebar on the subscription/checkout flow, or when user data is unavailable.
export default function AdminShell({
  user,
  children,
}: {
  user: ClientUser | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (!user || pathname?.startsWith('/admin/select-subscription')) {
    return <>{children}</>;
  }

  return (
    <>
      <AdminHeader user={user} />
      <div className="lg:pl-64">{children}</div>
    </>
  );
}
