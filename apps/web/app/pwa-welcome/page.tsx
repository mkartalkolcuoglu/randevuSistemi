"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Building2, Calendar, ArrowRight } from "lucide-react";

export default function PWAWelcome() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#163974]"></div>
      </div>
    );
  }

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
