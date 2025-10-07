'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';
import {
  Calendar,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

export default function TenantPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [tenantSettings, setTenantSettings] = useState(null);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Tenant ayarlarını çek
        const tenantResponse = await fetch(`/api/tenant-settings/${slug}`);
        const tenantResult = await tenantResponse.json();
        setTenantSettings(tenantResult.success ? tenantResult.data : null);

        // Hizmetleri çek
        const servicesResponse = await fetch(`/api/services/${slug}`);
        const servicesResult = await servicesResponse.json();
        setServices(servicesResult.success ? servicesResult.data : []);

        // Personeli çek
        const staffResponse = await fetch(`/api/staff/${slug}`);
        const staffResult = await staffResponse.json();
        setStaff(staffResult.success ? staffResult.data : []);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setTenantSettings(null);
        setServices([]);
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
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

  // Gün adlarını Türkçe'ye çeviren fonksiyon
  const getDayName = (day: string) => {
    const dayNames: { [key: string]: string } = {
      monday: 'Pazartesi',
      tuesday: 'Salı',
      wednesday: 'Çarşamba',
      thursday: 'Perşembe',
      friday: 'Cuma',
      saturday: 'Cumartesi',
      sunday: 'Pazar'
    };
    return dayNames[day] || day;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative py-20"
        style={{
          background: tenant.headerImage 
            ? `linear-gradient(135deg, ${tenant.primaryColor}CC, ${tenant.secondaryColor}CC), url('${tenant.headerImage}')`
            : `linear-gradient(135deg, ${tenant.primaryColor}CC, ${tenant.secondaryColor}CC)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: tenant.primaryColor, // Fallback color
          color: tenant.secondaryColor || '#ffffff'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {tenant.logo && (
              <div className="mx-auto mb-6 h-20 w-auto flex justify-center">
                <img 
                  src={tenant.logo} 
                  alt={tenant.businessName}
                  className="h-20 w-auto object-contain"
                  onError={(e) => {
                    console.error('Logo yüklenemedi:', tenant.logo);
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={() => console.log('Logo yüklendi:', tenant.logo)}
                  referrerPolicy="no-referrer"
                />
              </div>
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
                         <Button 
                           size="lg" 
                           className="px-8 py-3"
                           style={{
                             backgroundColor: tenant.secondaryColor || '#ffffff',
                             color: tenant.primaryColor || '#000000',
                             border: `2px solid ${tenant.primaryColor || '#000000'}`
                           }}
                         >
                           <Calendar className="h-5 w-5 mr-2" />
                           Hemen Randevu Al
                         </Button>
                       </Link>
                     )}
                   </div>

          </div>
        </div>
      </section>

      {/* Services Section */}
      {services.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Hizmetlerimiz</h2>
              <p className="text-lg text-gray-600">Size özel hizmetlerimizi keşfedin</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <div key={service.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h3>
                  {service.description && (
                    <p className="text-gray-600 mb-4">{service.description}</p>
                  )}
                         <div className="flex justify-between items-center">
                           <span 
                             className="text-2xl font-bold" 
                             style={{ color: tenant.primaryColor || '#EC4899' }}
                           >
                             ₺{service.price}
                           </span>
                           <span className="text-sm text-gray-500">
                             {service.duration} dakika
                           </span>
                         </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Staff Section */}
      {staff.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Ekibimiz</h2>
              <p className="text-lg text-gray-600">Uzman kadromuzla tanışın</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {staff.map((member) => (
                <div key={member.id} className="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-lg transition-shadow">
                  {member.avatar && (
                    <img 
                      src={member.avatar} 
                      alt={`${member.firstName} ${member.lastName}`}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                    />
                  )}
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {member.firstName} {member.lastName}
                  </h3>
                  <p className="text-gray-600 mb-2">{member.position}</p>
                  {member.specializations && (
                    <div className="mb-4">
                      {Array.isArray(member.specializations) ? (
                        <div className="flex flex-wrap justify-center gap-2">
                          {member.specializations.map((spec, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                          {member.specializations}
                        </span>
                      )}
                    </div>
                  )}
                  {member.experience && (
                    <p className="text-sm text-gray-500">
                      {member.experience} yıl deneyim
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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

                       {tenantSettings.workingHours && (
                         <div className="mt-8">
                           <h3 className="text-xl font-semibold mb-4">Çalışma Saatleri</h3>
                           <div className="space-y-2">
                             {Object.entries(tenantSettings.workingHours).map(([day, hours]: [string, any]) => {
                               // Ensure hours is an object with the expected structure
                               const workingHour = hours || {};
                               const isClosed = workingHour.closed === true || workingHour.closed === 'true';
                               const startTime = workingHour.start || '09:00';
                               const endTime = workingHour.end || '18:00';
                               
                               return (
                                 <div key={day} className="flex justify-between">
                                   <span className="capitalize font-medium">{getDayName(day)}</span>
                                   <span className={isClosed ? 'text-red-600' : 'text-green-600'}>
                                     {isClosed ? 'Kapalı' : `${startTime} - ${endTime}`}
                                   </span>
                                 </div>
                               );
                             })}
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

