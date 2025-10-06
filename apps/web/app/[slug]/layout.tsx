import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import TenantHeader from '../../components/tenant/TenantHeader';

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { slug } = await params;
  
  // Tenant ayarlarını API'den çek
  let tenantSettings;
  try {
    const response = await fetch(`http://localhost:3000/api/tenant-settings/${slug}`, {
      cache: 'no-store'
    });
    const result = await response.json();
    tenantSettings = result.success ? result.data : null;
  } catch (error) {
    console.error('Error fetching tenant settings in layout:', error);
    tenantSettings = null;
  }

  // Sadece gerçek ayarlar verilerini kullan
  const tenant = tenantSettings ? {
    id: tenantSettings.tenant.id,
    slug: tenantSettings.tenant.slug,
    name: tenantSettings.tenant.businessName,
    description: tenantSettings.tenant.businessDescription || tenantSettings.tenant.businessType || 'Profesyonel güzellik ve bakım hizmetleri',
    logo: tenantSettings.theme?.logo || '',
    primaryColor: tenantSettings.theme?.primaryColor || '#EC4899',
    secondaryColor: tenantSettings.theme?.secondaryColor || '#BE185D',
    settings: {
      allowOnlineBooking: true,
      workingHours: tenantSettings.workingHours
    },
    contact: {
      phone: tenantSettings.tenant.businessPhone || null,
      email: tenantSettings.tenant.businessEmail || null,
      address: tenantSettings.tenant.businessAddress || null,
    }
  } : null;
  
  if (!tenant) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TenantHeader tenant={tenant} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

