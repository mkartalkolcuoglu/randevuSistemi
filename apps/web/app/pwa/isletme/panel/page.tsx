"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Bell,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Home,
  Settings,
  LogOut,
  ChevronRight,
  Plus,
  BarChart3,
  Wallet,
  Phone,
  User,
  Scissors,
  RefreshCw
} from "lucide-react";

// Bugünün tarihini al
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Selamlama mesajı
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
};

// Tarih formatlama
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
};

// Saat formatlama
const formatTime = (timeStr: string) => {
  return timeStr.substring(0, 5);
};

// Durum renkleri
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-500/20 text-green-400';
    case 'pending': return 'bg-amber-500/20 text-amber-400';
    case 'cancelled': return 'bg-red-500/20 text-red-400';
    case 'no_show': return 'bg-gray-500/20 text-gray-400';
    default: return 'bg-blue-500/20 text-blue-400';
  }
};

// Durum metni
const getStatusText = (status: string) => {
  switch (status) {
    case 'completed': return 'Tamamlandı';
    case 'pending': return 'Bekliyor';
    case 'cancelled': return 'İptal';
    case 'no_show': return 'Gelmedi';
    default: return status;
  }
};

export default function PWAIsletmePanel() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  // Kullanıcı ve işletme bilgileri
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string>("");

  // İstatistikler
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayCompleted: 0,
    todayPending: 0,
    todayRevenue: 0,
    weekTotal: 0,
    monthTotal: 0,
  });

  // Randevular
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);

    // Giriş kontrolü
    const token = localStorage.getItem("pwa-auth-token");
    const savedUser = localStorage.getItem("pwa-user");

    if (!token || !savedUser) {
      router.replace("/pwa/isletme");
      return;
    }

    try {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setAuthToken(token);
      setTenant({
        businessName: userData.tenantName || "İşletme",
        id: userData.tenantId
      });

      // Dashboard verilerini çek
      fetchDashboardData(token, userData.tenantId);
    } catch (e) {
      router.replace("/pwa/isletme");
    }
  }, [router]);

  const fetchDashboardData = async (token: string, tenantId: string) => {
    try {
      const response = await fetch("/api/pwa/appointments", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const today = getTodayDate();
          const appointments = data.data || [];

          setAllAppointments(appointments);

          // Bugünün randevuları
          const todayAppts = appointments.filter((apt: any) => apt.date === today);
          setTodayAppointments(todayAppts);

          // İstatistikler
          const pendingCount = todayAppts.filter((apt: any) => apt.status === "pending").length;
          const completedToday = todayAppts.filter((apt: any) => apt.status === "completed").length;
          const todayRevenue = todayAppts
            .filter((apt: any) => apt.status === "completed")
            .reduce((sum: number, apt: any) => sum + (apt.price || 0), 0);

          // Haftalık ve aylık toplam
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          const weekTotal = appointments.filter((apt: any) => new Date(apt.date) >= weekAgo).length;
          const monthTotal = appointments.filter((apt: any) => new Date(apt.date) >= monthAgo).length;

          setStats({
            todayTotal: todayAppts.length,
            todayCompleted: completedToday,
            todayPending: pendingCount,
            todayRevenue: todayRevenue,
            weekTotal,
            monthTotal,
          });

          // Yaklaşan randevular (bugün ve sonrası, pending olanlar)
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const upcoming = appointments
            .filter((apt: any) => {
              if (apt.status === "completed" || apt.status === "cancelled" || apt.status === "no_show") return false;
              if (apt.date > today) return true;
              if (apt.date === today && apt.time >= currentTime) return true;
              return false;
            })
            .sort((a: any, b: any) => {
              if (a.date !== b.date) return a.date.localeCompare(b.date);
              return a.time.localeCompare(b.time);
            })
            .slice(0, 5);

          setUpcomingAppointments(upcoming);
        }
      }
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (isRefreshing || !authToken || !tenant?.id) return;
    setIsRefreshing(true);
    fetchDashboardData(authToken, tenant.id);
  };

  const handleLogout = () => {
    localStorage.removeItem("pwa-auth-token");
    localStorage.removeItem("pwa-user");
    localStorage.removeItem("pwa-user-role");
    router.replace("/pwa");
  };

  // Yükleniyor
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          <p className="mt-4 text-white/60 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Ana Sayfa İçeriği
  const renderHomeContent = () => (
    <div className="space-y-5">
      {/* Hızlı İşlemler */}
      <div>
        <h2 className="text-white/80 font-semibold mb-3">Hızlı İşlemler</h2>
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 rounded-2xl p-4 text-left active:scale-[0.98] transition-transform">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mb-3">
              <Plus className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-white font-medium text-sm">Yeni Randevu</p>
            <p className="text-white/40 text-xs mt-0.5">Hızlı randevu oluştur</p>
          </button>

          <button className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 rounded-2xl p-4 text-left active:scale-[0.98] transition-transform">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-white font-medium text-sm">Müşteri Ekle</p>
            <p className="text-white/40 text-xs mt-0.5">Yeni müşteri kaydı</p>
          </button>
        </div>
      </div>

      {/* Yaklaşan Randevular */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white/80 font-semibold">Yaklaşan Randevular</h2>
          <button
            onClick={() => setActiveTab("calendar")}
            className="text-blue-400 text-sm flex items-center gap-1"
          >
            Tümü <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {upcomingAppointments.length > 0 ? (
          <div className="space-y-3">
            {upcomingAppointments.map((apt, index) => (
              <div
                key={apt.id || index}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{apt.customerName || "Müşteri"}</p>
                        <p className="text-white/50 text-sm truncate">{apt.serviceName || "Hizmet"}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white font-semibold">{formatTime(apt.time)}</p>
                        <p className="text-white/40 text-xs">
                          {apt.date === getTodayDate() ? "Bugün" : formatDate(apt.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Scissors className="w-3.5 h-3.5 text-white/40" />
                        <span className="text-white/40 text-xs">{apt.staffName || "Personel"}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(apt.status)}`}>
                        {getStatusText(apt.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-white/40" />
            </div>
            <p className="text-white/60 text-sm">Yaklaşan randevu bulunmuyor</p>
          </div>
        )}
      </div>

      {/* Günlük Gelir */}
      <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/10 border border-green-500/20 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-white/60 text-sm">Bugünkü Gelir</p>
            <p className="text-2xl font-bold text-white">₺{stats.todayRevenue.toLocaleString('tr-TR')}</p>
          </div>
          <TrendingUp className="w-6 h-6 text-green-400" />
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-white/50 text-xs">Bu Hafta</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.weekTotal}</p>
          <p className="text-white/40 text-xs">randevu</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span className="text-white/50 text-xs">Bu Ay</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.monthTotal}</p>
          <p className="text-white/40 text-xs">randevu</p>
        </div>
      </div>
    </div>
  );

  // Randevular İçeriği
  const renderCalendarContent = () => (
    <div className="space-y-4">
      <h2 className="text-white/80 font-semibold">Bugünün Randevuları</h2>

      {todayAppointments.length > 0 ? (
        <div className="space-y-3">
          {todayAppointments
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((apt, index) => (
            <div
              key={apt.id || index}
              className="bg-white/5 border border-white/10 rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  apt.status === 'completed' ? 'bg-green-500/20' :
                  apt.status === 'cancelled' ? 'bg-red-500/20' : 'bg-blue-500/20'
                }`}>
                  <Clock className={`w-6 h-6 ${
                    apt.status === 'completed' ? 'text-green-400' :
                    apt.status === 'cancelled' ? 'text-red-400' : 'text-blue-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{apt.customerName}</p>
                      <p className="text-white/50 text-sm">{apt.serviceName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white font-semibold text-lg">{formatTime(apt.time)}</p>
                      <p className="text-white/40 text-xs">{apt.duration} dk</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-white/40" />
                        <span className="text-white/50 text-xs">{apt.staffName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-white/40" />
                        <span className="text-white/50 text-xs">{apt.customerPhone}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                      {getStatusText(apt.status)}
                    </span>
                  </div>
                  {apt.price > 0 && (
                    <div className="mt-2 text-right">
                      <span className="text-green-400 font-semibold">₺{apt.price.toLocaleString('tr-TR')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-white/40" />
          </div>
          <p className="text-white/60">Bugün için randevu bulunmuyor</p>
          <button className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-sm font-medium">
            Randevu Ekle
          </button>
        </div>
      )}
    </div>
  );

  // Müşteriler İçeriği (placeholder)
  const renderCustomersContent = () => (
    <div className="space-y-4">
      <h2 className="text-white/80 font-semibold">Müşteriler</h2>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-white/40" />
        </div>
        <p className="text-white/60">Müşteri listesi yakında eklenecek</p>
      </div>
    </div>
  );

  // Ayarlar İçeriği
  const renderSettingsContent = () => (
    <div className="space-y-4">
      <h2 className="text-white/80 font-semibold">Ayarlar</h2>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
              <span className="text-blue-400 text-lg font-bold">
                {user?.firstName?.charAt(0) || "U"}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-white/50 text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        <button className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-white/60" />
            <span className="text-white/80">Profil Bilgileri</span>
          </div>
          <ChevronRight className="w-5 h-5 text-white/40" />
        </button>

        <button className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-t border-white/10">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-white/60" />
            <span className="text-white/80">Bildirimler</span>
          </div>
          <ChevronRight className="w-5 h-5 text-white/40" />
        </button>

        <button
          onClick={handleLogout}
          className="w-full p-4 flex items-center justify-between hover:bg-red-500/10 transition-colors border-t border-white/10"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 text-red-400" />
            <span className="text-red-400">Çıkış Yap</span>
          </div>
        </button>
      </div>

      <p className="text-center text-white/30 text-xs mt-6">
        Net Randevu v1.0.0
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col">
      {/* Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer Menu */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-[#1a1a2e] z-50 transform transition-transform duration-300 ${
        drawerOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] p-5 pt-12">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {user?.firstName?.charAt(0) || "U"}
              </span>
            </div>
            <button onClick={() => setDrawerOpen(false)} className="text-white/80 p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
          <h3 className="text-white font-semibold">{user?.firstName || "Kullanıcı"} {user?.lastName || ""}</h3>
          <p className="text-white/60 text-sm">{tenant?.businessName || "İşletme"}</p>
        </div>

        <div className="p-4">
          <div className="space-y-1">
            <button
              onClick={() => { setActiveTab("home"); setDrawerOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "home" ? "bg-blue-500/20 text-blue-400" : "text-white/80 hover:bg-white/5"}`}
            >
              <Home className="w-5 h-5" />
              <span>Ana Sayfa</span>
            </button>
            <button
              onClick={() => { setActiveTab("calendar"); setDrawerOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "calendar" ? "bg-blue-500/20 text-blue-400" : "text-white/80 hover:bg-white/5"}`}
            >
              <Calendar className="w-5 h-5" />
              <span>Randevular</span>
            </button>
            <button
              onClick={() => { setActiveTab("customers"); setDrawerOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "customers" ? "bg-blue-500/20 text-blue-400" : "text-white/80 hover:bg-white/5"}`}
            >
              <Users className="w-5 h-5" />
              <span>Müşteriler</span>
            </button>
            <button
              onClick={() => { setActiveTab("settings"); setDrawerOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "settings" ? "bg-blue-500/20 text-blue-400" : "text-white/80 hover:bg-white/5"}`}
            >
              <Settings className="w-5 h-5" />
              <span>Ayarlar</span>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className={`bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] px-5 pt-12 pb-6 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-11 h-11 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center active:scale-95 transition-transform"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          <div className="flex-1 mx-4">
            <h1 className="text-white text-lg font-bold">{getGreeting()}, {user?.firstName || "Kullanıcı"}</h1>
            <p className="text-white/60 text-sm">{tenant?.businessName || "İşletme"}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-11 h-11 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center active:scale-95 transition-transform"
          >
            <RefreshCw className={`w-5 h-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Bugünün Özeti */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/60 text-sm">Bugünün Özeti</span>
            <span className="text-white/40 text-xs">{formatDate(getTodayDate())}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.todayTotal}</p>
              <p className="text-white/50 text-xs">Toplam</p>
            </div>
            <div className="text-center border-x border-white/10">
              <p className="text-2xl font-bold text-green-400">{stats.todayCompleted}</p>
              <p className="text-white/50 text-xs">Tamamlanan</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{stats.todayPending}</p>
              <p className="text-white/50 text-xs">Bekleyen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className={`flex-1 px-5 py-6 overflow-y-auto transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {activeTab === "home" && renderHomeContent()}
        {activeTab === "calendar" && renderCalendarContent()}
        {activeTab === "customers" && renderCustomersContent()}
        {activeTab === "settings" && renderSettingsContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-[#1a1a2e] border-t border-white/10 px-4 py-2 pb-safe">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${activeTab === "home" ? "text-blue-400" : "text-white/40"}`}
          >
            <Home className={`w-6 h-6 ${activeTab === "home" ? "scale-110" : ""} transition-transform`} />
            <span className="text-[10px]">Ana Sayfa</span>
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${activeTab === "calendar" ? "text-blue-400" : "text-white/40"}`}
          >
            <Calendar className={`w-6 h-6 ${activeTab === "calendar" ? "scale-110" : ""} transition-transform`} />
            <span className="text-[10px]">Randevular</span>
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${activeTab === "customers" ? "text-blue-400" : "text-white/40"}`}
          >
            <Users className={`w-6 h-6 ${activeTab === "customers" ? "scale-110" : ""} transition-transform`} />
            <span className="text-[10px]">Müşteriler</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${activeTab === "settings" ? "text-blue-400" : "text-white/40"}`}
          >
            <Settings className={`w-6 h-6 ${activeTab === "settings" ? "scale-110" : ""} transition-transform`} />
            <span className="text-[10px]">Ayarlar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
