// Admin shell: the fixed sidebar (rendered by each page via <AdminHeader/>) sits at the
// left edge; here we just offset the page content so it doesn't slide under the sidebar.
// On < lg the sidebar becomes an off-canvas drawer, so no offset there.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="lg:pl-64">{children}</div>;
}
