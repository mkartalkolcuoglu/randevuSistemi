"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Building2, ArrowRight, Phone, Calendar } from "lucide-react";

export default function PWAWelcome() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Animasyon için mount durumu
    setTimeout(() => setMounted(true), 100);

    // Daha önce seçim yapılmış mı kontrol et
    const savedRole = localStorage.getItem("pwa-user-role");
    if (savedRole) {
      if (savedRole === "customer") {
        router.replace("/pwa/musteri");
      } else if (savedRole === "business") {
        router.replace("/pwa/isletme");
      }
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleRoleSelect = (role: "customer" | "business") => {
    localStorage.setItem("pwa-user-role", role);

    if (role === "customer") {
      router.push("/pwa/musteri");
    } else {
      router.push("/pwa/isletme");
    }
  };

  // Yükleniyor durumu
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
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex flex-col relative overflow-hidden">
      {/* Dekoratif Arka Plan */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/10 blur-3xl" />
        <div className="absolute bottom-[20%] left-[-10%] w-[250px] h-[250px] rounded-full bg-gradient-to-br from-indigo-500/15 to-blue-500/10 blur-3xl" />
        <div className="absolute bottom-[-5%] right-[10%] w-[200px] h-[200px] rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 blur-3xl" />
      </div>

      {/* Ana İçerik */}
      <div className={`flex-1 flex flex-col relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {/* Logo ve Başlık Alanı */}
        <div className="flex-1 flex flex-col items-center justify-center pt-12 pb-6 px-6">
          {/* Logo */}
          <div className={`w-24 h-24 bg-white rounded-3xl shadow-2xl shadow-black/20 flex items-center justify-center mb-8 transition-all duration-700 delay-100 ${mounted ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
            <img
              src="https://i.hizliresim.com/4a00l8g.png"
              alt="Net Randevu"
              className="h-14 w-auto"
            />
          </div>

          {/* Başlıklar */}
          <div className={`text-center transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Net Randevu
            </h1>
            <p className="text-white/60 text-base">
              Profesyonel Randevu Yönetimi
            </p>
          </div>

          {/* Hoş Geldiniz Mesajı */}
          <div className={`mt-8 px-6 py-3 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <p className="text-white/80 text-sm">
              <span className="mr-2">👋</span>
              Hoş geldiniz! Nasıl devam etmek istersiniz?
            </p>
          </div>
        </div>

        {/* Seçim Kartları */}
        <div className={`px-5 pb-6 space-y-3 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

          {/* Müşteri Girişi */}
          <button
            onClick={() => handleRoleSelect("customer")}
            className="w-full bg-white rounded-2xl p-4 text-left flex items-center gap-4 shadow-xl shadow-black/10 active:scale-[0.98] transition-transform duration-150"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
              <User className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">Müşteri Girişi</h2>
              <p className="text-gray-500 text-sm truncate">Randevularınızı görüntüleyin</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </div>
          </button>

          {/* İşletme Girişi */}
          <button
            onClick={() => handleRoleSelect("business")}
            className="w-full bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] rounded-2xl p-4 text-left flex items-center gap-4 shadow-xl shadow-black/20 active:scale-[0.98] transition-transform duration-150 border border-white/10"
          >
            <div className="w-14 h-14 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-white">İşletme Girişi</h2>
              <p className="text-white/60 text-sm truncate">İşletme panelinize erişin</p>
            </div>
            <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center flex-shrink-0">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </button>
        </div>

        {/* Alt Bilgi */}
        <div className={`pb-8 px-6 transition-all duration-700 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          {/* Destek */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
              <Phone className="w-4 h-4 text-white/60" />
            </div>
            <a
              href="tel:08503036723"
              className="text-white/60 text-sm hover:text-white transition-colors"
            >
              Destek: <span className="text-white font-medium">0850 303 67 23</span>
            </a>
          </div>

          {/* Versiyon */}
          <p className="text-center text-white/30 text-xs">
            Net Randevu v1.0.0
          </p>
        </div>
      </div>

      {/* Safe Area (iOS için) */}
      <div className="h-safe-area-inset-bottom bg-transparent"></div>
    </div>
  );
}
