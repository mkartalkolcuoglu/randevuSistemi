import Link from 'next/link';
import { Button } from '@repo/ui';
import {
  Calendar,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

interface TenantPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TenantPage({ params }: TenantPageProps) {
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
    console.error('Error fetching tenant settings:', error);
    tenantSettings = null;
  }

  // Sadece gerçek ayarlar verilerini kullan
  const tenantData = tenantSettings ? {
    tenant: {
      ...tenantSettings.tenant,
      primaryColor: tenantSettings.theme?.primaryColor || '#EC4899',
      secondaryColor: tenantSettings.theme?.secondaryColor || '#BE185D',
      logo: tenantSettings.theme?.logo || '',
      headerImage: tenantSettings.theme?.headerImage || '',
      settings: {
        allowOnlineBooking: true,
        workingHours: tenantSettings.workingHours
      },
      contact: {
        phone: tenantSettings.tenant.businessPhone || null,
        email: tenantSettings.tenant.businessEmail || null,
        address: tenantSettings.tenant.businessAddress || null,
      },
      location: tenantSettings.location || null
    }
  } : null;
  
  if (!tenantData) {
    return <div>Salon bulunamadı</div>;
  }

  const { tenant } = tenantData;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative bg-gradient-to-r from-gray-900 to-gray-700 text-white py-20"
        style={{
          background: tenant.headerImage 
            ? `linear-gradient(135deg, ${tenant.primaryColor}CC, ${tenant.secondaryColor}CC), url('${tenant.headerImage}')`
            : `linear-gradient(135deg, ${tenant.primaryColor}CC, ${tenant.secondaryColor}CC), url('/hero-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {tenant.logo && (
              <img 
                src={tenant.logo} 
                alt={tenant.businessName}
                className="mx-auto mb-6 h-20 w-auto"
              />
            )}
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              {tenant.businessName}
            </h1>
            {tenant.description && (
              <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
                {tenant.description}
              </p>
            )}
            
            <div className="flex justify-center mb-8">
              {tenant.settings.allowOnlineBooking && (
                <Link href={`/${slug}/randevu`}>
                  <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3">
                    <Calendar className="h-5 w-5 mr-2" />
                    Hemen Randevu Al
                  </Button>
                </Link>
              )}
            </div>

          </div>
        </div>
      </section>




      {/* Contact & Location Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Bize Ulaşın
              </h2>
              <div className="space-y-4">
                {tenant.contact.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-6 w-6 text-gray-500 mt-1" />
                    <div>
                      <div className="font-semibold">Adres</div>
                      <div className="text-gray-600">{tenant.contact.address}</div>
                    </div>
                  </div>
                )}
                
                {tenant.contact.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-6 w-6 text-gray-500" />
                    <div>
                      <div className="font-semibold">Telefon</div>
                      <a 
                        href={`tel:${tenant.contact.phone}`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {tenant.contact.phone}
                      </a>
                    </div>
                  </div>
                )}

                {tenant.contact.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-6 w-6 text-gray-500" />
                    <div>
                      <div className="font-semibold">E-Posta</div>
                      <a 
                        href={`mailto:${tenant.contact.email}`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {tenant.contact.email}
                      </a>
                    </div>
                  </div>
                )}

                {tenant.settings.workingHours && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Çalışma Saatleri</h3>
                    <div className="space-y-2">
                      {Object.entries(tenant.settings.workingHours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between">
                          <span className="capitalize">{getDayName(day)}</span>
                          <span className={!hours.closed ? 'text-green-600' : 'text-red-600'}>
                            {!hours.closed ? `${hours.start} - ${hours.end}` : 'Kapalı'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Map */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Konum
              </h2>
              {tenant.location && tenant.location.latitude && tenant.location.longitude ? (
                <div className="bg-gray-200 h-96 rounded-lg overflow-hidden">
                  <iframe
                    src={`https://maps.google.com/maps?q=${tenant.location.latitude},${tenant.location.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="İşletme Konumu"
                  />
                </div>
              ) : (
                <div className="bg-gray-200 h-96 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2" />
                    <p>Harita bilgisi henüz eklenmedi</p>
                    <p className="text-sm">{tenant.contact.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="py-8 text-white text-center"
        style={{ backgroundColor: tenant.primaryColor }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-white border-opacity-20 pt-8">
            <p className="text-sm opacity-90">
              © {new Date().getFullYear()} {tenant.businessName}. Tüm hakları saklıdır.
            </p>
            <p className="text-xs opacity-75 mt-2">
              Bu site Randevu Sistemi tarafından desteklenmektedir.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}

// Helper functions

function getDayName(day: string) {
  const dayNames = {
    monday: 'Pazartesi',
    tuesday: 'Salı',
    wednesday: 'Çarşamba',
    thursday: 'Perşembe',
    friday: 'Cuma',
    saturday: 'Cumartesi',
    sunday: 'Pazar',
  };
  return dayNames[day as keyof typeof dayNames] || day;
}

