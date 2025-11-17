"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const packageSlug = searchParams.get('package');
  const duration = searchParams.get('duration');
  const [activating, setActivating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const activateSubscription = async () => {
      try {
        const response = await fetch('/api/subscription/activate-paid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageSlug,
            durationDays: parseInt(duration || '0'),
          }),
        });

        if (!response.ok) {
          throw new Error('Aktivasyon başarısız');
        }

        setActivating(false);

        // 2 saniye sonra dashboard'a yönlendir
        setTimeout(() => {
          window.location.href = '/admin';
        }, 2000);
      } catch (err: any) {
        setError(err.message);
        setActivating(false);
      }
    };

    if (packageSlug && duration) {
      activateSubscription();
    }
  }, [packageSlug, duration]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        {activating ? (
          <>
            <div className="mb-6">
              <Loader2 className="w-16 h-16 text-blue-500 mx-auto animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Aboneliğiniz Aktifleştiriliyor...
            </h1>
            <p className="text-gray-600">
              Lütfen bekleyin, işleminiz tamamlanıyor.
            </p>
          </>
        ) : error ? (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl">❌</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Aktivasyon Hatası
            </h1>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={() => window.location.href = '/admin/select-subscription'}>
              Geri Dön
            </Button>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Ödeme Başarılı!
            </h1>
            <p className="text-gray-600 mb-6">
              Aboneliğiniz başarıyla aktifleştirildi. Dashboard'a yönlendiriliyorsunuz...
            </p>
            <Button onClick={() => window.location.href = '/admin'}>
              Dashboard'a Git
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
