"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui';
import { Calendar, Clock, User, X, CheckCircle, AlertCircle, Filter, Star, MessageSquare, LogOut, Home, PlusCircle, Package, Search, Scissors } from 'lucide-react';
import { format, parseISO, isBefore, addHours, isAfter, startOfToday, differenceInDays } from 'date-fns';
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
  hasFeedback?: boolean; // Feedback verilmiş mi?
}

function RandevularimContent() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'appointments' | 'new' | 'packages' | 'profile'>('appointments');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Filtreler
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // New appointment - business search
  const [businessSearch, setBusinessSearch] = useState('');
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [searchingBusiness, setSearchingBusiness] = useState(false);

  // Packages
  const [customerPackages, setCustomerPackages] = useState<any[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);

  // Profile
  const [customerName, setCustomerName] = useState('');

  const handleLogout = () => {
    document.cookie = 'customer-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/');
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      // Session cookie otomatik gönderilir — telefon numarasına gerek yok
      const response = await fetch('/api/appointments/by-phone');
      const data = await response.json();

      if (data.success) {
        setAppointments(data.data);
        if (data.data.length > 0 && !phoneNumber) {
          setPhoneNumber(data.data[0].customerPhone);
          setCustomerName(data.data[0].customerName || '');
        }
      } else if (data.code === 'NO_SESSION' || data.code === 'SESSION_EXPIRED') {
        // Oturum yok veya süresi dolmuş — doğrulama sayfasına yönlendir
        router.push('/randevularim');
        return;
      } else {
        setError(data.error || 'Randevular yüklenirken hata oluştu');
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Search businesses (own API - no auth needed)
  const handleBusinessSearch = async (query: string) => {
    setBusinessSearch(query);
    if (query.length < 2) {
      setBusinesses([]);
      return;
    }
    setSearchingBusiness(true);
    try {
      const response = await fetch(`/api/tenants/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        setBusinesses(data.data || []);
      }
    } catch {
      setBusinesses([]);
    } finally {
      setSearchingBusiness(false);
    }
  };

  // Fetch customer packages (own API - uses session cookie)
  const fetchPackages = async () => {
    setPackagesLoading(true);
    try {
      const response = await fetch('/api/customer-packages');
      const data = await response.json();
      if (data.success && data.packages) {
        setCustomerPackages(data.packages);
      }
    } catch {
      setCustomerPackages([]);
    } finally {
      setPackagesLoading(false);
    }
  };

  // Fetch packages when packages or profile tab is active
  useEffect(() => {
    if ((activeTab === 'packages' || activeTab === 'profile') && customerPackages.length === 0) {
      fetchPackages();
    }
  }, [activeTab]);

  const canCancelAppointment = (appointment: Appointment): boolean => {
    // İptal edilmiş veya tamamlanmış randevular iptal edilemez
    if (appointment.status === 'cancelled' || appointment.status === 'completed') return false;

    // Randevu tarih ve saatini birleştir
    const appointmentDateTime = parseISO(`${appointment.date}T${appointment.time}`);

    // 6 saat öncesini hesapla
    const sixHoursBefore = addHours(appointmentDateTime, -6);

    // Şu anki zaman 6 saat öncesinden önce mi?
    return isBefore(new Date(), sixHoursBefore);
  };

  const canLeaveFeedback = (appointment: Appointment): boolean => {
    // Sadece tamamlanmış randevular için
    if (appointment.status !== 'completed') return false;
    
    // Zaten feedback verilmişse false
    if (appointment.hasFeedback) return false;
    
    // Randevu tarihinden 7 gün geçmemeli
    const appointmentDate = parseISO(appointment.date);
    const daysPassed = differenceInDays(new Date(), appointmentDate);
    
    return daysPassed <= 7;
  };

  const handleOpenFeedbackModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setRating(0);
    setHoverRating(0);
    setComment('');
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedAppointment || rating === 0) {
      alert('Lütfen yıldız puanı verin');
      return;
    }

    try {
      setSubmittingFeedback(true);
      const response = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          customerName: selectedAppointment.customerName,
          customerPhone: selectedAppointment.customerPhone,
          rating,
          comment: comment.trim() || null,
          serviceName: selectedAppointment.serviceName,
          staffName: selectedAppointment.staffName,
          appointmentDate: selectedAppointment.date,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Geri bildiriminiz için teşekkür ederiz!');
        setShowFeedbackModal(false);
        // Randevuları yenile
        await fetchAppointments();
      } else {
        alert(data.error || 'Geri bildirim gönderilemedi');
      }
    } catch (err) {
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmittingFeedback(false);
    }
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

  // Filtreleme fonksiyonu
  const getFilteredAppointments = () => {
    return appointments.filter((appointment) => {
      // Tarih filtresi
      if (dateFilter !== 'all') {
        const appointmentDate = parseISO(appointment.date);
        const today = startOfToday();
        
        if (dateFilter === 'upcoming' && isBefore(appointmentDate, today)) {
          return false;
        }
        if (dateFilter === 'past' && isAfter(appointmentDate, today)) {
          return false;
        }
      }
      
      // İşletme filtresi
      if (tenantFilter !== 'all' && appointment.tenantSlug !== tenantFilter) {
        return false;
      }
      
      // Durum filtresi
      if (statusFilter !== 'all' && appointment.status !== statusFilter) {
        return false;
      }
      
      return true;
    });
  };

  // Benzersiz işletmeleri al
  const uniqueTenants = Array.from(
    new Map(
      appointments.map(app => [app.tenantSlug, { slug: app.tenantSlug, name: app.tenantName }])
    ).values()
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Beklemede</span>;
      case 'scheduled':
        return <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Onaylandı</span>;
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
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <img
                  src="https://i.hizliresim.com/4a00l8g.png"
                  alt="Net Randevu Logo"
                  className="h-8 sm:h-10 w-auto"
                />
              </Link>
              {customerName && (
                <span className="hidden sm:inline text-sm text-gray-500">
                  Merhaba, <strong className="text-gray-800">{customerName.split(' ')[0]}</strong>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                  <Home className="w-4 h-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline text-sm">Çıkış</span>
              </Button>
            </div>
          </div>
        </div>
        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto pb-0 -mb-px">
            {[
              { key: 'appointments' as const, label: 'Randevularım', icon: Calendar },
              { key: 'new' as const, label: 'Yeni Randevu', icon: PlusCircle },
              { key: 'packages' as const, label: 'Paketlerim', icon: Package },
              { key: 'profile' as const, label: 'Profil', icon: User },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-[#163974] text-[#163974]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ==================== APPOINTMENTS TAB ==================== */}
        {activeTab === 'appointments' && (
        <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Randevularım</h1>
          <p className="text-sm text-gray-500">
            {phoneNumber ? `${phoneNumber.slice(0, 4)}****${phoneNumber.slice(-3)}` : ''} numarasına kayıtlı randevularınız
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

        {/* Filters */}
        {appointments.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Filter className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tarih Filtresi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarih
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">Tümü</option>
                    <option value="upcoming">Gelecek Randevular</option>
                    <option value="past">Geçmiş Randevular</option>
                  </select>
                </div>

                {/* İşletme Filtresi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İşletme
                  </label>
                  <select
                    value={tenantFilter}
                    onChange={(e) => setTenantFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">Tüm İşletmeler</option>
                    {uniqueTenants.map((tenant) => (
                      <option key={tenant.slug} value={tenant.slug}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Durum Filtresi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durum
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">Tümü</option>
                    <option value="pending">Beklemede</option>
                    <option value="confirmed">Onaylandı</option>
                    <option value="completed">Tamamlandı</option>
                    <option value="cancelled">İptal Edildi</option>
                  </select>
                </div>
              </div>

              {/* Aktif Filtreler ve Sıfırla Butonu */}
              {(dateFilter !== 'all' || tenantFilter !== 'all' || statusFilter !== 'all') && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {getFilteredAppointments().length} randevu gösteriliyor
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateFilter('all');
                      setTenantFilter('all');
                      setStatusFilter('all');
                    }}
                    className="text-sm"
                  >
                    Filtreleri Temizle
                  </Button>
                </div>
              )}
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
          <>
            {getFilteredAppointments().length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Filtre Sonucu Bulunamadı
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Seçtiğiniz filtrelere uygun randevu bulunamadı.
                  </p>
                  <Button
                    onClick={() => {
                      setDateFilter('all');
                      setTenantFilter('all');
                      setStatusFilter('all');
                    }}
                    className="bg-[#163974] hover:bg-[#0F2A52]"
                  >
                    Filtreleri Temizle
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {getFilteredAppointments().map((appointment) => {
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
                        
                        {/* Feedback Butonu */}
                        {appointment.status === 'completed' && (
                          <>
                            {appointment.hasFeedback ? (
                              <Button
                                variant="outline"
                                className="border-gray-300 text-gray-500 cursor-not-allowed"
                                disabled
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Feedback Gönderildi
                              </Button>
                            ) : canLeaveFeedback(appointment) ? (
                              <Button
                                variant="outline"
                                className="border-green-300 text-green-600 hover:bg-green-50"
                                onClick={() => handleOpenFeedbackModal(appointment)}
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Geri Bildirim Bırak
                              </Button>
                            ) : null}
                          </>
                        )}

                        {/* İptal Butonu */}
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
                        
                        {!canCancel && (appointment.status === 'pending' || appointment.status === 'confirmed') && (
                          <div className="text-xs text-gray-500 text-center">
                            İptal süresi geçti<br/>(Randevuya 6 saatten az kaldı)
                          </div>
                        )}
                        
                        {appointment.status === 'completed' && !canLeaveFeedback(appointment) && (
                          <div className="text-xs text-gray-500 text-center">
                            Geri bildirim süresi doldu<br/>(7 gün geçti)
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
          </>
        )}
      </div>
      )}

      {/* ==================== NEW APPOINTMENT TAB ==================== */}
      {activeTab === 'new' && (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Yeni Randevu</h1>
            <p className="text-sm text-gray-500">Randevu almak istediğiniz işletmeyi arayın</p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={businessSearch}
                  onChange={(e) => handleBusinessSearch(e.target.value)}
                  placeholder="İşletme adı yazın... (en az 2 karakter)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#163974] focus:border-[#163974] focus:outline-none text-base"
                />
              </div>
            </CardContent>
          </Card>

          {searchingBusiness && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#163974] mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Aranıyor...</p>
            </div>
          )}

          {!searchingBusiness && businesses.length > 0 && (
            <div className="space-y-3">
              {businesses.map((biz: any) => (
                <Card key={biz.id || biz.slug} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/${biz.slug}/randevu`)}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#163974]/10 flex items-center justify-center">
                          <Scissors className="w-6 h-6 text-[#163974]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{biz.name || biz.businessName}</h3>
                          {biz.description && (
                            <p className="text-sm text-gray-500 mt-0.5">{biz.description}</p>
                          )}
                        </div>
                      </div>
                      <Button size="sm" className="bg-[#163974] hover:bg-[#0F2A52] text-white">
                        Randevu Al
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!searchingBusiness && businessSearch.length >= 2 && businesses.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">İşletme bulunamadı</p>
              </CardContent>
            </Card>
          )}

          {/* Son randevu alınan işletmeler */}
          {businessSearch.length < 2 && appointments.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Son Randevu Aldığınız İşletmeler</h3>
              <div className="space-y-3">
                {Array.from(new Map(appointments.map(a => [a.tenantSlug, a])).values()).slice(0, 5).map((apt) => (
                  <Card key={apt.tenantSlug} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/${apt.tenantSlug}/randevu`)}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                            <Scissors className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{apt.tenantName}</h3>
                            <p className="text-xs text-gray-400">Son randevu: {format(parseISO(apt.date), 'dd MMM yyyy', { locale: tr })}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                          Tekrar Al
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== PACKAGES TAB ==================== */}
      {activeTab === 'packages' && (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Paketlerim</h1>
            <p className="text-sm text-gray-500">Satın aldığınız hizmet paketleri</p>
          </div>

          {packagesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#163974] mx-auto mb-3"></div>
              <p className="text-gray-500">Paketler yükleniyor...</p>
            </div>
          ) : customerPackages.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz Paketiniz Yok</h3>
                <p className="text-gray-500 mb-6">Randevu aldığınız işletmelerden paket satın alabilirsiniz.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {customerPackages.map((pkg: any) => (
                <Card key={pkg.id} className="overflow-hidden">
                  <div className="bg-gradient-to-r from-[#163974] to-[#1e4a8f] px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">{pkg.package?.name || 'Paket'}</h3>
                        <p className="text-blue-200 text-sm">{pkg.package?.description || ''}</p>
                      </div>
                      {pkg.expiresAt && (
                        <div className="text-right">
                          <p className="text-xs text-blue-200">Son Kullanma</p>
                          <p className="text-sm font-semibold text-white">
                            {format(new Date(pkg.expiresAt), 'dd MMM yyyy', { locale: tr })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {(pkg.usages || []).map((usage: any) => {
                        const percent = usage.totalQuantity > 0 ? ((usage.totalQuantity - usage.remainingQuantity) / usage.totalQuantity) * 100 : 0;
                        return (
                          <div key={usage.id}>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-sm font-medium text-gray-700">{usage.itemName}</span>
                              <span className="text-sm text-gray-500">
                                <strong className="text-[#163974]">{usage.remainingQuantity}</strong> / {usage.totalQuantity} kalan
                              </span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#163974] to-blue-500 transition-all"
                                style={{ width: `${100 - percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== PROFILE TAB ==================== */}
      {activeTab === 'profile' && (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Profil</h1>
            <p className="text-sm text-gray-500">Hesap bilgileriniz</p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#163974] flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {customerName ? customerName.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{customerName || 'Müşteri'}</h2>
                  <p className="text-gray-500 text-sm">
                    {phoneNumber ? `${phoneNumber.slice(0, 4)}****${phoneNumber.slice(-3)}` : ''}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-[#163974]">{appointments.length}</p>
                  <p className="text-sm text-gray-600">Toplam Randevu</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {appointments.filter(a => a.status === 'completed').length}
                  </p>
                  <p className="text-sm text-gray-600">Tamamlanan</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{customerPackages.length}</p>
                  <p className="text-sm text-gray-600">Aktif Paket</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Randevu Aldığım İşletmeler</h3>
              {Array.from(new Map(appointments.map(a => [a.tenantSlug, a])).values()).length === 0 ? (
                <p className="text-gray-500 text-sm">Henüz randevu almadınız.</p>
              ) : (
                <div className="space-y-3">
                  {Array.from(new Map(appointments.map(a => [a.tenantSlug, { name: a.tenantName, slug: a.tenantSlug, count: appointments.filter(x => x.tenantSlug === a.tenantSlug).length }])).values()).map((tenant: any) => (
                    <div key={tenant.slug} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Scissors className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="font-medium text-gray-800">{tenant.name}</span>
                      </div>
                      <span className="text-sm text-gray-400">{tenant.count} randevu</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full border-red-300 text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Çıkış Yap
          </Button>
        </div>
      )}
      </div>

      {/* Feedback Modal */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Geri Bildirim</DialogTitle>
            <DialogDescription>
              {selectedAppointment?.serviceName} hizmetiniz için geri bildirim bırakın
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {/* Yıldız Puanlama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Puanınız *
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  {rating === 1 && 'Çok Kötü'}
                  {rating === 2 && 'Kötü'}
                  {rating === 3 && 'Orta'}
                  {rating === 4 && 'İyi'}
                  {rating === 5 && 'Mükemmel'}
                </p>
              )}
            </div>

            {/* Yorum */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yorumunuz (Opsiyonel)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none"
                placeholder="Deneyiminizi paylaşın..."
              />
              <p className="mt-1 text-xs text-gray-500">
                {comment.length}/500 karakter
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowFeedbackModal(false);
                setRating(0);
                setHoverRating(0);
                setComment('');
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleSubmitFeedback}
              disabled={submittingFeedback || rating === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {submittingFeedback ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Gönder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

