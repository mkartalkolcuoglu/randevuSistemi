'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2>Yükleniyor...</h2>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!tenantSettings) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <h1>Salon Bulunamadı</h1>
        <p>Aradığınız salon mevcut değil.</p>
      </div>
    );
  }

  const { tenant, theme, workingHours } = tenantSettings;

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
    <div style={{ minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Hero Section */}
      <section 
        style={{
          position: 'relative',
          padding: '80px 20px',
          background: theme?.headerImage 
            ? `linear-gradient(135deg, ${theme.primaryColor || '#3B82F6'}CC, ${theme.secondaryColor || '#1E40AF'}CC), url('${theme.headerImage}')`
            : `linear-gradient(135deg, ${theme?.primaryColor || '#3B82F6'}, ${theme?.secondaryColor || '#1E40AF'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)' }}></div>
        <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto' }}>
          {theme?.logo && (
            <div style={{ marginBottom: '30px' }}>
              <img 
                src={theme.logo} 
                alt={tenant?.businessName}
                style={{ 
                  height: '80px', 
                  width: 'auto', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <h1 style={{ 
            fontSize: '3.5rem', 
            fontWeight: 'bold', 
            marginBottom: '20px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}>
            {tenant?.businessName}
          </h1>
          {tenant?.businessDescription && (
            <p style={{ 
              fontSize: '1.2rem', 
              marginBottom: '40px', 
              maxWidth: '600px', 
              margin: '0 auto 40px',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
            }}>
              {tenant.businessDescription}
            </p>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <Link href={`/${slug}/randevu`}>
              <button style={{
                backgroundColor: theme?.secondaryColor || '#1E40AF',
                color: 'white',
                border: `2px solid ${theme?.primaryColor || '#3B82F6'}`,
                padding: '15px 30px',
                fontSize: '1.1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
              }}>
                📅 Hemen Randevu Al
              </button>
            </Link>
            <Link href={`/${slug}/hizmetler`}>
              <button style={{
                backgroundColor: 'transparent',
                color: 'white',
                border: '2px solid white',
                padding: '15px 30px',
                fontSize: '1.1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = theme?.primaryColor || '#3B82F6';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'white';
              }}>
                ✨ Hizmetlerimiz
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      {services.length > 0 && (
        <section style={{ padding: '80px 20px', backgroundColor: 'white' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
                Hizmetlerimiz
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
                Size özel hizmetlerimizi keşfedin
              </p>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '30px' 
            }}>
              {services.slice(0, 6).map((service) => (
                <div key={service.id} style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  padding: '30px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '10px' }}>
                    {service.name}
                  </h3>
                  {service.description && (
                    <p style={{ color: '#6b7280', marginBottom: '20px', lineHeight: '1.6' }}>
                      {service.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold', 
                      color: theme?.primaryColor || '#3B82F6' 
                    }}>
                      ₺{service.price}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
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
        <section style={{ padding: '80px 20px', backgroundColor: '#f9fafb' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
                Uzman Ekibimiz
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
                Deneyimli kadromuzla tanışın
              </p>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '30px' 
            }}>
              {staff.slice(0, 4).map((member) => (
                <div key={member.id} style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '30px',
                  textAlign: 'center',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: theme?.primaryColor || '#3B82F6',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    margin: '0 auto 20px'
                  }}>
                    {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '5px' }}>
                    {member.firstName} {member.lastName}
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '15px' }}>{member.position}</p>
                  {member.specializations && (
                    <div style={{ marginBottom: '15px' }}>
                      {Array.isArray(member.specializations) ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '5px' }}>
                          {member.specializations.map((spec, index) => (
                            <span 
                              key={index}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#e5e7eb',
                                color: '#374151',
                                fontSize: '0.8rem',
                                borderRadius: '4px'
                              }}
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#e5e7eb',
                          color: '#374151',
                          fontSize: '0.8rem',
                          borderRadius: '4px'
                        }}>
                          {member.specializations}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact & Working Hours Section */}
      <section style={{ padding: '80px 20px', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '60px' }}>
            {/* Contact Info */}
            <div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '30px' }}>
                Bize Ulaşın
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {tenant?.businessAddress && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                    <div style={{ 
                      width: '24px', 
                      height: '24px', 
                      color: '#6b7280',
                      marginTop: '2px'
                    }}>📍</div>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Adres</div>
                      <div style={{ color: '#6b7280' }}>{tenant.businessAddress}</div>
                    </div>
                  </div>
                )}
                
                {tenant?.businessPhone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '24px', height: '24px', color: '#6b7280' }}>📞</div>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Telefon</div>
                      <a 
                        href={`tel:${tenant.businessPhone}`}
                        style={{ color: '#6b7280', textDecoration: 'none' }}
                      >
                        {tenant.businessPhone}
                      </a>
                    </div>
                  </div>
                )}

                {tenant?.businessEmail && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '24px', height: '24px', color: '#6b7280' }}>✉️</div>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>E-Posta</div>
                      <a 
                        href={`mailto:${tenant.businessEmail}`}
                        style={{ color: '#6b7280', textDecoration: 'none' }}
                      >
                        {tenant.businessEmail}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Working Hours */}
            <div>
              <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '30px' }}>
                Çalışma Saatleri
              </h3>
              {workingHours && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(workingHours).map(([day, hours]: [string, any]) => {
                    const isClosed = hours?.closed === true || hours?.closed === 'true';
                    const startTime = hours?.start || '09:00';
                    const endTime = hours?.end || '18:00';
                    
                    return (
                      <div key={day} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        padding: '12px 0',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                          {getDayName(day)}
                        </span>
                        <span style={{ 
                          color: isClosed ? '#ef4444' : '#10b981',
                          fontWeight: '500'
                        }}>
                          {isClosed ? 'Kapalı' : `${startTime} - ${endTime}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 20px',
        backgroundColor: theme?.primaryColor || '#3B82F6',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '30px' }}>
            <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              © {new Date().getFullYear()} {tenant?.businessName}. Tüm hakları saklıdır.
            </p>
            <p style={{ fontSize: '0.8rem', opacity: 0.75, marginTop: '10px' }}>
              Bu site Randevu Sistemi tarafından desteklenmektedir.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}