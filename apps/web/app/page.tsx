"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, formatPhone, normalizePhone, PHONE_PLACEHOLDER, PHONE_MAX_LENGTH } from "../components/ui";
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
  MessageCircle,
  Check,
  ChevronDown,
  User
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [stats, setStats] = useState({
    tenants: 0,
    appointments: 0
  });
  const [packages, setPackages] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Kullanıcı girişi modal
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loginStep, setLoginStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(120);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // OTP Timer
  useEffect(() => {
    if (loginStep === 'otp' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [loginStep, timeLeft]);

  const handleSendOtp = async () => {
    if (phoneNumber.length < 10) {
      setPhoneError('Lütfen geçerli bir telefon numarası girin');
      return;
    }

    setOtpLoading(true);
    setPhoneError('');
    setOtpError('');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          purpose: 'appointment_query'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSuccess('Doğrulama kodu gönderildi');
        setLoginStep('otp');
        setTimeLeft(120);
        setCanResend(false);
      } else {
        setPhoneError(data.error || 'SMS gönderilemedi');
      }
    } catch (err) {
      setPhoneError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`login-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`login-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');

    if (code.length !== 6) {
      setOtpError('Lütfen 6 haneli kodu girin');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          code,
          purpose: 'appointment_query'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSuccess('Doğrulama başarılı! Yönlendiriliyorsunuz...');
        setTimeout(() => {
          router.push(`/randevularim/list?phone=${encodeURIComponent(phoneNumber)}`);
        }, 1000);
      } else {
        setOtpError(data.error || 'Hatalı doğrulama kodu');
      }
    } catch (err) {
      setOtpError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = () => {
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setOtpSuccess('');
    handleSendOtp();
  };

  const resetLoginModal = () => {
    setShowLoginModal(false);
    setLoginStep('phone');
    setPhoneNumber('');
    setPhoneError('');
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setOtpSuccess('');
    setTimeLeft(120);
    setCanResend(false);
  };

  const fetchData = async () => {
    try {
      // Fetch real stats, packages, and pages from our own API
      const [packagesRes, pagesRes] = await Promise.all([
        fetch('/api/packages'),
        fetch('/api/pages')
      ]);

      if (packagesRes.ok) {
        const packagesData = await packagesRes.json();
        console.log('Packages API response:', packagesData);
        if (packagesData.success) {
          // Parse features if they're JSON strings
          const parsedPackages = packagesData.data.map((pkg: any) => {
            let features = pkg.features;
            
            // Parse if string
            if (typeof features === 'string') {
              try {
                features = JSON.parse(features);
              } catch (e) {
                console.error('Failed to parse features for package:', pkg.name, e);
                features = null;
              }
            }
            
            // Log for debugging
            console.log(`Package "${pkg.name}" features:`, features);
            console.log(`Package "${pkg.name}" features type:`, typeof features, Array.isArray(features) ? 'is Array' : 'is not Array');
            
            // If features is an array (simple list format from project-admin)
            if (Array.isArray(features)) {
              console.log(`Package "${pkg.name}" has array features (simple list format)`);
              // Keep the array as-is, we'll render it differently
              // Don't convert to empty object
            }
            
            return {
              ...pkg,
              features: features || {}
            };
          });
          setPackages(parsedPackages.filter((pkg: any) => pkg.isActive));
          console.log('Packages loaded:', parsedPackages.length, 'packages');
        }
      } else {
        console.error('Failed to fetch packages:', packagesRes.status);
      }

      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        console.log('Pages data:', pagesData);
        if (pagesData.success) {
          setPages(pagesData.data);
          console.log('Pages loaded:', pagesData.data.length, 'pages');
        }
      } else {
        console.error('Failed to fetch pages:', pagesRes.status);
      }

      // Set fixed stats for landing page
      setStats({
        tenants: 100,
        appointments: 15000
      });
    } catch (error) {
      console.error('Error fetching landing data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img
                src="https://i.hizliresim.com/4a00l8g.png"
                alt="Net Randevu Logo"
                className="h-8 sm:h-10 w-auto"
              />
            </div>
            <nav className="hidden lg:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Özellikler</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition">Fiyatlar</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 transition">SSS</a>
            </nav>
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 transition text-xs sm:text-sm px-2 sm:px-4"
                onClick={() => setShowLoginModal(true)}
              >
                <User className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Kullanıcı Girişi</span>
              </Button>
              <Link href="https://admin.netrandevu.com">
                <Button variant="outline" size="sm" className="border-[#163974] text-[#163974] hover:bg-[#163974] hover:text-white transition text-xs sm:text-sm px-2 sm:px-4">
                  <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">İşletme Paneli</span>
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-[#163974] hover:bg-[#0F2A52] text-white hover:shadow-lg transition text-xs sm:text-sm px-3 sm:px-4">
                  Ücretsiz Başla
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 opacity-70"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <div className="inline-block mb-4 px-4 py-2 bg-blue-100 rounded-full">
              <span className="text-[#163974] font-medium text-sm">✨ Modern İşletmeler İçin</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Randevularınızı<br />
              <span className="bg-gradient-to-r from-[#163974] to-[#0F2A52] bg-clip-text text-transparent">
                Dijitalleştirin
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Müşterileriniz 7/24 randevu alsın, siz işinize odaklanın. 
              Modern, hızlı ve kullanımı kolay randevu yönetim sistemi.
            </p>
            <div className="flex justify-center mb-12">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-6 bg-[#163974] hover:bg-[#0F2A52] text-white hover:shadow-xl transition">
                  <Calendar className="w-5 h-5 mr-2" />
                  15 Gün Ücretsiz Dene
                </Button>
              </Link>
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
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">{stats.tenants}+</div>
              <div className="text-gray-600">Aktif İşletme</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">{(stats.appointments / 1000).toFixed(0)}K+</div>
              <div className="text-gray-600">Aylık Randevu</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">98%</div>
              <div className="text-gray-600">Müşteri Memnuniyeti</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">7/24</div>
              <div className="text-gray-600">Randevu Sistemi</div>
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
            {[
              {
                icon: Calendar,
                title: "Online Randevu",
                description: "Müşterileriniz 7/24 online randevu alabilir. Çakışmaları otomatik önler, zamanınızı optimize eder.",
                color: "from-green-400 to-emerald-400"
              },
              {
                icon: Users,
                title: "Müşteri & Personel Yönetimi",
                description: "Müşteri bilgilerini güvenle saklayın. Personellerinizi ekleyin, yetkilendirin ve çalışma saatlerini ayarlayın.",
                color: "from-blue-400 to-cyan-400"
              },
              {
                icon: BarChart3,
                title: "Kasa & Raporlar",
                description: "Gelir-gider takibi yapın, detaylı raporlarla işletmenizin performansını analiz edin.",
                color: "from-purple-400 to-pink-400"
              },
              {
                icon: Smartphone,
                title: "Kredi Kartı ile Ödeme",
                description: "Müşterileriniz randevu sırasında güvenli ödeme yapabilir. PayTR altyapısı ile tüm kartlar desteklenir.",
                color: "from-orange-400 to-red-400"
              },
              {
                icon: MessageCircle,
                title: "SMS & WhatsApp Hatırlatma",
                description: "Otomatik SMS ve WhatsApp hatırlatmaları gönderin. Müşterileriniz randevularını asla kaçırmasın.",
                color: "from-indigo-400 to-blue-400"
              },
              {
                icon: Shield,
                title: "Özelleştirilebilir Tema",
                description: "Logo, renkler ve görseller ile kendi markanızı yansıtın. Konum haritası ile müşterilerinizi yönlendirin.",
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
            <p className="text-xl text-gray-600">Mutlu işletme sahiplerimizden bazıları</p>
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
                comment: "Müşterilerim artık gece bile randevu alabiliyor. Gelirlerim arttı!",
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
                  <p className="text-gray-700 mb-6 leading-relaxed italic">
                    "{testimonial.comment}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-lg">{testimonial.name.charAt(0)}</span>
                    </div>
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

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Paketler yükleniyor...</p>
            </div>
          ) : packages.length > 0 ? (
            <div className={`grid grid-cols-1 md:grid-cols-${Math.min(packages.length, 3)} gap-8 max-w-5xl mx-auto`}>
              {packages.slice(0, 3).map((pkg, index) => {
                const isPopular = pkg.isPopular || false;
                return (
                  <Card 
                    key={pkg.id} 
                    className={`hover:shadow-2xl transition ${
                      isPopular ? 'border-4 border-green-500 relative scale-105' : 'border-2'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <span className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                          En Popüler
                        </span>
                      </div>
                    )}
                    <CardContent className="p-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                      <div className="mb-6">
                        <span className="text-5xl font-bold text-gray-900">₺{Math.round(pkg.price)}</span>
                        <span className="text-gray-600">
                          /{pkg.durationType === 'monthly' ? 'aylık' : pkg.durationType === 'yearly' ? 'yıllık' : pkg.durationDays + ' gün'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-6">{pkg.description}</p>
                      <ul className="space-y-3 mb-8">
                        {/* Simple list format (array) */}
                        {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                          <>
                            {pkg.features.map((feature: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </>
                        )}
                        
                        {/* Structured format (object) */}
                        {!Array.isArray(pkg.features) && pkg.features && typeof pkg.features === 'object' && (
                          <>
                            {/* Randevu Limiti */}
                            <li className="flex items-start">
                              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">
                                {pkg.features.appointments === -1 ? 'Sınırsız' : pkg.features.appointments || '0'} randevu/ay
                              </span>
                            </li>

                            {/* SMS/WhatsApp */}
                            <li className="flex items-start">
                              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">
                                {pkg.features.sms ? (
                                  pkg.features.sms === -1 ? 'Sınırsız SMS/WhatsApp' : `${pkg.features.sms} SMS/WhatsApp`
                                ) : 'SMS/WhatsApp yok'}
                              </span>
                            </li>

                            {/* Personel */}
                            <li className="flex items-start">
                              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">
                                {pkg.features.staff === -1 ? 'Sınırsız' : pkg.features.staff || '1'} personel
                              </span>
                            </li>

                            {/* Lokasyon */}
                            <li className="flex items-start">
                              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">
                                {pkg.features.locations === -1 ? 'Çoklu lokasyon' : `${pkg.features.locations || '1'} lokasyon`}
                              </span>
                            </li>

                            {/* Hizmet Sayısı */}
                            {pkg.features.services && (
                              <li className="flex items-start">
                                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700">
                                  {pkg.features.services === -1 ? 'Sınırsız' : pkg.features.services} hizmet
                                </span>
                              </li>
                            )}

                            {/* Müşteri Sayısı */}
                            {pkg.features.clients && (
                              <li className="flex items-start">
                                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700">
                                  {pkg.features.clients === -1 ? 'Sınırsız' : pkg.features.clients} müşteri
                                </span>
                              </li>
                            )}

                            {/* Raporlama */}
                            <li className="flex items-start">
                              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">
                                {pkg.features.reports ? 'Detaylı raporlar' : 'Basit raporlar'}
                              </span>
                            </li>

                            {/* Özel Alan Adı */}
                            {pkg.features.customDomain !== undefined && (
                              <li className="flex items-start">
                                <Check className={`w-5 h-5 ${pkg.features.customDomain ? 'text-green-500' : 'text-gray-400'} mr-3 flex-shrink-0 mt-0.5`} />
                                <span className={pkg.features.customDomain ? 'text-gray-700' : 'text-gray-400'}>
                                  Özel alan adı
                                </span>
                              </li>
                            )}

                            {/* API Erişimi */}
                            {pkg.features.apiAccess !== undefined && (
                              <li className="flex items-start">
                                <Check className={`w-5 h-5 ${pkg.features.apiAccess ? 'text-green-500' : 'text-gray-400'} mr-3 flex-shrink-0 mt-0.5`} />
                                <span className={pkg.features.apiAccess ? 'text-gray-700' : 'text-gray-400'}>
                                  API erişimi
                                </span>
                              </li>
                            )}

                            {/* Öncelikli Destek */}
                            <li className="flex items-start">
                              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">
                                {pkg.features.support === 'priority' ? 'Öncelikli' : pkg.features.support === 'standard' ? 'Standart' : 'E-posta'} destek
                              </span>
                            </li>
                          </>
                        )}
                      </ul>
                      <Link href={`/register?package=${pkg.id}`} className="block">
                        <Button 
                          className={`w-full ${
                            isPopular 
                              ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white' 
                              : ''
                          }`}
                          variant={isPopular ? undefined : 'outline'}
                        >
                          Hemen Başla
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              Henüz aktif paket bulunmuyor.
            </div>
          )}
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
                answer: "Elbette! Email ve WhatsApp ile yanınızdayız. Tüm sorularınıza hızlıca cevap veriyoruz."
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

      {/* Kullanıcı Girişi Modal */}
      <Dialog open={showLoginModal} onOpenChange={resetLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kullanıcı Girişi</DialogTitle>
            <DialogDescription>
              {loginStep === 'phone'
                ? 'Randevularınızı görüntülemek için kayıtlı telefon numaranızı girin.'
                : `${formatPhone(phoneNumber)} numarasına gönderilen 6 haneli kodu girin`
              }
            </DialogDescription>
          </DialogHeader>

          {/* Success/Error Messages */}
          {otpSuccess && (
            <div className="px-6 py-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{otpSuccess}</p>
            </div>
          )}
          {(phoneError || otpError) && (
            <div className="px-6 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{phoneError || otpError}</p>
            </div>
          )}

          {/* Phone Input Step */}
          {loginStep === 'phone' && (
            <div className="py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon Numarası *
              </label>
              <input
                type="tel"
                value={formatPhone(phoneNumber)}
                onChange={(e) => {
                  const normalized = normalizePhone(e.target.value);
                  setPhoneNumber(normalized);
                  setPhoneError('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                placeholder={PHONE_PLACEHOLDER}
                maxLength={PHONE_MAX_LENGTH}
                disabled={otpLoading}
              />
            </div>
          )}

          {/* OTP Input Step */}
          {loginStep === 'otp' && (
            <div className="py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Doğrulama Kodu
                </label>
                <div className="flex justify-center space-x-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`login-otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-10 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                      disabled={otpLoading}
                    />
                  ))}
                </div>
              </div>

              {/* Timer */}
              <div className="text-center">
                {timeLeft > 0 ? (
                  <p className="text-sm text-gray-600">
                    Kod {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')} içinde geçersiz olacak
                  </p>
                ) : (
                  <p className="text-sm text-red-600">Kodun süresi doldu</p>
                )}
              </div>

              {/* Resend & Back */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleResendOtp}
                  disabled={!canResend || otpLoading}
                  className="flex-1 text-sm"
                >
                  Kodu Tekrar Gönder
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setLoginStep('phone')}
                  disabled={otpLoading}
                  className="flex-1 text-sm"
                >
                  Numarayı Değiştir
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetLoginModal}
              disabled={otpLoading}
            >
              İptal
            </Button>
            {loginStep === 'phone' ? (
              <Button
                onClick={handleSendOtp}
                disabled={otpLoading || !phoneNumber || phoneNumber.length < 10}
                className="bg-[#163974] hover:bg-[#0F2A52]"
              >
                {otpLoading ? 'Gönderiliyor...' : 'Kod Gönder'}
              </Button>
            ) : (
              <Button
                onClick={handleVerifyOtp}
                disabled={otpLoading || otp.join('').length !== 6 || timeLeft === 0}
                className="bg-[#163974] hover:bg-[#0F2A52]"
              >
                {otpLoading ? 'Doğrulanıyor...' : 'Doğrula'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img
                  src="https://i.hizliresim.com/4a00l8g.png"
                  alt="Net Randevu Logo"
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-gray-400 mb-3">
                Modern işletmeler için tasarlanmış randevu yönetim platformu.
              </p>
              <p className="text-gray-500 text-sm">
                Cemalpaşa Mah. Gazipaşa Blv. Camurdanoğlu Apt. Giriş No: 34 İç Kapı No: 04 Seyhan/Adana
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Ürün</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Özellikler</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Fiyatlar</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">İletişim</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#faq" className="hover:text-white transition">SSS</a></li>
                <li><a href="tel:08503036723" className="hover:text-white transition">0850 303 67 23</a></li>
                <li><a href="https://wa.me/908503036723" className="hover:text-white transition">WhatsApp</a></li>
                <li><a href="mailto:info@netrandevu.com" className="hover:text-white transition">info@netrandevu.com</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Şirket</h3>
              <ul className="space-y-2 text-gray-400">
                {pages.map((page) => (
                  <li key={page.id}>
                    <Link href={`/${page.slug}`} className="hover:text-white transition">
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2025 Net Randevu. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
