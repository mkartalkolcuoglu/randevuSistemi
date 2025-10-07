"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@repo/ui';
import { ArrowLeft, Edit, Trash2, Phone, Mail, Calendar, MapPin, User, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchCustomer();
    }
  }, [params.id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data.data);
      } else {
        console.error('Customer not found');
        router.push('/admin/customers');
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      router.push('/admin/customers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/customers/${params.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('Müşteri başarıyla silindi!');
          router.push('/admin/customers');
        } else {
          throw new Error('Silme işlemi başarısız');
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Müşteri silinirken bir hata oluştu.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'inactive':
        return 'Pasif';
      case 'vip':
        return 'VIP';
      default:
        return 'Bilinmiyor';
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

  if (!customer) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-500">Müşteri bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/admin/customers" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Müşterilere Geri Dön
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{customer.firstName} {customer.lastName}</h1>
          <p className="text-gray-600">Müşteri Detayları</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/customers/${customer.id}/edit`}>
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
        {/* Customer Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Kişisel Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Ad Soyad</label>
                  <p className="text-lg font-semibold">{customer.firstName} {customer.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Durum</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(customer.status)}>
                      {getStatusText(customer.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Cinsiyet</label>
                  <p>{customer.gender || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Doğum Tarihi</label>
                  <p>{customer.birthDate ? new Date(customer.birthDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">İletişim Bilgileri</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{customer.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{customer.address || 'Belirtilmemiş'}</span>
                  </div>
                </div>
              </div>

              {customer.notes && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Notlar</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{customer.notes}</p>
                </div>
              )}

              {customer.favoriteServices && customer.favoriteServices.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Favori Hizmetler</h4>
                  <div className="flex flex-wrap gap-2">
                    {customer.favoriteServices.map((service, index) => (
                      <Badge key={index} variant="outline">{service}</Badge>
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
                <DollarSign className="w-5 h-5 mr-2" />
                İstatistikler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{customer.totalAppointments || 0}</div>
                <div className="text-sm text-gray-600">Toplam Randevu</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">₺{customer.totalSpent || 0}</div>
                <div className="text-sm text-gray-600">Toplam Harcama</div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Kayıt Tarihi</span>
                  <span className="text-sm font-medium">
                    {new Date(customer.registrationDate).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Son Ziyaret</span>
                  <span className="text-sm font-medium">
                    {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString('tr-TR') : 'Henüz ziyaret yok'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Hızlı İşlemler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/admin/appointments/new?customer=${customer.id}`}>
                <Button variant="outline" className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Randevu Oluştur
                </Button>
              </Link>
              <Link href={`/admin/customers/${customer.id}/edit`}>
                <Button variant="outline" className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  Bilgileri Düzenle
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
