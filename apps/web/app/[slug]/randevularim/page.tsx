'use client';

import { useState } from 'react';
import { useTenant } from '../../../lib/api-hooks';
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Alert, AlertDescription } from '@repo/ui';
import { Calendar, Clock, User, Phone, Mail, MapPin, Search, Filter, X } from 'lucide-react';
import Link from 'next/link';

interface RandevularimPageProps {
  params: {
    slug: string;
  };
}

export default function RandevularimPage({ params }: RandevularimPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [customerInfo, setCustomerInfo] = useState({
    phone: '',
    email: ''
  });

  const { data: tenant, isLoading: tenantLoading } = useTenant(params.slug);

  // Mock randevu verileri
  const appointments = [
    {
      id: '1',
      service: 'Saç Kesimi',
      staff: 'Merve Kaya',
      date: '2024-09-28',
      time: '14:00',
      duration: 60,
      price: 150,
      status: 'confirmed',
      customer: {
        name: 'Ahmet Yılmaz',
        phone: '+90 555 123 45 67',
        email: 'ahmet@example.com'
      },
      notes: 'Katman kesim tercih ediyor'
    },
    {
      id: '2',
      service: 'Manikür',
      staff: 'Zeynep Demir',
      date: '2024-09-25',
      time: '16:30',
      duration: 45,
      price: 80,
      status: 'completed',
      customer: {
        name: 'Ayşe Kara',
        phone: '+90 555 987 65 43',
        email: 'ayse@example.com'
      },
      notes: 'Fransız manikürü'
    },
    {
      id: '3',
      service: 'Cilt Bakımı',
      staff: 'Elif Can',
      date: '2024-10-02',
      time: '10:00',
      duration: 90,
      price: 200,
      status: 'pending',
      customer: {
        name: 'Fatma Öz',
        phone: '+90 555 456 78 90',
        email: 'fatma@example.com'
      },
      notes: 'Karma cilt tipi'
    }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - gerçek uygulamada API çağrısı yapılacak
    if (customerInfo.phone || customerInfo.email) {
      setShowLoginForm(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Onaylandı';
      case 'pending':
        return 'Beklemede';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return 'Bilinmiyor';
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.staff.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
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

  if (showLoginForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-md mx-auto px-4 py-16">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Randevularınızı Görüntüleyin</CardTitle>
              <CardDescription>
                Randevularınızı görmek için telefon numaranızı veya e-posta adresinizi girin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Telefon Numarası
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0555 123 45 67"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                
                <div className="text-center text-sm text-gray-500">veya</div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    E-posta Adresi
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Randevularımı Görüntüle
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Henüz randevunuz yok mu?
                </p>
                <Link href={`/${params.slug}/randevu`}>
                  <Button variant="outline" className="w-full">
                    <Calendar className="w-4 h-4 mr-2" />
                    Yeni Randevu Al
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Randevularım
              </h1>
              <p className="text-gray-600">
                {tenant.name} işletmesindeki randevularınızı görüntüleyebilirsiniz
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowLoginForm(true)}
              className="flex items-center"
            >
              <User className="w-4 h-4 mr-2" />
              Farklı Hesap
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Hizmet veya personel ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="pending">Beklemede</option>
                  <option value="confirmed">Onaylandı</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments */}
        {filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Randevu Bulunamadı</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Arama kriterlerinize uygun randevu bulunamadı.'
                  : 'Henüz hiç randevunuz bulunmuyor.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {(searchTerm || statusFilter !== 'all') && (
                  <Button 
                    variant="outline"
                    onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                  >
                    Filtreleri Temizle
                  </Button>
                )}
                <Link href={`/${params.slug}/randevu`}>
                  <Button>
                    <Calendar className="w-4 h-4 mr-2" />
                    Yeni Randevu Al
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-1">{appointment.service}</CardTitle>
                      <CardDescription className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {appointment.staff}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {getStatusText(appointment.status)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium">{new Date(appointment.date).toLocaleDateString('tr-TR')}</p>
                        <p className="text-sm text-gray-600">Tarih</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium">{appointment.time}</p>
                        <p className="text-sm text-gray-600">{appointment.duration} dakika</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <span className="w-5 h-5 text-green-600 mr-3">₺</span>
                      <div>
                        <p className="font-medium">{appointment.price}₺</p>
                        <p className="text-sm text-gray-600">Ücret</p>
                      </div>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Not:</span> {appointment.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    {appointment.status === 'confirmed' && (
                      <>
                        <Button variant="outline" className="flex-1">
                          <Phone className="w-4 h-4 mr-2" />
                          Salon'u Ara
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <MapPin className="w-4 h-4 mr-2" />
                          Yol Tarifi Al
                        </Button>
                        <Button variant="destructive" className="flex-1">
                          <X className="w-4 h-4 mr-2" />
                          İptal Et
                        </Button>
                      </>
                    )}
                    
                    {appointment.status === 'pending' && (
                      <Alert>
                        <AlertDescription>
                          Randevunuz onay bekliyor. En kısa sürede size dönüş yapılacaktır.
                        </AlertDescription>
                      </Alert>
                    )}

                    {appointment.status === 'completed' && (
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1">
                          Tekrar Randevu Al
                        </Button>
                        <Button variant="outline" className="flex-1">
                          Değerlendir
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Yeni Randevu Almak İster misiniz?</h2>
              <p className="text-lg mb-6 opacity-90">
                Kolayca yeni randevu oluşturun ve hızlıca işlemlerinizi hallettirin
              </p>
              <Link href={`/${params.slug}/randevu`}>
                <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                  <Calendar className="w-5 h-5 mr-2" />
                  Yeni Randevu Al
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
