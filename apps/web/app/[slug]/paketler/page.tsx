'use client';

import { useTenant } from '../../../lib/api-hooks';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '../../../components/ui';
import { CheckCircle, Star, Calendar, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface PaketlerPageProps {
  params: {
    slug: string;
  };
}

export default function PaketlerPage({ params }: PaketlerPageProps) {
  const { data: tenant, isLoading: tenantLoading } = useTenant(params.slug);

  // Mock paket verileri
  const packages = [
    {
      id: 'basic',
      name: 'Temel Bakım Paketi',
      description: 'Günlük bakım ihtiyaçlarınız için ideal paket',
      price: 299,
      originalPrice: 399,
      duration: '2 saat',
      sessions: 1,
      validity: '30 gün',
      popular: false,
      services: [
        'Saç Kesimi',
        'Saç Yıkama',
        'Fön',
        'Temel Cilt Temizliği'
      ],
      features: [
        'Uzman kuaför hizmeti',
        'Kişiye özel saç analizi',
        'Temel cilt bakımı',
        'Ürün önerileri'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Güzellik Paketi',
      description: 'Kapsamlı güzellik deneyimi için premium paket',
      price: 599,
      originalPrice: 799,
      duration: '4 saat',
      sessions: 1,
      validity: '60 gün',
      popular: true,
      services: [
        'Saç Kesimi & Şekillendirme',
        'Saç Boyama',
        'Profesyonel Cilt Bakımı',
        'Manikür',
        'Kaş Dizaynı',
        'Makyaj'
      ],
      features: [
        'Premium ürünler',
        'Kişiye özel stil danışmanlığı',
        'Profesyonel makyaj',
        'Fotoğraf çekimi',
        'Ücretsiz touch-up (15 gün)'
      ]
    },
    {
      id: 'bridal',
      name: 'Gelin Paketi',
      description: 'Hayatınızın en özel günü için özel tasarlanmış paket',
      price: 1299,
      originalPrice: 1699,
      duration: '6 saat',
      sessions: 2,
      validity: '90 gün',
      popular: false,
      services: [
        'Gelin Saçı',
        'Gelin Makyajı',
        'Cilt Bakımı (2 seans)',
        'Manikür & Pedikür',
        'Kaş & Kirpik Bakımı',
        'Prova Seansı'
      ],
      features: [
        'Luxury ürünler',
        'Profesyonel gelin uzmanı',
        'Prova randevusu dahil',
        'Düğün günü touch-up',
        'Fotoğraf çekimi',
        'Özel hediye paketi'
      ]
    },
    {
      id: 'monthly',
      name: 'Aylık Bakım Aboneliği',
      description: 'Düzenli bakım için aylık abonelik paketi',
      price: 199,
      originalPrice: 299,
      duration: '1.5 saat',
      sessions: 4,
      validity: '30 gün',
      popular: false,
      services: [
        'Aylık Saç Kesimi',
        'Cilt Bakımı',
        'Kaş Şekillendirme',
        'Manikür (aylık)'
      ],
      features: [
        '4 seans randevu hakkı',
        'Öncelikli randevu',
        '%30 ürün indirimi',
        'Ücretsiz danışmanlık',
        'Esnek randevu saatleri'
      ]
    }
  ];

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Paketler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">İşletme Bulunamadı</h1>
          <p className="text-gray-600 mb-6">Aradığınız işletme mevcut değil.</p>
          <Link href="/">
            <Button>Ana Sayfa</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {tenant.name} - Paketlerimiz
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Size özel hazırlanmış avantajlı paket seçeneklerimizle hem tasarruf edin hem de kapsamlı hizmet alın
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-12">
          {packages.map((pkg) => (
            <Card key={pkg.id} className={`relative hover:shadow-xl transition-all duration-300 ${pkg.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">
                    <Star className="w-4 h-4 mr-1" />
                    En Popüler
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl mb-2">{pkg.name}</CardTitle>
                    <CardDescription className="text-base">
                      {pkg.description}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-baseline space-x-2 mt-4">
                  <span className="text-3xl font-bold text-green-600">{pkg.price}₺</span>
                  <span className="text-lg text-gray-500 line-through">{pkg.originalPrice}₺</span>
                  <Badge variant="destructive" className="text-sm">
                    %{Math.round((1 - pkg.price / pkg.originalPrice) * 100)} İndirim
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Package Info */}
                <div className="grid grid-cols-3 gap-4 py-4 border-y">
                  <div className="text-center">
                    <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm font-medium">{pkg.duration}</p>
                    <p className="text-xs text-gray-500">Süre</p>
                  </div>
                  <div className="text-center">
                    <Calendar className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm font-medium">{pkg.sessions} Seans</p>
                    <p className="text-xs text-gray-500">Randevu</p>
                  </div>
                  <div className="text-center">
                    <Star className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm font-medium">{pkg.validity}</p>
                    <p className="text-xs text-gray-500">Geçerlilik</p>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Dahil Olan Hizmetler</h4>
                  <div className="space-y-2">
                    {pkg.services.map((service, index) => (
                      <div key={index} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Özel Avantajlar</h4>
                  <div className="space-y-2">
                    {pkg.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-4">
                  <Link href={`/${params.slug}/randevu?package=${pkg.id}`}>
                    <Button 
                      className={`w-full ${pkg.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      size="lg"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Bu Paketi Seç
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Avantajlı Fiyatlar</h3>
              <p className="text-gray-600 text-sm">
                Paket seçeneklerimizle %30'a varan indirimlerden yararlanın
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Esnek Kullanım</h3>
              <p className="text-gray-600 text-sm">
                Paketlerinizi uygun zamanlarınızda esnek şekilde kullanın
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Star className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Premium Hizmet</h3>
              <p className="text-gray-600 text-sm">
                Tüm paketlerimizde premium ürünler ve uzman hizmet garantisi
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Hangi Paket Size Uygun?</h2>
            <p className="text-xl mb-8 opacity-90">
              Size en uygun paketi belirlemek için bizimle iletişime geçin
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${params.slug}/iletisim`}>
                <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                  Danışmanlık Al
                </Button>
              </Link>
              <Link href={`/${params.slug}/randevu`}>
                <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600">
                  <Calendar className="w-5 h-5 mr-2" />
                  Randevu Al
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
