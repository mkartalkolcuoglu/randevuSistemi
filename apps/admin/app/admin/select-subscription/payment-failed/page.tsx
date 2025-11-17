import { Button } from '@/components/ui';
import { XCircle } from 'lucide-react';

export default function PaymentFailedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Ödeme Başarısız
        </h1>

        <p className="text-gray-600 mb-6">
          Ödeme işleminiz tamamlanamadı. Lütfen tekrar deneyin veya farklı bir ödeme yöntemi kullanın.
        </p>

        <div className="space-y-3">
          <form action="/admin/select-subscription" method="get">
            <Button type="submit" className="w-full">
              Tekrar Dene
            </Button>
          </form>

          <form action="/admin" method="get">
            <Button type="submit" variant="outline" className="w-full">
              Dashboard'a Dön
            </Button>
          </form>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Sorun devam ediyorsa lütfen destek ekibimizle iletişime geçin.
          </p>
        </div>
      </div>
    </div>
  );
}
