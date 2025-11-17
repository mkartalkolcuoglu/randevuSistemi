"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function PaymentContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      window.location.href = '/admin/select-subscription';
    }
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Ödeme bilgisi bulunamadı...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Ödeme İşlemi
          </h1>
          <p className="text-gray-600 mb-6 text-center">
            Ödemenizi tamamlamak için aşağıdaki formu doldurun
          </p>

          <div className="w-full" style={{ minHeight: '600px' }}>
            <iframe
              src={`https://www.paytr.com/odeme/guvenli/${token}`}
              id="paytriframe"
              frameBorder="0"
              scrolling="no"
              style={{ width: '100%', height: '600px' }}
            />
          </div>

          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.addEventListener('message', function(event) {
                  if (event.data === 'payment_success') {
                    // PayTR ödeme başarılı
                    console.log('Payment success message received');
                  }
                });
              `
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 mx-auto animate-spin" />
          <p className="mt-4 text-gray-600">Ödeme sayfası yükleniyor...</p>
        </div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
