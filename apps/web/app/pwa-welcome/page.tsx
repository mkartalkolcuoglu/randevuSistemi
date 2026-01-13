"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Building2, Calendar, ArrowRight } from "lucide-react";

export default function PWAWelcome() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // PWA modunda mı kontrol et
    const checkPWA = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone
      || document.referrer.includes('android-app://');
    setIsPWA(checkPWA);

    // Daha önce seçim yapılmış mı kontrol et
    const savedRole = localStorage.getItem("pwa-user-role");
    if (savedRole) {
      // Seçime göre yönlendir
      if (savedRole === "customer") {
        router.replace("/randevularim");
      } else if (savedRole === "business") {
        window.location.href = "https://admin.netrandevu.com";
      }
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleRoleSelect = (role: "customer" | "business") => {
    localStorage.setItem("pwa-user-role", role);

    if (role === "customer") {
      router.push("/randevularim");
    } else {
      window.location.href = "https://admin.netrandevu.com";
    }
  };

  // Loading spinner
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isPWA ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2]' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isPWA ? 'border-white' : 'border-[#163974]'}`}></div>
      </div>
    );
  }

  // PWA Mobil Tasarım
  if (isPWA) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] flex flex-col relative overflow-hidden">
        {/* Dekoratif Daireler */}
        <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] rounded-full bg-white/10" />
        <div className="absolute bottom-[100px] left-[-80px] w-[250px] h-[250px] rounded-full bg-white/5" />
        <div className="absolute bottom-[-100px] right-[50px] w-[180px] h-[180px] rounded-full bg-white/10" />

        {/* Logo ve Başlık */}
        <div className="flex-1 flex flex-col items-center justify-center pt-16 pb-8 px-6">
          {/* Logo */}
          <div className="w-[100px] h-[100px] bg-white rounded-[28px] shadow-xl flex items-center justify-center mb-6">
            <div className="w-[70px] h-[70px] bg-[#667eea]/10 rounded-[20px] flex items-center justify-center">
              <Calendar className="w-12 h-12 text-[#667eea]" />
            </div>
          </div>

          {/* Başlıklar */}
          <h1 className="text-4xl font-bold text-white mb-2">Net Randevu</h1>
          <p className="text-white/80 text-lg">Profesyonel Randevu Yönetimi</p>
        </div>

        {/* Kartlar */}
        <div className="px-6 pb-8 space-y-4">
          {/* İşletme Girişi Kartı */}
          <button
            onClick={() => handleRoleSelect("business")}
            className="w-full bg-gradient-to-r from-[#667eea]/80 to-[#764ba2]/80 backdrop-blur-sm rounded-[20px] p-5 text-left flex items-center gap-4 hover:from-[#667eea] hover:to-[#764ba2] transition-all"
          >
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">İşletme Girişi</h2>
              <p className="text-white/70 text-sm">İşletme sahibi veya personel olarak giriş yapın</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Müşteri Girişi Kartı */}
          <button
            onClick={() => handleRoleSelect("customer")}
            className="w-full bg-white rounded-[20px] p-5 text-left flex items-center gap-4 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="w-14 h-14 bg-[#667eea]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-[#667eea]" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800">Müşteri Girişi</h2>
              <p className="text-gray-500 text-sm">Randevularınızı görüntüleyin ve yönetin</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <ArrowRight className="w-5 h-5 text-[#667eea]" />
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="pb-8 px-6 text-center">
          <p className="text-white/60 text-sm mb-2">
            Henüz hesabınız yok mu?{" "}
            <a href="https://netrandevu.com/register" className="text-white font-semibold">
              İletişime Geçin
            </a>
          </p>
          <p className="text-white/40 text-xs">v1.0.0</p>
        </div>
      </div>
    );
  }

  // Web Tarayıcı Tasarımı (Mevcut)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-8 px-6 text-center">
        <img
          src="https://i.hizliresim.com/4a00l8g.png"
          alt="Net Randevu Logo"
          className="h-12 w-auto mx-auto mb-6"
        />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Hoş Geldiniz!
        </h1>
        <p className="text-gray-600">
          Nasıl devam etmek istersiniz?
        </p>
      </div>

      {/* Cards */}
      <div className="flex-1 px-6 pb-12 flex flex-col justify-center gap-6 max-w-md mx-auto w-full">
        {/* Müşteri Kartı */}
        <button
          onClick={() => handleRoleSelect("customer")}
          className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-[#163974] group text-left"
        >
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-between">
                Müşteri Girişi
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#163974] group-hover:translate-x-1 transition-all" />
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Randevularınızı görüntüleyin, yeni randevu alın ve geçmiş randevularınıza ulaşın.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
            <Calendar className="w-4 h-4" />
            <span>Randevularım</span>
          </div>
        </button>

        {/* İşletme Kartı */}
        <button
          onClick={() => handleRoleSelect("business")}
          className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-[#163974] group text-left"
        >
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#163974] to-[#0F2A52] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-between">
                İşletme Girişi
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#163974] group-hover:translate-x-1 transition-all" />
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                İşletme panelinize giriş yapın, randevuları yönetin ve raporları görüntüleyin.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-[#163974]">
            <Building2 className="w-4 h-4" />
            <span>Admin Paneli</span>
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="pb-8 px-6 text-center">
        <p className="text-xs text-gray-500">
          Seçiminiz hatırlanacak. Değiştirmek için ayarları kullanın.
        </p>
      </div>
    </div>
  );
}
