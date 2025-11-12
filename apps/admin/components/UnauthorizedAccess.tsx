"use client";

import { Shield, ArrowLeft } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import Link from 'next/link';

export default function UnauthorizedAccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Yetkisiz Erişim
            </h1>
            
            {/* Message */}
            <p className="text-gray-600 mb-6">
              Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-blue-800">
                <strong>Not:</strong> Yetkiniz olduğunu düşünüyorsanız lütfen yöneticiniz ile iletişime geçin.
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Link href="/admin">
                <Button className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard'a Dön
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="outline" className="w-full">
                  Ayarlar
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

