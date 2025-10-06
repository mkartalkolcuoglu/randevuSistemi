"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@repo/ui';
import { ArrowLeft, Edit, Trash2, Calendar, Clock, User, Phone, Mail, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchAppointment();
    }
  }, [params.id]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/appointments/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setAppointment(data.data);
      } else {
        console.error('Appointment not found');
        router.push('/admin/appointments');
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      router.push('/admin/appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/appointments/${params.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('Randevu başarıyla silindi!');
          router.push('/admin/appointments');
        } else {
          throw new Error('Silme işlemi başarısız');
        }
      } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('Randevu silinirken bir hata oluştu.');
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/appointments/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...appointment,
          status: newStatus
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAppointment(data.data);
        alert('Randevu durumu güncellendi!');
      } else {
        throw new Error('Durum güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Durum güncellenirken bir hata oluştu.');
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

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'cash':
        return 'bg-green-100 text-green-800';
      case 'credit_card':
        return 'bg-blue-100 text-blue-800';
      case 'bank_transfer':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentTypeText = (type: string) => {
    switch (type) {
      case 'cash':
        return 'Nakit';
      case 'credit_card':
        return 'Kredi Kartı';
      case 'bank_transfer':
        return 'Havale';
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

  if (!appointment) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-500">Randevu bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/admin/appointments" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Randevulara Geri Dön
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Randevu Detayı</h1>
          <p className="text-gray-600">{appointment.customer?.name} - {appointment.service?.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/appointments/${appointment.id}/edit`}>
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
        {/* Appointment Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Randevu Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Tarih</label>
                  <p className="text-lg font-semibold flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(appointment.date).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Saat</label>
                  <p className="text-lg font-semibold flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {appointment.time}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Süre</label>
                  <p>{appointment.duration} dakika</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Personel</label>
                  <p className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {appointment.staffName}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Müşteri Bilgileri</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="font-medium">{appointment.customerName}</span>
                  </div>
                  {appointment.customerPhone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      <span>{appointment.customerPhone}</span>
                    </div>
                  )}
                  {appointment.customerEmail && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-500" />
                      <span>{appointment.customerEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Hizmet Bilgileri</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">{appointment.serviceName}</h5>
                      <p className="text-sm text-gray-600">
                        {appointment.duration} dakika
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">
                        ₺{appointment.price}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {appointment.notes && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Notlar</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{appointment.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Oluşturulma Tarihi</h4>
                <p className="text-sm text-gray-600">
                  {new Date(appointment.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status & Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Durum & İşlemler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Randevu Durumu</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(appointment.status)}>
                    {getStatusText(appointment.status)}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Ödeme Tipi</label>
                <div className="mt-1">
                  <Badge className={getPaymentTypeColor(appointment.paymentType)}>
                    {getPaymentTypeText(appointment.paymentType)}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <label className="text-sm font-medium text-gray-600 block mb-2">Durumu Değiştir</label>
                <select
                  value={appointment.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Beklemede</option>
                  <option value="confirmed">Onaylandı</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Toplam Tutar</h4>
                <div className="text-2xl font-bold text-green-600">
                  ₺{appointment.price}
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
              {appointment.status !== 'completed' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStatusChange('completed')}
                >
                  Randevuyu Tamamla
                </Button>
              )}
              {appointment.status === 'pending' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStatusChange('confirmed')}
                >
                  Randevuyu Onayla
                </Button>
              )}
              <Link href={`/admin/appointments/${appointment.id}/edit`}>
                <Button variant="outline" className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  Randevuyu Düzenle
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
