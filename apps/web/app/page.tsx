"use client";

import Link from "next/link";
import { Button, Card, CardContent } from "../components/ui";
import { 
  Calendar, 
  Users, 
  BarChart3, 
  CheckCircle, 
  ArrowRight, 
  Star,
  Clock,
  Smartphone,
  TrendingUp,
  Shield,
  Zap,
  Heart,
  MessageCircle,
  Award,
  Check,
  ChevronDown
} from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg"></div>
              <span className="text-xl font-bold text-gray-900">Randevu Sistemi</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Özellikler</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition">Fiyatlar</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 transition">SSS</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/register">
                <Button className="bg-gradient-to-r from-green-400 to-blue-500 text-white hover:shadow-lg transition">
                  Ücretsiz Başla
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 opacity-70"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <div className="inline-block mb-4 px-4 py-2 bg-green-100 rounded-full">
              <span className="text-green-700 font-medium text-sm">✨ Modern İşletmeler İçin</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Randevularınızı<br />
              <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Dijitalleştirin
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Müşterileriniz 7/24 randevu alsın, siz işinize odaklanın. 
              Modern, hızlı ve kullanımı kolay randevu yönetim sistemi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-green-400 to-blue-500 text-white hover:shadow-xl transition">
                  <Calendar className="w-5 h-5 mr-2" />
                  15 Gün Ücretsiz Dene
                </Button>
              </Link>
              <a href="#demo">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-2">
                  Demo İzle
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
            </div>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Kredi kartı gerektirmez
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                5 dakikada kurulum
              </div>
            </div>
          </div>

          {/* Hero Image/Mockup */}
          <div className="mt-16 relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 mx-auto max-w-5xl border border-gray-100">
              <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="w-24 h-24 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Dashboard Önizleme</p>
                </div>
              </div>
            </div>
            {/* Floating Elements */}
            <div className="absolute top-10 -left-10 bg-white rounded-xl shadow-lg p-4 hidden lg:block">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Bugün</p>
                  <p className="font-semibold text-gray-900">24 Randevu</p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-10 -right-10 bg-white rounded-xl shadow-lg p-4 hidden lg:block">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Bu Ay</p>
                  <p className="font-semibold text-gray-900">+42% Artış</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">500+</div>
              <div className="text-gray-600">Aktif İşletme</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">50K+</div>
              <div className="text-gray-600">Aylık Randevu</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">98%</div>
              <div className="text-gray-600">Müşteri Memnuniyeti</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">7/24</div>
              <div className="text-gray-600">Destek</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              İşinizi Kolaylaştıran Özellikler
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Her şey tek bir platformda. Randevu yönetiminden raporlamaya kadar ihtiyacınız olan her şey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            {[
              {
                icon: Calendar,
                title: "Online Randevu",
                description: "Müşterileriniz 7/24 online randevu alabilir. Çakışmaları otomatik önler, zamanınızı optimize eder.",
                color: "from-green-400 to-emerald-400"
              },
              {
                icon: Users,
                title: "Müşteri Yönetimi",
                description: "Müşteri bilgilerini güvenle saklayın. Geçmiş randevular, tercihler ve iletişim bilgileri tek yerde.",
                color: "from-blue-400 to-cyan-400"
              },
              {
                icon: BarChart3,
                title: "Detaylı Raporlar",
                description: "İşletmenizin performansını takip edin. Gelir, müşteri ve randevu raporlarıyla veriye dayalı kararlar alın.",
                color: "from-purple-400 to-pink-400"
              },
              {
                icon: Smartphone,
                title: "Mobil Uyumlu",
                description: "Tüm cihazlarda mükemmel çalışır. Müşterileriniz telefonlarından kolayca randevu alır.",
                color: "from-orange-400 to-red-400"
              },
              {
                icon: MessageCircle,
                title: "SMS Bildirimleri",
                description: "Otomatik hatırlatmalar gönder. Müşterileriniz randevularını asla kaçırmasın.",
                color: "from-indigo-400 to-blue-400"
              },
              {
                icon: Shield,
                title: "Güvenli & Hızlı",
                description: "Verileriniz şifreli ve güvende. Hızlı ve kesintisiz hizmet garantisi.",
                color: "from-teal-400 to-green-400"
              }
            ].map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-gray-200">
                <CardContent className="p-8">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nasıl Çalışır?
            </h2>
            <p className="text-xl text-gray-600">3 basit adımda başlayın</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Kayıt Olun",
                description: "Ücretsiz hesap oluşturun. Kredi kartı gerektirmez, 5 dakikada hazırsınız."
              },
              {
                step: "2",
                title: "Ayarları Yapın",
                description: "İşletme bilgilerinizi, çalışma saatlerinizi ve hizmetlerinizi ekleyin."
              },
              {
                step: "3",
                title: "Randevu Alın",
                description: "Müşterilerinizle paylaşın. Randevular otomatik olarak gelmeye başlasın!"
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <span className="text-2xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{item.title}</h3>
                  <p className="text-gray-600 text-center leading-relaxed">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Müşterilerimiz Ne Diyor?
            </h2>
            <p className="text-xl text-gray-600">500+ mutlu işletme sahibinden bazıları</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Ayşe Yılmaz",
                role: "Kuaför Salonu Sahibi",
                comment: "Randevu yönetimi çok kolaylaştı! Artık telefona bakmadan tüm randevularımı görüyorum.",
                rating: 5
              },
              {
                name: "Mehmet Kaya",
                role: "Berber",
                comment: "Müşterilerim artık gece bile randevu alabiliyor. Gelirlerim %40 arttı!",
                rating: 5
              },
              {
                name: "Zeynep Demir",
                role: "Güzellik Uzmanı",
                comment: "En iyi kararlarımdan biriydi. Sistem çok kullanıcı dostu ve destek ekibi harika.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="hover:shadow-xl transition">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">"{testimonial.comment}"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mr-4"></div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Basit ve Şeffaf Fiyatlandırma
            </h2>
            <p className="text-xl text-gray-600">İhtiyacınıza uygun planı seçin</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Trial */}
            <Card className="hover:shadow-2xl transition border-2">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Deneme</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">₺0</span>
                  <span className="text-gray-600">/15 gün</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "50 randevu/ay",
                    "Temel özellikler",
                    "Email desteği",
                    "Mobil uygulama"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block">
                  <Button className="w-full" variant="outline">
                    Hemen Başla
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Monthly - Popular */}
            <Card className="hover:shadow-2xl transition border-4 border-green-500 relative scale-105">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  En Popüler
                </span>
              </div>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Profesyonel</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">₺299</span>
                  <span className="text-gray-600">/aylık</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "Sınırsız randevu",
                    "Tüm özellikler",
                    "SMS bildirimleri",
                    "Öncelikli destek",
                    "Detaylı raporlar"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block">
                  <Button className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white">
                    Hemen Başla
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Yearly */}
            <Card className="hover:shadow-2xl transition border-2">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Kurumsal</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">₺899</span>
                  <span className="text-gray-600">/yıllık</span>
                  <div className="text-sm text-green-600 font-semibold mt-1">%75 tasarruf</div>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "Sınırsız randevu",
                    "Tüm özellikler",
                    "Çoklu lokasyon",
                    "API erişimi",
                    "7/24 destek",
                    "Özel entegrasyonlar"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block">
                  <Button className="w-full" variant="outline">
                    Hemen Başla
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Sıkça Sorulan Sorular
            </h2>
            <p className="text-xl text-gray-600">Merak ettikleriniz</p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "Kurulum ne kadar sürer?",
                answer: "Ortalama 5 dakika! Kayıt olduktan sonra işletme bilgilerinizi girip hemen kullanmaya başlayabilirsiniz."
              },
              {
                question: "Deneme süresi sonunda ne olur?",
                answer: "15 günlük deneme süreniz sonunda istediğiniz paketi seçebilir veya üyeliğinizi sonlandırabilirsiniz. Kredi kartı bilginiz istenmez."
              },
              {
                question: "Müşterilerim nasıl randevu alacak?",
                answer: "Size özel bir link oluşturulur. Bu linki sosyal medya, web siteniz veya whatsapp'tan paylaşabilirsiniz. Müşterileriniz 7/24 bu linkten randevu alabilir."
              },
              {
                question: "Mobil uygulaması var mı?",
                answer: "Evet! Hem iOS hem Android için mobil responsive tasarım mevcuttur. Tüm cihazlardan sorunsuz kullanabilirsiniz."
              },
              {
                question: "Destek hizmeti sunuyor musunuz?",
                answer: "Elbette! Email, telefon ve canlı destek ile 7/24 yanınızdayız. Tüm sorularınıza hızlıca cevap veriyoruz."
              },
              {
                question: "Verilerim güvende mi?",
                answer: "Kesinlikle! Tüm verileriniz şifreli olarak saklanır. KVKK'ya uygun çalışıyoruz ve verilerinizi asla üçüncü şahıslarla paylaşmıyoruz."
              }
            ].map((faq, index) => (
              <div key={index} className="border-2 border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-900 text-left">{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-600 transition-transform ${
                      openFaq === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Hemen Başlamaya Hazır mısınız?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Binlerce işletme randevularını dijitalleştirdi. Sıra sizde!
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-12 py-6">
              15 Gün Ücretsiz Deneyin
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-white/80 mt-4 text-sm">Kredi kartı gerektirmez • 5 dakikada kurulum</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg"></div>
                <span className="text-xl font-bold">Randevu Sistemi</span>
              </div>
              <p className="text-gray-400">
                Modern işletmeler için tasarlanmış randevu yönetim platformu.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Ürün</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Özellikler</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Fiyatlar</a></li>
                <li><a href="#" className="hover:text-white transition">Demo</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Destek</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#faq" className="hover:text-white transition">SSS</a></li>
                <li><a href="#" className="hover:text-white transition">İletişim</a></li>
                <li><a href="#" className="hover:text-white transition">Yardım Merkezi</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Şirket</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Hakkımızda</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Gizlilik</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2025 Randevu Sistemi. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
