'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function TenantPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [tenantSettings, setTenantSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('TenantPage mounted, slug:', slug);
    
    const fetchData = async () => {
      try {
        console.log('Fetching tenant data for slug:', slug);
        const tenantResponse = await fetch(`/api/tenant-settings/${slug}`);
        const tenantResult = await tenantResponse.json();
        console.log('Tenant API response:', tenantResult);
        
        if (tenantResult.success) {
          setTenantSettings(tenantResult.data);
        } else {
          setError('Tenant bulunamadı');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
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
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Yükleniyor...</h1>
        <p>Slug: {slug}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Hata</h1>
        <p>{error}</p>
        <p>Slug: {slug}</p>
      </div>
    );
  }

  if (!tenantSettings) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Salon Bulunamadı</h1>
        <p>Slug: {slug}</p>
      </div>
    );
  }

  const { tenant, theme } = tenantSettings;

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial',
      backgroundColor: theme?.primaryColor || '#f5f5f5',
      color: theme?.secondaryColor || '#333',
      minHeight: '100vh'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        {theme?.logo && (
          <img 
            src={theme.logo} 
            alt="Logo" 
            style={{ maxHeight: '100px', marginBottom: '20px' }}
          />
        )}
        <h1>{tenant?.businessName || 'Salon'}</h1>
        <p>{tenant?.businessDescription || 'Hoş geldiniz'}</p>
      </header>

      <main>
        <section style={{ marginBottom: '40px' }}>
          <h2>İletişim Bilgileri</h2>
          <p><strong>Telefon:</strong> {tenant?.businessPhone || 'Belirtilmemiş'}</p>
          <p><strong>Email:</strong> {tenant?.businessEmail || 'Belirtilmemiş'}</p>
          <p><strong>Adres:</strong> {tenant?.businessAddress || 'Belirtilmemiş'}</p>
        </section>

        <section>
          <h2>Çalışma Saatleri</h2>
          {tenantSettings.workingHours && Object.entries(tenantSettings.workingHours).map(([day, hours]) => (
            <div key={day} style={{ marginBottom: '10px' }}>
              <strong>{day}:</strong> {
                hours.closed ? 'Kapalı' : `${hours.start} - ${hours.end}`
              }
            </div>
          ))}
        </section>
      </main>

      <footer style={{ marginTop: '40px', textAlign: 'center', fontSize: '12px' }}>
        <p>Powered by Randevu Sistemi</p>
        <p>Debug - Slug: {slug}</p>
        <p>Timestamp: {new Date().toISOString()}</p>
      </footer>
    </div>
  );
}
