'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Calendar, Clock, User, CreditCard, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const merchantOid = searchParams.get('merchant_oid');
  const tenantSlug = searchParams.get('tenant');

  useEffect(() => {
    // Fetch appointment details if merchant_oid is available
    if (merchantOid) {
      fetch(`/api/payment/status?merchant_oid=${merchantOid}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAppointmentDetails(data.data);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce-slow">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Ödeme Başarılı!
          </h1>
          <p className="text-xl text-gray-600">
            Randevunuz başarıyla oluşturuldu
          </p>
        </div>

        {/* Appointment Details Card */}
        {!loading && appointmentDetails && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100 animate-slide-up">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-200">
              Randevu Detayları
            </h2>

            <div className="space-y-4">
              {appointmentDetails.customerName && (
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Müşteri</p>
                    <p className="text-lg font-semibold text-gray-900">{appointmentDetails.customerName}</p>
                  </div>
                </div>
              )}

              {appointmentDetails.serviceName && (
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hizmet</p>
                    <p className="text-lg font-semibold text-gray-900">{appointmentDetails.serviceName}</p>
                  </div>
                </div>
              )}

              {appointmentDetails.date && (
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tarih</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(appointmentDetails.date).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {appointmentDetails.time && (
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Saat</p>
                    <p className="text-lg font-semibold text-gray-900">{appointmentDetails.time}</p>
                  </div>
                </div>
              )}

              {appointmentDetails.price && (
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ödenen Tutar</p>
                    <p className="text-lg font-semibold text-gray-900">{appointmentDetails.price} ₺</p>
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

        {/* Info Box */}
        <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">Ne olacak?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Randevu detayları e-posta adresinize gönderilecek</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Randevu saatinden önce size hatırlatma mesajı gönderilecek</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Randevunuzu yönetmek için telefonunuza SMS ile link gönderilecek</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {tenantSlug && (
            <>
              <Link
                href={`/${tenantSlug}`}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center group"
              >
                Ana Sayfaya Dön
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href={`/${tenantSlug}/appointments`}
                className="flex-1 bg-white text-gray-700 px-6 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center"
              >
                Yeni Randevu Al
              </Link>
            </>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Herhangi bir sorun için bizimle iletişime geçebilirsiniz
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

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
