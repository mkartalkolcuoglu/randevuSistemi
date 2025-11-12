"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { ArrowLeft, Edit, Trash2, Clock, DollarSign, Users, TrendingUp, Tag } from 'lucide-react';
import Link from 'next/link';

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchService();
    }
  }, [params.id]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/services/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setService(data.data);
      } else {
        console.error('Service not found');
        router.push('/admin/services');
      }
    } catch (error) {
      console.error('Error fetching service:', error);
      router.push('/admin/services');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/services/${params.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('Hizmet başarıyla silindi!');
          router.push('/admin/services');
        } else {
          throw new Error('Silme işlemi başarısız');
        }
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Hizmet silinirken bir hata oluştu.');
      }
    }
  };

  const toggleStatus = async () => {
    try {
      const response = await fetch(`/api/services/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...service,
          status: service.status === 'active' ? 'inactive' : 'active'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setService(data.data);
        alert(`Hizmet ${service.status === 'active' ? 'pasif' : 'aktif'} edildi!`);
      } else {
        throw new Error('Durum güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error updating service status:', error);
      alert('Durum güncellenirken bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-500">Hizmet bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/admin/services" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Hizmetlere Geri Dön
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{service.name}</h1>
          <p className="text-gray-600">Hizmet Detayları</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={toggleStatus}
            className={service.status === 'active' ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
          >
            {service.status === 'active' ? 'Pasif Yap' : 'Aktif Yap'}
          </Button>
          <Link href={`/admin/services/${service.id}/edit`}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Edit className="w-4 h-4 mr-2" />
              Düzenle
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Sil
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Hizmet Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Hizmet Adı</label>
                  <p className="text-lg font-semibold">{service.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Durum</label>
                  <div className="mt-1">
                    <Badge className={service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {service.status === 'active' ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Kategori</label>
                  <p>{service.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Süre</label>
                  <p className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {service.duration} dakika
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Fiyat</label>
                  <p className="text-lg font-semibold text-green-600">₺{service.price}</p>
                </div>
              </div>
              
              {service.description && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Açıklama</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{service.description}</p>
                </div>
              )}

              {service.staff && service.staff.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Bu Hizmeti Veren Personel</h4>
                  <div className="flex flex-wrap gap-2">
                    {service.staff.map((staffName, index) => (
                      <Badge key={index} variant="outline">{staffName}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                İstatistikler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{service.monthlyBookings || 0}</div>
                <div className="text-sm text-gray-600">Aylık Rezervasyon</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">₺{service.totalRevenue || 0}</div>
                <div className="text-sm text-gray-600">Toplam Gelir</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{service.popularity || 0}%</div>
                <div className="text-sm text-gray-600">Popülerlik Oranı</div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ortalama Kazanç</span>
                  <span className="text-sm font-medium">
                    ₺{service.monthlyBookings ? Math.round(service.totalRevenue / service.monthlyBookings) : 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Hızlı İşlemler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/admin/appointments/new?service=${service.id}`}>
                <Button variant="outline" className="w-full">
                  <Clock className="w-4 h-4 mr-2" />
                  Bu Hizmet için Randevu Oluştur
                </Button>
              </Link>
              <Link href={`/admin/services/${service.id}/edit`}>
                <Button variant="outline" className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  Hizmet Bilgilerini Düzenle
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={toggleStatus}
                className="w-full"
              >
                {service.status === 'active' ? 'Hizmeti Pasif Yap' : 'Hizmeti Aktif Yap'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
