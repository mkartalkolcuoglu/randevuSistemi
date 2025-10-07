"use client";

import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "../components/ui";
import { Calendar, Users, BarChart3, CheckCircle, ArrowRight, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Randevu Sistemi</h1>
            </div>
            <nav className="flex space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900">
                Özellikler
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
                Fiyatlar
              </Link>
              <a href="http://localhost:3002" className="text-blue-600 hover:text-blue-700 font-medium">
                Project Admin
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Modern Randevu 
            <span className="text-blue-600"> Yönetim Sistemi</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            İşletmenizi dijitalleştirin. Müşterilerinizin kolayca randevu alabildiği, 
            siz de tüm operasyonlarınızı yönetebildiğiniz modern bir platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-4">
                <Calendar className="w-5 h-5 mr-2" />
                Hemen Başla
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Özellikleri İncele
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Neden Randevu Sistemi?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Kolay Randevu Yönetimi</h3>
                <p className="text-gray-600">
                  Online randevu sistemi ile müşterileriniz 7/24 randevu alabilir. 
                  Çakışmaları önleyin, zamanınızı optimize edin.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Müşteri Yönetimi</h3>
                <p className="text-gray-600">
                  Müşteri bilgilerini güvenle saklayın. Geçmiş randevularını, 
                  tercihlerini ve iletişim bilgilerini tek yerden yönetin.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Detaylı Raporlama</h3>
                <p className="text-gray-600">
                  İşletmenizin performansını takip edin. Gelir, müşteri ve 
                  randevu raporları ile veriye dayalı kararlar alın.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-16">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  İşletmenizi Büyütün
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Zaman Tasarrufu</h3>
                      <p className="text-gray-600">Manuel randevu yönetimini bırakın, otomatikleştirin</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Müşteri Memnuniyeti</h3>
                      <p className="text-gray-600">7/24 online randevu ile müşteri deneyimini geliştirin</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Gelir Artışı</h3>
                      <p className="text-gray-600">Daha fazla randevu, daha iyi organizasyon, daha fazla gelir</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8 text-center">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Hemen Başlayın</h3>
                <p className="text-gray-600 mb-6">Kurulum sadece 5 dakika!</p>
                <Link href="/admin">
                  <Button size="lg" className="w-full">
                    Ücretsiz Dene
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Basit ve Şeffaf Fiyatlandırma</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Başlangıç</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">Ücretsiz</div>
                <p className="text-gray-600 mb-6">İlk 30 gün</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    50 randevu/ay
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Temel raporlar
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Email desteği
                  </li>
                </ul>
                <Button variant="outline" className="w-full">Denemeye Başla</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-blue-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">Popüler</span>
              </div>
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Profesyonel</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">₺299</div>
                <p className="text-gray-600 mb-6">aylık</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Sınırsız randevu
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Gelişmiş raporlar
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    SMS bildirimleri
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Öncelikli destek
                  </li>
                </ul>
                <Button className="w-full">Hemen Başla</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Kurumsal</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">₺899</div>
                <p className="text-gray-600 mb-6">aylık</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Çoklu lokasyon
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    API erişimi
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Özel entegrasyonlar
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    7/24 destek
                  </li>
                </ul>
                <Button variant="outline" className="w-full">İletişime Geç</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">İşletmenizi Dijitalleştirmeye Hazır mısınız?</h2>
          <p className="text-xl mb-8 opacity-90">
            Binlerce işletme zaten Randevu Sistemi ile büyüyor. Siz de katılın!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/admin">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                <Star className="w-5 h-5 mr-2" />
                Ücretsiz Başla
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Randevu Sistemi</h3>
              <p className="text-gray-400">
                Modern işletmeler için tasarlanmış randevu yönetim platformu.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Ürün</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Özellikler</a></li>
                <li><a href="#pricing" className="hover:text-white">Fiyatlar</a></li>
                <li><a href="/admin" className="hover:text-white">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Destek</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Yardım Merkezi</a></li>
                <li><a href="#" className="hover:text-white">İletişim</a></li>
                <li><a href="#" className="hover:text-white">API Dokümantasyonu</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Şirket</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Hakkımızda</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Gizlilik</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400">
            <p>&copy; 2025 Randevu Sistemi. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}