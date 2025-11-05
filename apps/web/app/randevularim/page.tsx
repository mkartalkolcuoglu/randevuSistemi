"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent } from '../../components/ui';
import { ArrowLeft, Calendar, Clock, User, Phone, Mail, X, CheckCircle, AlertCircle } from 'lucide-react';
import { format, parseISO, isBefore, addHours } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Appointment {
  id: string;
  tenantSlug: string;
  tenantName?: string;
  serviceName: string;
  staffName: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes?: string;
  createdAt: string;
}

function RandevularimContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const phoneNumber = searchParams.get('phone');
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!phoneNumber) {
      router.push('/');
      return;
    }
    fetchAppointments();
  }, [phoneNumber]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/appointments/by-phone?phone=${encodeURIComponent(phoneNumber!)}`);
      const data = await response.json();
      
      if (data.success) {
        setAppointments(data.data);
      } else {
        setError(data.error || 'Randevular yüklenirken hata oluştu');
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const canCancelAppointment = (appointment: Appointment): boolean => {
    if (appointment.status !== 'pending') return false;
    
    // Randevu tarih ve saatini birleştir
    const appointmentDateTime = parseISO(`${appointment.date}T${appointment.time}`);
    
    // 6 saat öncesini hesapla
    const sixHoursBefore = addHours(appointmentDateTime, -6);
    
    // Şu anki zaman 6 saat öncesinden önce mi?
    return isBefore(new Date(), sixHoursBefore);
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Bu randevuyu iptal etmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setCancellingId(appointmentId);
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Randevuları tekrar yükle
        await fetchAppointments();
        alert('Randevunuz başarıyla iptal edildi.');
      } else {
        alert(data.error || 'Randevu iptal edilirken hata oluştu');
      }
    } catch (err) {
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Beklemede</span>;
      case 'confirmed':
        return <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Onaylandı</span>;
      case 'completed':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Tamamlandı</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">İptal Edildi</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Randevularınız yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <img 
                  src="https://i.hizliresim.com/4a00l8g.png" 
                  alt="Net Randevu Logo" 
                  className="h-10 w-auto"
                />
              </Link>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ana Sayfa
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Randevularım
          </h1>
          <p className="text-gray-600">
            {phoneNumber} numarasına kayıtlı randevularınız
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center text-red-800">
                <AlertCircle className="w-5 h-5 mr-2" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appointments List */}
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Randevu Bulunamadı
              </h3>
              <p className="text-gray-600 mb-6">
                Bu telefon numarasına kayıtlı randevu bulunmamaktadır.
              </p>
              <Link href="/">
                <Button className="bg-[#163974] hover:bg-[#0F2A52]">
                  Ana Sayfaya Dön
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const canCancel = canCancelAppointment(appointment);
              const isCancelling = cancellingId === appointment.id;
              
              return (
                <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      {/* Left Side - Appointment Info */}
                      <div className="flex-1 mb-4 md:mb-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                              {appointment.serviceName}
                            </h3>
                            {appointment.tenantName && (
                              <p className="text-sm text-gray-600 mb-2">
                                {appointment.tenantName}
                              </p>
                            )}
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>
                              {format(parseISO(appointment.date), 'dd MMMM yyyy, EEEE', { locale: tr })}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{appointment.time} ({appointment.duration} dakika)</span>
                          </div>
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            <span>{appointment.staffName}</span>
                          </div>
                          {appointment.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">Notlar:</p>
                              <p className="text-sm">{appointment.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Side - Price & Actions */}
                      <div className="flex flex-col items-end space-y-3 min-w-[200px]">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#163974]">
                            ₺{appointment.price}
                          </p>
                        </div>
                        
                        {canCancel && (
                          <Button
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={isCancelling}
                          >
                            {isCancelling ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                İptal Ediliyor...
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-2" />
                                Randevuyu İptal Et
                              </>
                            )}
                          </Button>
                        )}
                        
                        {!canCancel && appointment.status === 'pending' && (
                          <div className="text-xs text-gray-500 text-center">
                            İptal süresi geçti<br/>(Randevuya 6 saatten az kaldı)
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RandevularimPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <RandevularimContent />
    </Suspense>
  );
}

