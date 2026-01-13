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
  AlertCircle,
  Home,
  Settings,
  LogOut,
  ChevronRight,
  Plus,
  BarChart3,
  Wallet
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

export default function PWAIsletmePanel() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  // Kullanıcı ve işletme bilgileri
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);

  // İstatistikler
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayCompleted: 0,
    todayPending: 0,
    todayRevenue: 0,
  });

  // Yaklaşan randevular
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);

    // Giriş kontrolü
    const authToken = localStorage.getItem("pwa-auth-token");
    const savedUser = localStorage.getItem("pwa-user");

    if (!authToken || !savedUser) {
      router.replace("/pwa/isletme");
      return;
    }

    try {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setTenant({
        businessName: userData.tenantName || "İşletme"
      });

      // Dashboard verilerini çek
      fetchDashboardData(authToken, userData.tenantId);
    } catch (e) {
      router.replace("/pwa/isletme");
    }

    setIsLoading(false);
  }, [router]);

  const fetchDashboardData = async (token: string, tenantId: string) => {
    try {
      const response = await fetch("https://admin.netrandevu.com/api/mobile/staff/appointments", {
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

          const todayAppointments = appointments.filter((apt: any) => apt.date === today);
          const pendingCount = todayAppointments.filter((apt: any) => apt.status === "pending").length;
          const completedToday = todayAppointments.filter((apt: any) => apt.status === "completed").length;
          const todayRevenue = todayAppointments
            .filter((apt: any) => apt.status === "completed")
            .reduce((sum: number, apt: any) => sum + (apt.price || 0), 0);

          setStats({
            todayTotal: todayAppointments.length,
            todayCompleted: completedToday,
            todayPending: pendingCount,
            todayRevenue: todayRevenue,
          });

          // Yaklaşan randevular
          const now = new Date();
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const upcoming = todayAppointments
            .filter((apt: any) =>
              apt.time >= currentTime &&
              apt.status !== "completed" &&
              apt.status !== "cancelled"
            )
            .sort((a: any, b: any) => a.time.localeCompare(b.time))
            .slice(0, 3);

          setUpcomingAppointments(upcoming);
        }
      }
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    }
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
        {/* Drawer Header */}
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

        {/* Drawer Menu Items */}
        <div className="p-4">
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition-colors">
              <Home className="w-5 h-5" />
              <span>Ana Sayfa</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition-colors">
              <Calendar className="w-5 h-5" />
              <span>Randevular</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition-colors">
              <Users className="w-5 h-5" />
              <span>Müşteriler</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition-colors">
              <BarChart3 className="w-5 h-5" />
              <span>Raporlar</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition-colors">
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
          <button className="w-11 h-11 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center relative">
            <Bell className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Bugünün Özeti */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/60 text-sm">Bugünün Özeti</span>
            <span className="text-white/40 text-xs">{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
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
      <div className={`flex-1 px-5 py-6 space-y-5 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

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
            <button className="text-blue-400 text-sm flex items-center gap-1">
              Tümü <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((apt, index) => (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{apt.customerName || "Müşteri"}</p>
                    <p className="text-white/50 text-sm">{apt.serviceName || "Hizmet"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{apt.time}</p>
                    <p className="text-white/40 text-xs">Bugün</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-white/40" />
              </div>
              <p className="text-white/60 text-sm">Bugün için bekleyen randevu yok</p>
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
      </div>

      {/* Bottom Navigation */}
      <div className="bg-[#1a1a2e] border-t border-white/10 px-6 py-3 pb-safe">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors ${activeTab === "home" ? "text-blue-400" : "text-white/40"}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs">Ana Sayfa</span>
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors ${activeTab === "calendar" ? "text-blue-400" : "text-white/40"}`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs">Randevular</span>
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors ${activeTab === "customers" ? "text-blue-400" : "text-white/40"}`}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs">Müşteriler</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors ${activeTab === "settings" ? "text-blue-400" : "text-white/40"}`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs">Ayarlar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
