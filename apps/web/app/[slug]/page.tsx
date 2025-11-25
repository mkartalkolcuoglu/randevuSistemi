'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../components/ui';
import { ArrowLeft, Calendar, Clock, MapPin, Phone, Mail, ChevronRight, Scissors, MessageCircle, Home } from 'lucide-react';

export default function TenantPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [tenantSettings, setTenantSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tenantNotFound, setTenantNotFound] = useState(false);
  const [isCmsPage, setIsCmsPage] = useState(false);
  const [cmsPageData, setCmsPageData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Önce bu bir CMS page mi kontrol et
        const pageResponse = await fetch(`/api/pages/${slug}`);
        const pageResult = await pageResponse.json();

        if (pageResult.success && pageResult.data?.isActive) {
          // Bu bir CMS page
          setIsCmsPage(true);
          setCmsPageData(pageResult.data);
          setLoading(false);
          return;
        }

        // CMS page değilse, tenant olarak kontrol et
        const tenantResponse = await fetch(`/api/tenant-settings/${slug}`);
        const tenantResult = await tenantResponse.json();

        console.log('Tenant response for slug:', slug, tenantResult);

        if (tenantResult.success && tenantResult.data) {
          setTenantSettings(tenantResult.data);
        } else {
          // Tenant bulunamadı
          console.log('Tenant not found for slug:', slug);
          setTenantNotFound(true);

          // 3 saniye sonra ana sayfaya yönlendir
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }

      } catch (error) {
        console.error('Error fetching tenant data:', error);
        setTenantNotFound(true);

        // Hata durumunda da ana sayfaya yönlendir
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  // If this is a CMS page, render page template
  if (isCmsPage && cmsPageData) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-md shadow-sm z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="flex items-center">
                <img
                  src="https://i.hizliresim.com/4a00l8g.png"
                  alt="Net Randevu Logo"
                  className="h-10 w-auto"
                />
              </Link>
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Ana Sayfa
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">{cmsPageData.title}</h1>
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: cmsPageData.content }}
          />
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-gray-400">
              <p>© 2025 Net Randevu. Tüm hakları saklıdır.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (tenantNotFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🔍</div>
          <h1 className="text-2xl font-bold text-red-500 mb-4">Salon Bulunamadı</h1>
          <p className="text-gray-600 mb-6">
            <strong>"{slug}"</strong> adında bir salon bulunamadı.
            <br />3 saniye içinde ana sayfaya yönlendirileceksiniz...
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-600 transition-colors"
          >
            Ana Sayfaya Git
          </button>
        </div>
      </div>
    );
  }

  if (!tenantSettings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Salon Bulunamadı</h1>
          <p className="text-gray-500">Aradığınız salon mevcut değil.</p>
        </div>
      </div>
    );
  }

  const { tenant, theme, workingHours, location } = tenantSettings;

  // Gün adlarını Türkçe'ye çeviren fonksiyon
  const getDayName = (day: string) => {
    const dayNames: { [key: string]: string } = {
      monday: 'Pazartesi',
      tuesday: 'Salı',
      wednesday: 'Çarşamba',
      thursday: 'Perşembe',
      friday: 'Cuma',
      saturday: 'Cumartesi',
      sunday: 'Pazar'
    };
    return dayNames[day] || day;
  };

  // Bugünün çalışma saatini al
  const getTodayHours = () => {
    if (!workingHours) return null;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const todayHours = workingHours[today];
    if (!todayHours || todayHours.closed === true || todayHours.closed === 'true') {
      return { closed: true };
    }
    return { start: todayHours.start || '09:00', end: todayHours.end || '18:00', closed: false };
  };

  const todayHours = getTodayHours();
  const primaryColor = theme?.primaryColor || '#3B82F6';
  const secondaryColor = theme?.secondaryColor || '#1E40AF';

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Mobile App Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-lg"
        style={{ backgroundColor: `${primaryColor}F5` }}
      >
        <div className="safe-area-top"></div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {theme?.logo ? (
              <img
                src={theme.logo}
                alt={tenant?.businessName}
                className="h-10 w-10 rounded-full object-cover bg-white shadow-md"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                style={{ backgroundColor: secondaryColor }}
              >
                {tenant?.businessName?.charAt(0) || 'S'}
              </div>
            )}
            <div className="text-white">
              <h1 className="font-semibold text-base leading-tight truncate max-w-[200px]">
                {tenant?.businessName}
              </h1>
              <div className="flex items-center gap-1 text-xs opacity-90">
                <Clock className="w-3 h-3" />
                {todayHours?.closed ? (
                  <span className="text-red-200">Bugün Kapalı</span>
                ) : (
                  <span>{todayHours?.start} - {todayHours?.end}</span>
                )}
              </div>
            </div>
          </div>
          <Link
            href={`/${slug}/randevu`}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 transition-all active:scale-95"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Randevu</span>
          </Link>
        </div>
      </header>

      {/* Hero Banner - Mobile Optimized */}
      <section
        className="relative overflow-hidden"
        style={{
          background: theme?.headerImage
            ? `linear-gradient(to bottom, transparent, rgba(0,0,0,0.7)), url('${theme.headerImage}')`
            : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="px-4 py-8 md:py-16 text-white text-center relative z-10">
          {!theme?.headerImage && (
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-20 h-20 border-2 border-white rounded-full"></div>
              <div className="absolute bottom-8 right-8 w-32 h-32 border-2 border-white rounded-full"></div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-white rounded-full"></div>
            </div>
          )}

          <div className="relative z-10">
            {tenant?.businessDescription && (
              <p className="text-white/90 text-sm md:text-base max-w-md mx-auto mb-6 leading-relaxed">
                {tenant.businessDescription}
              </p>
            )}

            <Link href={`/${slug}/randevu`}>
              <button
                className="w-full max-w-xs mx-auto bg-white text-gray-900 font-semibold py-4 px-8 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{ color: primaryColor }}
              >
                <Calendar className="w-5 h-5" />
                Hemen Randevu Al
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Actions - Mobile Cards */}
      <section className="px-4 -mt-4 relative z-20">
        <Link
          href={`/${slug}/hizmetler`}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform flex items-center gap-4"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Scissors className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">Hizmetlerimiz</h3>
            <p className="text-xs text-gray-500 mt-0.5">Sunduğumuz tüm hizmetleri görüntüleyin</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </Link>
      </section>

      {/* Contact Info Card */}
      <section className="px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">İletişim</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {tenant?.businessAddress && (
              <a
                href={location?.latitude && location?.longitude
                  ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
                  : `https://maps.google.com/?q=${encodeURIComponent(tenant.businessAddress)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Adres</p>
                  <p className="text-sm text-gray-500 truncate">{tenant.businessAddress}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </a>
            )}

            {tenant?.businessPhone && (
              <a
                href={`tel:${tenant.businessPhone}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#10B98115' }}
                >
                  <Phone className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Telefon</p>
                  <p className="text-sm text-gray-500">{tenant.businessPhone}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </a>
            )}

            {tenant?.businessEmail && (
              <a
                href={`mailto:${tenant.businessEmail}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#F5920015' }}
                >
                  <Mail className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">E-posta</p>
                  <p className="text-sm text-gray-500 truncate">{tenant.businessEmail}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Working Hours Card */}
      {workingHours && (
        <section className="px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Çalışma Saatleri</h2>
              <div className="flex items-center gap-1 text-xs">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-gray-500">Haftalık</span>
              </div>
            </div>

            <div className="p-4">
              <div className="space-y-3">
                {Object.entries(workingHours).map(([day, hours]: [string, any]) => {
                  const isClosed = hours?.closed === true || hours?.closed === 'true';
                  const startTime = hours?.start || '09:00';
                  const endTime = hours?.end || '18:00';
                  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                  const isToday = days[new Date().getDay()] === day;

                  return (
                    <div
                      key={day}
                      className={`flex items-center justify-between py-2 px-3 rounded-xl ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {isToday && (
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        )}
                        <span className={`text-sm ${isToday ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>
                          {getDayName(day)}
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${
                        isClosed
                          ? 'text-red-500'
                          : isToday
                            ? 'text-blue-700'
                            : 'text-green-600'
                      }`}>
                        {isClosed ? 'Kapalı' : `${startTime} - ${endTime}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Map Section - Mobile Optimized */}
      {location && (location.latitude && location.longitude) && (
        <section className="px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Konum</h2>
            </div>

            <div className="aspect-video">
              <iframe
                src={`https://maps.google.com/maps?q=${location.latitude},${location.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="İşletme Konumu"
              />
            </div>

            <a
              href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-4 text-sm font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
              style={{ color: primaryColor }}
            >
              <MapPin className="w-4 h-4" />
              Yol Tarifi Al
            </a>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-8 mb-24 md:mb-8 text-center px-4">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} {tenant?.businessName}
        </p>
        <p className="text-xs text-gray-300 mt-1">
          Net Randevu ile güçlendirilmiştir
        </p>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          <Link
            href={`/${slug}`}
            className={`flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-400'}`}
            onClick={() => setActiveTab('home')}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Ana Sayfa</span>
          </Link>

          <Link
            href={`/${slug}/hizmetler`}
            className="flex flex-col items-center gap-1 px-5 py-2 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Scissors className="w-5 h-5" />
            <span className="text-[10px] font-medium">Hizmetler</span>
          </Link>

          <Link
            href={`/${slug}/randevu`}
            className="flex flex-col items-center -mt-4"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] font-medium mt-1" style={{ color: primaryColor }}>Randevu</span>
          </Link>

          <Link
            href={`/${slug}/iletisim`}
            className="flex flex-col items-center gap-1 px-5 py-2 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[10px] font-medium">İletişim</span>
          </Link>

          <a
            href={tenant?.businessPhone ? `tel:${tenant.businessPhone}` : '#'}
            className="flex flex-col items-center gap-1 px-5 py-2 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Phone className="w-5 h-5" />
            <span className="text-[10px] font-medium">Ara</span>
          </a>
        </div>
      </nav>

      <style jsx global>{`
        .safe-area-top {
          height: env(safe-area-inset-top, 0px);
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        @media (max-width: 768px) {
          html {
            scroll-behavior: smooth;
            -webkit-tap-highlight-color: transparent;
          }

          body {
            overscroll-behavior-y: contain;
          }
        }
      `}</style>
    </div>
  );
}
