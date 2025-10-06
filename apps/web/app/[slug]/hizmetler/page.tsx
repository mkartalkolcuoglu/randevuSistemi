'use client';

import { useState } from 'react';
import { useTenant, useServices } from '../../../lib/api-hooks';
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@repo/ui';
import { Clock, DollarSign, Search, Calendar } from 'lucide-react';
import Link from 'next/link';

interface HizmetlerPageProps {
  params: {
    slug: string;
  };
}

export default function HizmetlerPage({ params }: HizmetlerPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: tenant, isLoading: tenantLoading } = useTenant(params.slug);
  const { data: services, isLoading: servicesLoading } = useServices(params.slug);

  const filteredServices = services?.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const categories = ['all', ...Array.from(new Set(services?.map(s => s.category) || []))];

  if (tenantLoading || servicesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Hizmetler yükleniyor...</p>
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
            {tenant.name} - Hizmetlerimiz
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Profesyonel kadromuz ile sunduğumuz kaliteli hizmetlerimizi keşfedin
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Hizmet ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'Tüm Kategoriler' : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Hizmet Bulunamadı</h3>
              <p className="text-gray-600 mb-6">
                Arama kriterlerinize uygun hizmet bulunamadı. Farklı terimler deneyebilirsiniz.
              </p>
              <Button onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}>
                Filtreleri Temizle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-all duration-300 group">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                      {service.name}
                    </CardTitle>
                    <Badge variant="secondary">{service.category}</Badge>
                  </div>
                  {service.description && (
                    <CardDescription className="text-gray-600">
                      {service.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{service.duration} dakika</span>
                      </div>
                      <div className="flex items-center font-semibold text-lg">
                        <DollarSign className="w-5 h-5 text-green-600 mr-1" />
                        <span className="text-green-600">{service.price}₺</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex space-x-2">
                        <Link href={`/${params.slug}/randevu?service=${service.id}`} className="flex-1">
                          <Button className="w-full group-hover:scale-105 transition-transform">
                            <Calendar className="w-4 h-4 mr-2" />
                            Randevu Al
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Randevunuzu Hemen Alın</h2>
              <p className="text-xl mb-8 opacity-90">
                Uzman kadromuz ile kaliteli hizmet almak için bugün randevu alın
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/${params.slug}/randevu`}>
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                    <Calendar className="w-5 h-5 mr-2" />
                    Randevu Al
                  </Button>
                </Link>
                <Link href={`/${params.slug}/iletisim`}>
                  <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600">
                    İletişime Geç
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
