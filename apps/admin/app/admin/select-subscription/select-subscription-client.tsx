"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { Check, Crown, Zap, TrendingUp } from 'lucide-react';

interface Package {
  id: string;
  name: string;
  slug: string;
  durationDays: number;
  price: number;
  isActive: boolean;
  isFeatured: boolean;
  features: string | null;
  description: string | null;
}

interface Props {
  packages: Package[];
  tenantId: string;
  businessName: string;
  hasUsedTrial: boolean;
}

export default function SelectSubscriptionClient({ packages, tenantId, businessName, hasUsedTrial }: Props) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePackageSelect = async (pkg: Package) => {
    setSelectedPackage(pkg.id);
    setError(null);

    // Eğer ücretsiz paket ise (trial veya price = 0)
    if (pkg.price === 0) {
      setLoading(true);
      try {
        const response = await fetch('/api/subscription/activate-free', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageSlug: pkg.slug,
            durationDays: pkg.durationDays,
          }),
        });

        if (!response.ok) {
          throw new Error('Paket aktivasyonu başarısız');
        }

        // Başarılı, dashboard'a yönlendir
        window.location.href = '/admin';
      } catch (err: any) {
        setError(err.message || 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    } else {
      // Ücretli paket, PayTR'ye yönlendir
      setLoading(true);
      try {
        const response = await fetch('/api/subscription/payment/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageId: pkg.id,
            packageSlug: pkg.slug,
          }),
        });

        if (!response.ok) {
          throw new Error('Ödeme başlatılamadı');
        }

        const data = await response.json();

        if (data.iframeToken) {
          // PayTR iframe'ini göster
          window.location.href = `/admin/select-subscription/payment?token=${data.iframeToken}`;
        } else {
          throw new Error('Ödeme token alınamadı');
        }
      } catch (err: any) {
        setError(err.message || 'Bir hata oluştu');
        setLoading(false);
      }
    }
  };

  const getPackageIcon = (slug: string, isFeatured: boolean) => {
    if (isFeatured) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (slug === 'trial') return <Zap className="w-6 h-6 text-blue-500" />;
    if (slug === 'yearly') return <TrendingUp className="w-6 h-6 text-green-500" />;
    return <Check className="w-6 h-6 text-gray-500" />;
  };

  const parseFeatures = (featuresJson: string | null): string[] => {
    if (!featuresJson) return [];
    try {
      return JSON.parse(featuresJson);
    } catch {
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Hoş Geldiniz, {businessName}!
          </h1>
          <p className="text-xl text-gray-600">
            {hasUsedTrial
              ? 'Devam etmek için bir paket seçin'
              : 'Başlamak için bir paket seçin'}
          </p>
          {hasUsedTrial && (
            <p className="text-sm text-orange-600 mt-2">
              Deneme paketiniz sona erdi. Hizmete devam etmek için lütfen bir paket seçin.
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const features = parseFeatures(pkg.features);
            const isSelected = selectedPackage === pkg.id;

            return (
              <Card
                key={pkg.id}
                className={`relative transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-blue-500 shadow-xl scale-105'
                    : 'hover:shadow-lg hover:scale-102'
                } ${pkg.isFeatured ? 'border-2 border-yellow-400' : ''}`}
                onClick={() => !loading && handlePackageSelect(pkg)}
              >
                {pkg.isFeatured && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-yellow-500 text-white px-4 py-1">
                      Önerilen
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    {getPackageIcon(pkg.slug, pkg.isFeatured)}
                  </div>
                  <CardTitle className="text-2xl mb-2">{pkg.name}</CardTitle>
                  {pkg.description && (
                    <p className="text-sm text-gray-600">{pkg.description}</p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Price */}
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    {pkg.price === 0 ? (
                      <div>
                        <span className="text-4xl font-bold text-green-600">Ücretsiz</span>
                        <p className="text-sm text-gray-600 mt-1">{pkg.durationDays} gün</p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-4xl font-bold text-gray-900">{pkg.price} ₺</span>
                        <p className="text-sm text-gray-600 mt-1">
                          {pkg.durationDays} gün ({Math.round(pkg.durationDays / 30)} ay)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  {features.length > 0 && (
                    <ul className="space-y-2">
                      {features.map((feature, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Select Button */}
                  <Button
                    className="w-full mt-4"
                    variant={isSelected ? 'default' : 'outline'}
                    disabled={loading}
                  >
                    {loading && isSelected ? 'İşleniyor...' : pkg.price === 0 ? 'Başla' : 'Satın Al'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {packages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">Şu anda aktif paket bulunmamaktadır.</p>
          </div>
        )}
      </div>
    </div>
  );
}
