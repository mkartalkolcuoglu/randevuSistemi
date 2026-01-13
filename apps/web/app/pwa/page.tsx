"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Building2, Calendar, ArrowRight, Phone } from "lucide-react";

export default function PWAWelcome() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // PWA modunda mi kontrol et
    const checkPWA = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone
      || document.referrer.includes('android-app://');
    setIsPWA(checkPWA);

    // Daha once secim yapilmis mi kontrol et
    const savedRole = localStorage.getItem("pwa-user-role");
    if (savedRole) {
      // Secime gore yonlendir
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

  // Loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#163974] to-[#0F2A52]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#163974] to-[#0F2A52] flex flex-col relative overflow-hidden">
      {/* Dekoratif Daireler */}
      <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] rounded-full bg-white/5" />
      <div className="absolute bottom-[100px] left-[-80px] w-[250px] h-[250px] rounded-full bg-white/5" />
      <div className="absolute bottom-[-100px] right-[50px] w-[180px] h-[180px] rounded-full bg-white/5" />

      {/* Logo ve Baslik */}
      <div className="flex-1 flex flex-col items-center justify-center pt-16 pb-8 px-6">
        {/* Logo */}
        <div className="w-[100px] h-[100px] bg-white rounded-[28px] shadow-xl flex items-center justify-center mb-6">
          <img
            src="https://i.hizliresim.com/4a00l8g.png"
            alt="Net Randevu Logo"
            className="h-16 w-auto"
          />
        </div>

        {/* Basliklar */}
        <h1 className="text-4xl font-bold text-white mb-2">Net Randevu</h1>
        <p className="text-white/80 text-lg text-center">Profesyonel Randevu Yonetimi</p>
      </div>

      {/* Kartlar */}
      <div className="px-6 pb-8 space-y-4">
        {/* Musteri Girisi Karti */}
        <button
          onClick={() => handleRoleSelect("customer")}
          className="w-full bg-white rounded-[20px] p-5 text-left flex items-center gap-4 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <div className="w-14 h-14 bg-[#163974]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-[#163974]" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-800">Musteri Girisi</h2>
            <p className="text-gray-500 text-sm">Randevularinizi goruntuleyin ve yonetin</p>
          </div>
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <ArrowRight className="w-5 h-5 text-[#163974]" />
          </div>
        </button>

        {/* Isletme Girisi Karti */}
        <button
          onClick={() => handleRoleSelect("business")}
          className="w-full bg-white/10 backdrop-blur-sm rounded-[20px] p-5 text-left flex items-center gap-4 hover:bg-white/20 transition-all active:scale-[0.98]"
        >
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">Isletme Girisi</h2>
            <p className="text-white/70 text-sm">Isletme panelinize erisim saglayın</p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="pb-8 px-6 text-center">
        <p className="text-white/60 text-sm mb-2">
          Yardim icin:{" "}
          <a href="tel:08503036723" className="text-white font-semibold">
            0850 303 67 23
          </a>
        </p>
        <p className="text-white/40 text-xs">v1.0.0</p>
      </div>
    </div>
  );
}
