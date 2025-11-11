'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Building2, User, Mail, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function RegistrationSuccessContent() {
  const searchParams = useSearchParams();
  const [businessDetails, setBusinessDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redirectCountdown, setRedirectCountdown] = useState(10);

  const merchantOid = searchParams.get('merchant_oid');

  useEffect(() => {
    // Fetch business registration details if merchant_oid is available
    if (merchantOid) {
      fetch(`/api/payment/status?merchant_oid=${merchantOid}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setBusinessDetails(data.data);
          }
        })
        .catch(error => {
          console.error('Error fetching payment status:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [merchantOid]);

  // Auto-redirect to admin login after 10 seconds
  useEffect(() => {
    if (!loading && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (!loading && redirectCountdown === 0) {
      window.location.href = 'https://admin.netrandevu.com/login';
    }
  }, [loading, redirectCountdown]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce-slow">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Kayıt Başarılı!
          </h1>
          <p className="text-xl text-gray-600">
            İşletmeniz başarıyla oluşturuldu
          </p>
        </div>

        {/* Business Details Card */}
        {!loading && businessDetails && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100 animate-slide-up">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-200">
              İşletme Bilgileri
            </h2>

            <div className="space-y-4">
              {businessDetails.customerName && (
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">İşletme Sahibi</p>
                    <p className="text-lg font-semibold text-gray-900">{businessDetails.customerName}</p>
                  </div>
                </div>
              )}

              {businessDetails.customerEmail && (
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">E-posta</p>
                    <p className="text-lg font-semibold text-gray-900">{businessDetails.customerEmail}</p>
                  </div>
                </div>
              )}

              {businessDetails.amount && (
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ödenen Tutar</p>
                    <p className="text-lg font-semibold text-gray-900">{businessDetails.amount} ₺</p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Reference */}
            {merchantOid && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">İşlem No</p>
                <p className="text-sm font-mono text-gray-700">{merchantOid}</p>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        )}

        {/* Auto-redirect countdown */}
        {!loading && redirectCountdown > 0 && (
          <div className="bg-green-50 rounded-xl p-6 mb-6 border border-green-100 text-center">
            <p className="text-green-900 font-semibold mb-2">
              {redirectCountdown} saniye sonra admin paneline yönlendirileceksiniz...
            </p>
            <div className="w-full bg-green-200 rounded-full h-2 mt-3">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((10 - redirectCountdown) / 10) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">Ne olacak?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Admin paneline giriş yaparak işletmenizi yönetmeye başlayabilirsiniz</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Hizmetlerinizi, personellerinizi ve çalışma saatlerinizi tanımlayabilirsiniz</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Müşterilerinizden randevu almaya başlayabilirsiniz</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Kayıt bilgileriniz e-posta adresinize gönderilecek</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="https://admin.netrandevu.com/login"
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center group"
          >
            Admin Paneline Git
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>

          <Link
            href="/"
            className="flex-1 bg-white text-gray-700 px-6 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center"
          >
            Ana Sayfaya Dön
          </Link>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Herhangi bir sorun için destek@netrandevu.com adresinden bize ulaşabilirsiniz
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default function RegistrationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
      </div>
    }>
      <RegistrationSuccessContent />
    </Suspense>
  );
}
