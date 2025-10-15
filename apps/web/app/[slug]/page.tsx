'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TenantPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [tenantSettings, setTenantSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tenantNotFound, setTenantNotFound] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Tenant ayarlarını çek
        const tenantResponse = await fetch(`/api/tenant-settings/${slug}`);
        const tenantResult = await tenantResponse.json();
        
        console.log('Tenant response for slug:', slug, tenantResult);
        
        if (tenantResult.success && tenantResult.data) {
          setTenantSettings(tenantResult.data);
        } else {
          // Tenant bulunamadı
          console.log('Tenant not found for slug:', slug);
          setTenantNotFound(true);
          
          // 3 saniye sonra ana sayfaya yönlendir
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
        
      } catch (error) {
        console.error('Error fetching tenant data:', error);
        setTenantNotFound(true);
        
        // Hata durumunda da ana sayfaya yönlendir
        setTimeout(() => {
          router.push('/');
        }, 3000);
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

  if (tenantNotFound) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '40px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔍</div>
          <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>Salon Bulunamadı</h1>
          <p style={{ color: '#6c757d', marginBottom: '30px', lineHeight: '1.6' }}>
            <strong>"{slug}"</strong> adında bir salon bulunamadı. 
            <br />3 saniye içinde ana sayfaya yönlendirileceksiniz...
          </p>
          <button 
            onClick={() => router.push('/')}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
          >
            Ana Sayfaya Git
          </button>
        </div>
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
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
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
          </div>
        </div>
      </section>

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

      {/* Map Section */}
      {tenantSettings?.location && (tenantSettings.location.latitude && tenantSettings.location.longitude) && (
        <section style={{ padding: '80px 20px', backgroundColor: '#f9fafb' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
                Konumumuz
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
                Bizi kolayca bulabilirsiniz
              </p>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              height: '400px'
            }}>
              <iframe
                src={`https://maps.google.com/maps?q=${tenantSettings.location.latitude},${tenantSettings.location.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="İşletme Konumu"
              />
            </div>
            
            {tenant?.businessAddress && (
              <div style={{ 
                textAlign: 'center', 
                marginTop: '20px',
                padding: '15px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <p style={{ 
                  color: '#374151', 
                  fontWeight: '500',
                  margin: 0
                }}>
                  📍 {tenant.businessAddress}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

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