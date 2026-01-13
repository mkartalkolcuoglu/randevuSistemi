"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  LogOut,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Phone,
  MapPin,
  Scissors,
  CreditCard,
  History
} from "lucide-react";

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  serviceName: string;
  staffName: string;
  price: number;
  duration: number;
  notes?: string;
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
}

interface CustomerInfo {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

export default function MusteriPanelPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "profile">("upcoming");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
    const session = localStorage.getItem("musteri_session");
    if (!session) {
      router.push("/pwa/musteri");
      return;
    }

    try {
      const sessionData = JSON.parse(session);
      setPhone(sessionData.phone);
      fetchData(sessionData.phone);
    } catch {
      router.push("/pwa/musteri");
    }
  }, [router]);

  const fetchData = useCallback(async (phoneNumber: string) => {
    try {
      setLoading(true);

      // Fetch appointments by phone
      const res = await fetch(`/api/pwa/musteri/randevular?phone=${phoneNumber}`);
      const data = await res.json();

      if (data.success) {
        setAppointments(data.appointments || []);
        setCustomerInfo(data.customer || null);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(phone);
    setRefreshing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("musteri_session");
    router.push("/pwa/musteri");
  };

  // Randevunun iptal edilebilir olup olmadığını kontrol et (en az 2 saat önce)
  const canCancelAppointment = (apt: Appointment) => {
    if (apt.status === "cancelled" || apt.status === "completed") return false;

    const appointmentDateTime = new Date(`${apt.date}T${apt.time}`);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return hoursUntilAppointment >= 2; // En az 2 saat kala iptal edilebilir
  };

  const handleCancelAppointment = async (apt: Appointment) => {
    if (!confirm(`"${apt.serviceName}" randevunuzu iptal etmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/pwa/musteri/randevular/iptal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          appointmentId: apt.id,
          phone: phone
        })
      });

      const data = await res.json();
      if (data.success) {
        alert("Randevunuz başarıyla iptal edildi.");
        fetchData(phone); // Listeyi yenile
      } else {
        alert(data.error || "Randevu iptal edilemedi.");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      alert("Randevu iptal edilirken bir hata oluştu.");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("tr-TR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Onaylandı";
      case "completed":
        return "Tamamlandı";
      case "cancelled":
        return "İptal Edildi";
      case "pending":
        return "Beklemede";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const upcomingAppointments = appointments.filter(
    apt => apt.date >= today && apt.status !== "cancelled"
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastAppointments = appointments.filter(
    apt => apt.date < today || apt.status === "cancelled"
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white font-bold text-xl">Merhaba!</h1>
            <p className="text-blue-100 text-sm">
              {customerInfo ? `${customerInfo.firstName} ${customerInfo.lastName}` : "Yükleniyor..."}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
          >
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-blue-100 text-xs mb-1">Yaklaşan Randevu</p>
            <p className="text-white text-2xl font-bold">{upcomingAppointments.length}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-blue-100 text-xs mb-1">Toplam Randevu</p>
            <p className="text-white text-2xl font-bold">{appointments.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 -mt-3">
        <div className="bg-white rounded-2xl shadow-lg p-1.5 flex">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "upcoming"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-500"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Yaklaşan
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "past"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-500"
            }`}
          >
            <History className="w-4 h-4" />
            Geçmiş
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "profile"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-500"
            }`}
          >
            <User className="w-4 h-4" />
            Profil
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-gray-500 text-sm">Randevular yükleniyor...</p>
          </div>
        ) : (
          <>
            {/* Refresh Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-white rounded-lg border border-gray-200"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                Yenile
              </button>
            </div>

            {activeTab === "upcoming" && (
              <div className="space-y-4">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{apt.serviceName}</p>
                          <p className="text-sm text-gray-500">{apt.businessName || "İşletme"}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(apt.status)}`}>
                          {getStatusIcon(apt.status)}
                          {getStatusText(apt.status)}
                        </span>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatDate(apt.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatTime(apt.time)} - {apt.duration} dakika</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{apt.staffName}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-lg font-bold text-green-600">{formatCurrency(apt.price)}</span>
                        <div className="flex items-center gap-2">
                          {canCancelAppointment(apt) && (
                            <button
                              onClick={() => handleCancelAppointment(apt)}
                              className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium"
                            >
                              <XCircle className="w-4 h-4" />
                              İptal Et
                            </button>
                          )}
                          {apt.businessPhone && (
                            <a
                              href={`tel:${apt.businessPhone}`}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium"
                            >
                              <Phone className="w-4 h-4" />
                              Ara
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">Yaklaşan randevunuz yok</p>
                    <p className="text-gray-400 text-sm mt-1">Yeni randevu almak için işletmenize başvurun</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "past" && (
              <div className="space-y-4">
                {pastAppointments.length > 0 ? (
                  pastAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 opacity-80"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{apt.serviceName}</p>
                          <p className="text-sm text-gray-500">{apt.businessName || "İşletme"}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(apt.status)}`}>
                          {getStatusIcon(apt.status)}
                          {getStatusText(apt.status)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatDate(apt.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatTime(apt.time)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">{formatCurrency(apt.price)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <History className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">Geçmiş randevunuz yok</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">
                        {customerInfo ? `${customerInfo.firstName} ${customerInfo.lastName}` : "Müşteri"}
                      </p>
                      <p className="text-gray-500">+90 {phone.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4")}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">Telefon</span>
                      </div>
                      <span className="text-gray-900 font-medium">+90 {phone}</span>
                    </div>

                    {customerInfo?.email && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-600">E-posta</span>
                        </div>
                        <span className="text-gray-900 font-medium">{customerInfo.email}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <Scissors className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">Toplam Randevu</span>
                      </div>
                      <span className="text-gray-900 font-medium">{appointments.length}</span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">Tamamlanan</span>
                      </div>
                      <span className="text-gray-900 font-medium">
                        {appointments.filter(a => a.status === "completed").length}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-semibold flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Çıkış Yap
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
