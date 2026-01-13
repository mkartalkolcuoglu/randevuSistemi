"use client";

import { useState } from "react";
import { Calendar, Users, BarChart3, Clock, Bell, CreditCard, Check, Star, Shield } from "lucide-react";

export default function AppStoreScreenshots() {
  const [currentScreen, setCurrentScreen] = useState(0);

  const screens = [
    // Screen 1: Hero / Ana Özellik
    {
      id: 1,
      title: "7/24 Online Randevu",
      content: (
        <div className="h-full bg-gradient-to-br from-[#163974] to-[#0F2A52] flex flex-col items-center justify-center p-8 text-white">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mb-8">
            <Calendar className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-4">7/24 Online Randevu</h1>
          <p className="text-lg text-white/80 text-center mb-8">Müşterileriniz her an, her yerden randevu alabilir</p>

          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Yeni Randevu</p>
                <p className="text-sm text-gray-500">Bugün 14:30</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Hizmet</span>
                <span className="font-medium text-gray-900">Saç Kesimi</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Personel</span>
                <span className="font-medium text-gray-900">Ahmet Usta</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Süre</span>
                <span className="font-medium text-gray-900">45 dk</span>
              </div>
            </div>
            <button className="w-full mt-4 bg-[#163974] text-white py-3 rounded-xl font-semibold">
              Randevuyu Onayla
            </button>
          </div>
        </div>
      )
    },
    // Screen 2: SMS Hatırlatma
    {
      id: 2,
      title: "SMS & WhatsApp Hatırlatma",
      content: (
        <div className="h-full bg-gradient-to-br from-green-500 to-emerald-600 flex flex-col items-center justify-center p-8 text-white">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mb-8">
            <Bell className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-4">Otomatik Hatırlatma</h1>
          <p className="text-lg text-white/80 text-center mb-8">SMS ve WhatsApp ile randevu hatırlatmaları</p>

          <div className="space-y-4 w-full max-w-xs">
            <div className="bg-white rounded-2xl p-4 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">💬</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">SMS - 1 gün önce</p>
                  <p className="text-sm text-gray-800">Sayın Ayşe Hanım, yarın saat 14:30'da Net Kuaför'de randevunuz var. İyi günler!</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📱</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">WhatsApp - 2 saat önce</p>
                  <p className="text-sm text-gray-800">Randevunuza 2 saat kaldı! 📍 Net Kuaför, Merkez Mah.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    // Screen 3: Ödeme
    {
      id: 3,
      title: "Kredi Kartı ile Ödeme",
      content: (
        <div className="h-full bg-gradient-to-br from-purple-500 to-pink-500 flex flex-col items-center justify-center p-8 text-white">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mb-8">
            <CreditCard className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-4">Güvenli Ödeme</h1>
          <p className="text-lg text-white/80 text-center mb-8">PayTR altyapısı ile online ödeme alın</p>

          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-600">Toplam Tutar</span>
              <span className="text-3xl font-bold text-gray-900">₺150</span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" />
                <span>3D Secure Korumalı</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" />
                <span>Tüm Kartlar Geçerli</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" />
                <span>Anında Onay</span>
              </div>
            </div>

            <div className="flex justify-center gap-2 mb-4">
              <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">VISA</span>
              </div>
              <div className="w-12 h-8 bg-red-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">MC</span>
              </div>
              <div className="w-12 h-8 bg-orange-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">TROY</span>
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold">
              Ödemeyi Tamamla
            </button>
          </div>
        </div>
      )
    },
    // Screen 4: Takvim Görünümü
    {
      id: 4,
      title: "Randevu Takvimi",
      content: (
        <div className="h-full bg-gradient-to-br from-blue-500 to-cyan-500 flex flex-col items-center justify-center p-8 text-white">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mb-8">
            <Clock className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-4">Kolay Takvim</h1>
          <p className="text-lg text-white/80 text-center mb-8">Tüm randevularınız tek ekranda</p>

          <div className="bg-white rounded-2xl p-4 w-full max-w-xs shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-900">Ocak 2025</span>
              <span className="text-sm text-gray-500">Bugün</span>
            </div>

            <div className="space-y-2">
              {[
                { time: "09:00", name: "Mehmet K.", service: "Saç Kesimi", color: "bg-blue-100 border-blue-400" },
                { time: "10:30", name: "Ayşe Y.", service: "Saç Boyama", color: "bg-purple-100 border-purple-400" },
                { time: "14:00", name: "Ali D.", service: "Sakal Tıraşı", color: "bg-green-100 border-green-400" },
                { time: "16:30", name: "Zeynep A.", service: "Manikür", color: "bg-pink-100 border-pink-400" },
              ].map((apt, i) => (
                <div key={i} className={`${apt.color} border-l-4 rounded-r-lg p-3`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{apt.name}</p>
                      <p className="text-xs text-gray-600">{apt.service}</p>
                    </div>
                    <span className="text-xs font-medium text-gray-700">{apt.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    // Screen 5: Raporlar
    {
      id: 5,
      title: "Detaylı Raporlar",
      content: (
        <div className="h-full bg-gradient-to-br from-orange-500 to-red-500 flex flex-col items-center justify-center p-8 text-white">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mb-8">
            <BarChart3 className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-4">Detaylı Raporlar</h1>
          <p className="text-lg text-white/80 text-center mb-8">İşletmenizin performansını analiz edin</p>

          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl">
            <p className="text-sm text-gray-500 mb-4">Bu Ay</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">156</p>
                <p className="text-xs text-gray-600">Randevu</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">₺12.4K</p>
                <p className="text-xs text-gray-600">Gelir</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">89</p>
                <p className="text-xs text-gray-600">Müşteri</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">%94</p>
                <p className="text-xs text-gray-600">Doluluk</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
              ))}
              <span className="ml-2 text-sm text-gray-600">4.9 Puan</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Kontroller */}
      <div className="max-w-md mx-auto mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {screens.map((screen, index) => (
            <button
              key={screen.id}
              onClick={() => setCurrentScreen(index)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                currentScreen === index
                  ? 'bg-white text-gray-900'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {index + 1}. {screen.title}
            </button>
          ))}
        </div>
      </div>

      {/* iPhone Frame */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          {/* iPhone Frame */}
          <div className="bg-black rounded-[3rem] p-3 shadow-2xl">
            {/* Notch */}
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-10"></div>

            {/* Screen */}
            <div className="bg-white rounded-[2.5rem] overflow-hidden" style={{ height: '812px' }}>
              {/* Status Bar */}
              <div className="h-12 bg-black/5 flex items-center justify-between px-8 pt-2">
                <span className="text-sm font-medium">9:41</span>
                <div className="flex items-center gap-1">
                  <div className="flex gap-0.5">
                    <div className="w-1 h-1 bg-black rounded-full"></div>
                    <div className="w-1 h-1 bg-black rounded-full"></div>
                    <div className="w-1 h-1 bg-black rounded-full"></div>
                    <div className="w-1 h-1 bg-black rounded-full"></div>
                  </div>
                  <span className="text-xs ml-1">5G</span>
                  <div className="w-6 h-3 border border-black rounded-sm ml-1">
                    <div className="w-4 h-full bg-black rounded-sm"></div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="h-[760px]">
                {screens[currentScreen].content}
              </div>
            </div>
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white rounded-full"></div>
        </div>
      </div>

      {/* Bilgi */}
      <div className="max-w-md mx-auto mt-6 text-center text-gray-400 text-sm">
        <p>iPhone 15 Pro Max boyutu: 1290 x 2796 px</p>
        <p className="mt-1">Her ekranı tam ekran yapıp screenshot alın</p>
      </div>
    </div>
  );
}
