"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { DollarSign, Bug, BarChart3 } from 'lucide-react';

export default function ProjectAdminClient() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Project Admin Panel</h1>
              <p className="text-sm text-gray-600">Sistem yönetimi ve raporlama</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Ödeme Akışı */}
          <Link href="/payment-flow">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  Ödeme Akışı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Tüm tenant'ların kredi kartı ve havale ödemelerini görüntüleyin.
                  İşletme bazında filtreleme ve detaylı raporlama.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Debug Panel */}
          <Link href="/admin/debug">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <div className="p-2 bg-red-100 rounded-lg mr-3">
                    <Bug className="w-6 h-6 text-red-600" />
                  </div>
                  Debug Panel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Kredi kartı ödemelerini kontrol edin, eksik transaction kayıtlarını düzeltin.
                  Sistem hatalarını analiz edin.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* İstatistikler (Placeholder) */}
          <Card className="opacity-50 cursor-not-allowed h-full">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                Sistem İstatistikleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Tüm tenant'ların performans metrikleri, kullanım istatistikleri.
                (Yakında)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">ℹ️ Bilgilendirme</h2>
          <p className="text-sm text-blue-800">
            Bu panel sadece proje yöneticileri içindir. Burada tüm tenant'ların verilerine
            erişebilir ve sistem genelinde işlemler yapabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
