'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function SimpleTenantPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('SimpleTenantPage mounted, slug:', slug);
    
    const fetchData = async () => {
      try {
        console.log('Fetching data for slug:', slug);
        const response = await fetch(`/api/tenant-settings/${slug}`);
        const result = await response.json();
        console.log('API response:', result);
        setData(result);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Simple Tenant Page</h1>
      <p><strong>Slug:</strong> {slug}</p>
      <p><strong>Status:</strong> {data ? 'Data loaded' : 'Loading...'}</p>
      {error && <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>}
      {data && (
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
