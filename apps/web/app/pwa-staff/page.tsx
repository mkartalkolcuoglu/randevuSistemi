"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import {
  Menu, Bell, Calendar, CheckCircle, Clock, DollarSign,
  Plus, Users, CalendarDays, Home, List, ChevronRight,
  CheckCircle2, Gift, LogOut, Settings, BarChart3, TrendingUp,
  Wallet, Package, Scissors, X
} from "lucide-react";

// Tema rengi
const THEME_COLOR = "#163974";

// Selamlama fonksiyonu
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
};

// Bugünün tarihi
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export default function PWAStaffDashboard() {
  const router = useRouter();
  const [isPWA, setIsPWA] = useState<boolean | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  // Kullanıcı ve işletme bilgileri
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);

  // İstatistikler (şimdilik mock)
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayCompleted: 0,
    todayPending: 31,
    todayRevenue: 0,
    weekRevenue: 0,
    completedCount: 0
  });

  // Yaklaşan randevular (şimdilik mock - boş)
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);

  // Bildirim sayısı
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    // PWA modunda mı kontrol et
    const checkPWA = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone
      || document.referrer.includes('android-app://');

    if (!checkPWA) {
      // PWA değilse admin panele yönlendir
      window.location.href = "https://admin.netrandevu.com";
    } else {
      setIsPWA(true);

      // localStorage'dan kullanıcı bilgilerini oku
      const savedUser = localStorage.getItem("pwa-user");
      const authToken = localStorage.getItem("pwa-auth-token");

      if (savedUser && authToken) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setTenant({
            businessName: userData.tenantName || "İşletme"
          });

          // Dashboard verilerini çek
          fetchDashboardData(authToken, userData.tenantId);
        } catch (e) {
          // Parse hatası - login'e yönlendir
          router.replace("/pwa-business-login");
        }
      } else {
        // Giriş yapılmamış - login'e yönlendir
        router.replace("/pwa-business-login");
      }

      setIsLoading(false);
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
          // İstatistikleri hesapla
          const today = getTodayDate();
          const appointments = data.data || [];

          const todayAppointments = appointments.filter((apt: any) => apt.date === today);
          const pendingCount = appointments.filter((apt: any) => apt.status === "pending").length;
          const completedToday = todayAppointments.filter((apt: any) => apt.status === "completed").length;
          const todayRevenue = todayAppointments
            .filter((apt: any) => apt.status === "completed")
            .reduce((sum: number, apt: any) => sum + (apt.price || 0), 0);

          setStats({
            todayTotal: todayAppointments.length,
            todayCompleted: completedToday,
            todayPending: pendingCount,
            todayRevenue: todayRevenue,
            weekRevenue: 0,
            completedCount: completedToday
          });

          // Yaklaşan randevuları ayarla
          const now = new Date();
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const upcoming = todayAppointments
            .filter((apt: any) =>
              apt.time >= currentTime &&
              apt.status !== "completed" &&
              apt.status !== "cancelled" &&
              apt.status !== "no_show"
            )
            .slice(0, 3);

          setUpcomingAppointments(upcoming);
        }
      }
    } catch (error) {
      console.error("Dashboard veri çekme hatası:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("pwa-user-role");
    localStorage.removeItem("pwa-auth-token");
    router.replace("/pwa-welcome");
  };

  // Drawer menü öğeleri
  const menuItems = [
    { section: "ANA MENÜ", items: [
      { label: "Ana Sayfa", icon: Home, route: "/pwa-staff", color: "#163974", bg: "#EFF6FF" },
      { label: "Randevular", icon: Calendar, route: "/pwa-staff/appointments", color: "#8B5CF6", bg: "#F3E8FF" },
      { label: "Müşteriler", icon: Users, route: "/pwa-staff/customers", color: "#10B981", bg: "#D1FAE5" },
    ]},
    { section: "İŞLETME YÖNETİMİ", items: [
      { label: "Hizmetler", icon: Scissors, route: "/pwa-staff/services", color: "#EC4899", bg: "#FCE7F3" },
      { label: "Personel", icon: Users, route: "/pwa-staff/team", color: "#06B6D4", bg: "#ECFEFF" },
      { label: "Paketler", icon: Gift, route: "/pwa-staff/packages", color: "#6366F1", bg: "#E0E7FF" },
      { label: "Stok Yönetimi", icon: Package, route: "/pwa-staff/stock", color: "#14B8A6", bg: "#CCFBF1" },
    ]},
    { section: "FİNANS & RAPORLAR", items: [
      { label: "Kasa", icon: Wallet, route: "/pwa-staff/cashier", color: "#22C55E", bg: "#DCFCE7" },
      { label: "Raporlar", icon: BarChart3, route: "/pwa-staff/reports", color: "#3B82F6", bg: "#DBEAFE" },
      { label: "Performans", icon: TrendingUp, route: "/pwa-staff/performance", color: "#F97316", bg: "#FFEDD5" },
    ]},
  ];

  // Yükleniyor durumu
  if (isPWA === null || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#163974] to-[#1e4a8f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col pb-16">
      {/* Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer Menu */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 ${
        drawerOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Drawer Header */}
        <div className="bg-gradient-to-r from-[#163974] to-[#1e4a8f] p-6 pt-12">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {user?.firstName?.charAt(0) || "U"}
              </span>
            </div>
            <button onClick={() => setDrawerOpen(false)} className="text-white/80">
              <X className="w-6 h-6" />
            </button>
          </div>
          <h3 className="text-white font-semibold">{user?.firstName || "Kullanıcı"} {user?.lastName || ""}</h3>
          <p className="text-white/70 text-sm">{tenant?.businessName || "İşletme"}</p>
        </div>

        {/* Drawer Menu Items */}
        <div className="p-4 overflow-y-auto h-[calc(100%-200px)]">
          {menuItems.map((section, idx) => (
            <div key={idx} className="mb-4">
              <p className="text-xs font-semibold text-gray-400 mb-2 px-2">{section.section}</p>
              {section.items.map((item, itemIdx) => (
                <button
                  key={itemIdx}
                  onClick={() => {
                    setDrawerOpen(false);
                    // router.push(item.route);
                    alert(`${item.label} sayfası yakında eklenecek`);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: item.bg }}>
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <span className="text-gray-700 font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Drawer Footer - Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <span className="font-medium">Çıkış Yap</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#163974] to-[#1e4a8f] rounded-b-[32px] overflow-hidden">
        <div className="px-5 pt-12 pb-6">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
            <div className="flex-1 mx-4">
              <h1 className="text-white text-xl font-bold">{getGreeting()}, {user?.firstName || "Kullanıcı"}</h1>
              <p className="text-white/70 text-sm">{tenant?.businessName || "İşletme"}</p>
            </div>
            <button className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center relative">
              <Bell className="w-6 h-6 text-white" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/10 rounded-2xl p-3 text-center">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-5 h-5 text-blue-300" />
              </div>
              <p className="text-white text-xl font-bold">{stats.todayTotal}</p>
              <p className="text-white/60 text-xs">Bugün</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 text-center">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
              </div>
              <p className="text-white text-xl font-bold">{stats.todayCompleted}</p>
              <p className="text-white/60 text-xs">Tamam</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 text-center">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-orange-300" />
              </div>
              <p className="text-white text-xl font-bold">{stats.todayPending}</p>
              <p className="text-white/60 text-xs">Bekleyen</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 text-center">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-5 h-5 text-purple-300" />
              </div>
              <p className="text-white text-xl font-bold">{stats.todayRevenue}</p>
              <p className="text-white/60 text-xs">Kazanç ₺</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6 space-y-6">
        {/* Bugünkü Gelir Kartı */}
        <div className="bg-gradient-to-r from-[#163974] to-[#1e4a8f] rounded-3xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <span className="text-white/80">Bugünkü Gelir</span>
          </div>
          <p className="text-white text-4xl font-bold mb-4">{stats.todayRevenue} ₺</p>
          <div className="flex items-center justify-between pt-4 border-t border-white/20">
            <div className="text-center">
              <p className="text-white/60 text-sm">Bu Hafta</p>
              <p className="text-white font-semibold">{stats.weekRevenue} ₺</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-white/60 text-sm">Tamamlanan</p>
              <p className="text-white font-semibold">{stats.completedCount} randevu</p>
            </div>
          </div>
        </div>

        {/* Yaklaşan Randevular */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-800 text-lg font-semibold">Yaklaşan Randevular</h2>
            <button className="flex items-center gap-1 text-[#163974] text-sm font-medium">
              Tümü <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-700 font-medium mb-1">Yaklaşan randevu yok</p>
              <p className="text-gray-400 text-sm">Bugünkü tüm randevular tamamlandı</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((apt, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm">
                  {/* Randevu kartı içeriği */}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hızlı İşlemler */}
        <div>
          <h2 className="text-gray-800 text-lg font-semibold mb-4">Hızlı İşlemler</h2>
          <div className="flex gap-4">
            <button
              onClick={() => alert("Yeni Randevu özelliği yakında eklenecek")}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-[#163974]" />
              </div>
              <span className="text-gray-600 text-sm">Yeni Randevu</span>
            </button>
            <button
              onClick={() => alert("Müşteriler sayfası yakında eklenecek")}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-gray-600 text-sm">Müşteriler</span>
            </button>
            <button
              onClick={() => alert("Takvim sayfası yakında eklenecek")}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-gray-600 text-sm">Takvim</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Tab Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex justify-around">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex-1 flex flex-col items-center py-2 ${activeTab === "home" ? "text-[#163974]" : "text-gray-400"}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">Ana Sayfa</span>
        </button>
        <button
          onClick={() => setActiveTab("appointments")}
          className={`flex-1 flex flex-col items-center py-2 ${activeTab === "appointments" ? "text-[#163974]" : "text-gray-400"}`}
        >
          <List className="w-6 h-6" />
          <span className="text-xs mt-1">Randevular</span>
        </button>
        <button
          onClick={() => setActiveTab("customers")}
          className={`flex-1 flex flex-col items-center py-2 ${activeTab === "customers" ? "text-[#163974]" : "text-gray-400"}`}
        >
          <Users className="w-6 h-6" />
          <span className="text-xs mt-1">Müşteriler</span>
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex-1 flex flex-col items-center py-2 ${activeTab === "calendar" ? "text-[#163974]" : "text-gray-400"}`}
        >
          <CalendarDays className="w-6 h-6" />
          <span className="text-xs mt-1">Takvim</span>
        </button>
      </div>
    </div>
  );
}
