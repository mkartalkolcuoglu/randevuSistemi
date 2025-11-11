'use client';

import { XCircle, ArrowLeft, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default function RegistrationFailedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Error Icon */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-6">
            <XCircle className="w-16 h-16 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Ödeme Başarısız
          </h1>
          <p className="text-xl text-gray-600">
            İşletme kaydınız oluşturulamadı
          </p>
        </div>

        {/* Error Message Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100 animate-slide-up">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Ne oldu?
          </h2>
          <p className="text-gray-600 mb-6">
            Ödeme işlemi sırasında bir hata oluştu. Lütfen aşağıdaki nedenleri kontrol edin:
          </p>

          <ul className="space-y-3 text-gray-700 mb-6">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Kart bilgileriniz hatalı olabilir</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Kartınızda yeterli bakiye olmayabilir</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Bankanız işlemi reddetmiş olabilir</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>İnternet bağlantınız kesilmiş olabilir</span>
            </li>
          </ul>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-blue-900">
              <strong>Not:</strong> Ödeme alınmadı, kartınızdan herhangi bir ücret çekilmemiştir.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/register"
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center group"
          >
            <RefreshCcw className="mr-2 w-5 h-5" />
            Tekrar Dene
          </Link>

          <Link
            href="/"
            className="flex-1 bg-white text-gray-700 px-6 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center"
          >
            <ArrowLeft className="mr-2 w-5 h-5" />
            Ana Sayfaya Dön
          </Link>
        </div>

        {/* Support Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Sorun devam ediyorsa bizimle iletişime geçin:
          </p>
          <a
            href="mailto:destek@netrandevu.com"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            destek@netrandevu.com
          </a>
        </div>
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

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
