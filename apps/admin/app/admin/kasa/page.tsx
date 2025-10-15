import { Suspense } from 'react';
import KasaClient from './kasa-client';

export default function KasaPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<div>Yükleniyor...</div>}>
        <KasaClient />
      </Suspense>
    </div>
  );
}

