// Basit layout - header'ı kaldırdık

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { slug } = await params;
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <main>
        {children}
      </main>
    </div>
  );
}

