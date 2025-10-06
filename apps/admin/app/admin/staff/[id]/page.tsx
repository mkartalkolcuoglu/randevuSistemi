"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@repo/ui';
import { ArrowLeft, Edit, Trash2, Phone, Mail, Calendar, MapPin, User, Star, DollarSign, Clock } from 'lucide-react';
import Link from 'next/link';

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchStaff();
    }
  }, [params.id]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/staff/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setStaff(data.data);
      } else {
        console.error('Staff not found');
        router.push('/admin/staff');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      router.push('/admin/staff');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Bu personeli silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/staff/${params.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const result = await response.json();
          alert(result.message || 'Personel başarıyla silindi!');
          router.push('/admin/staff');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Silme işlemi başarısız');
        }
      } catch (error) {
        console.error('Error deleting staff:', error);
        alert(error.message || 'Personel silinirken bir hata oluştu.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'vacation':
        return 'bg-yellow-100 text-yellow-800';
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
      case 'vacation':
        return 'İzinli';
      default:
        return 'Bilinmiyor';
    }
  };

  const getDayName = (day: string) => {
    const days = {
      monday: 'Pazartesi',
      tuesday: 'Salı',
      wednesday: 'Çarşamba',
      thursday: 'Perşembe',
      friday: 'Cuma',
      saturday: 'Cumartesi',
      sunday: 'Pazar'
    };
    return days[day] || day;
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

  if (!staff) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-500">Personel bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/admin/staff" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Personellere Geri Dön
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{staff.firstName} {staff.lastName}</h1>
          <p className="text-gray-600">{staff.position} • Personel Detayları</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/staff/${staff.id}/edit`}>
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
        {/* Staff Information */}
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
                  <p className="text-lg font-semibold">{staff.firstName} {staff.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Pozisyon</label>
                  <p className="text-lg">{staff.position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Durum</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(staff.status)}>
                      {getStatusText(staff.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Deneyim</label>
                  <p>{staff.experience || 0} yıl</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Değerlendirme</label>
                  <p className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-500" />
                    {staff.rating || 0}/5
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">İşe Başlama</label>
                  <p>{staff.hireDate ? new Date(staff.hireDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">İletişim Bilgileri</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{staff.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{staff.phone}</span>
                  </div>
                </div>
              </div>

              {staff.specializations && staff.specializations.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Uzmanlık Alanları</h4>
                  <div className="flex flex-wrap gap-2">
                    {staff.specializations.map((spec, index) => (
                      <Badge key={index} variant="outline">{spec}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {staff.notes && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Notlar</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{staff.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Çalışma Saatleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staff.workingHours && Object.entries(staff.workingHours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between items-center">
                    <span className="font-medium">{getDayName(day)}</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      hours.isOpen 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {hours.isOpen ? `${hours.start} - ${hours.end}` : 'Kapalı'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics & Actions */}
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
                <div className="text-3xl font-bold text-blue-600">{staff.monthlyAppointments || 0}</div>
                <div className="text-sm text-gray-600">Aylık Randevu</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">₺{staff.monthlyRevenue || 0}</div>
                <div className="text-sm text-gray-600">Aylık Gelir</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">₺{staff.salary || 0}</div>
                <div className="text-sm text-gray-600">Maaş</div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ortalama Değerlendirme</span>
                  <span className="text-sm font-medium flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    {staff.rating || 0}/5
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Toplam Deneyim</span>
                  <span className="text-sm font-medium">{staff.experience || 0} yıl</span>
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
              <Link href={`/admin/appointments/new?staff=${staff.id}`}>
                <Button variant="outline" className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Bu Personel için Randevu Oluştur
                </Button>
              </Link>
              <Link href={`/admin/staff/${staff.id}/edit`}>
                <Button variant="outline" className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  Bilgileri Düzenle
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full text-orange-600 hover:text-orange-700"
              >
                <Clock className="w-4 h-4 mr-2" />
                Çalışma Saatlerini Güncelle
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
