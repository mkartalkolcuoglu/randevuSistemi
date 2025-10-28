"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, formatPhone, normalizePhone, PHONE_PLACEHOLDER, PHONE_MAX_LENGTH, Badge } from '../../components/ui';
import { ArrowLeft, ArrowRight, Building2, User, Mail, Phone, MapPin, Lock, Check, CreditCard, Calendar, Star } from 'lucide-react';

type Step = 'info' | 'package' | 'payment' | 'success';

interface FormData {
  // Business Info
  businessName: string;
  businessType: string;
  businessDescription: string;
  address: string;
  
  // Owner Info
  ownerName: string;
  ownerEmail: string;
  phone: string;
  
  // Auth
  username: string;
  password: string;
  confirmPassword: string;
  
  // Subscription
  subscriptionPlan: string; // slug of selected package
}

interface SubscriptionPackage {
  id: string;
  name: string;
  slug: string;
  durationDays: number;
  price: number;
  description: string | null;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  features: string | null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState<any>(null);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    businessType: 'salon',
    businessDescription: '',
    address: '',
    ownerName: '',
    ownerEmail: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    subscriptionPlan: '' // will be set after packages load
  });

  // Fetch packages on mount
  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setPackagesLoading(true);
      const response = await fetch('https://yonetim.netrandevu.com/api/packages');
      if (response.ok) {
        const data = await response.json();
        const activePackages = data.data.filter((pkg: SubscriptionPackage) => pkg.isActive);
        setPackages(activePackages);
        
        // Set default selection to first package (usually trial)
        if (activePackages.length > 0) {
          setFormData(prev => ({ ...prev, subscriptionPlan: activePackages[0].slug }));
        }
      } else {
        console.error('Failed to fetch packages');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setPackagesLoading(false);
    }
  };

  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const validateInfoStep = () => {
    if (!formData.businessName.trim()) {
      setError('İşletme adı gereklidir');
      return false;
    }
    if (!formData.ownerName.trim()) {
      setError('Yetkili adı gereklidir');
      return false;
    }
    if (!formData.ownerEmail.trim() || !formData.ownerEmail.includes('@')) {
      setError('Geçerli bir email adresi giriniz');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Telefon numarası gereklidir');
      return false;
    }
    if (!formData.username.trim() || formData.username.length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalıdır');
      return false;
    }
    if (!formData.password.trim() || formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return false;
    }
    setError('');
    return true;
  };

  const validatePayment = () => {
    if (!paymentData.cardNumber || paymentData.cardNumber.length < 16) {
      setError('Geçerli bir kart numarası giriniz');
      return false;
    }
    if (!paymentData.cardName.trim()) {
      setError('Kart üzerindeki isim gereklidir');
      return false;
    }
    if (!paymentData.expiryMonth || !paymentData.expiryYear) {
      setError('Son kullanma tarihi gereklidir');
      return false;
    }
    if (!paymentData.cvv || paymentData.cvv.length < 3) {
      setError('CVV gereklidir');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (currentStep === 'info') {
      if (validateInfoStep()) {
        setCurrentStep('package');
      }
    } else if (currentStep === 'package') {
      const selectedPkg = getSelectedPackage();
      // If free package, skip payment
      if (selectedPkg && selectedPkg.price === 0) {
        handleSubmit();
      } else {
        setCurrentStep('payment');
      }
    } else if (currentStep === 'payment') {
      if (validatePayment()) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          payment: formData.subscriptionPlan !== 'trial' ? paymentData : null
        }),
      });

      const data = await response.json();
      
      console.log('📥 Registration response:', data);

      if (data.success && data.data) {
        const slug = data.data.slug || '';
        const businessName = data.data.businessName || formData.businessName;
        const username = data.data.username || formData.username;
        
        setCredentials({
          businessName: businessName,
          username: username,
          slug: slug,
          loginUrl: `https://admin.netrandevu.com/login`,
          tenantUrl: `https://netrandevu.com/${slug}`
        });
        setCurrentStep('success');
      } else {
        setError(data.error || 'Kayıt oluşturulurken hata oluştu');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPackage = () => {
    return packages.find(pkg => pkg.slug === formData.subscriptionPlan);
  };

  const getPlanPrice = () => {
    const pkg = getSelectedPackage();
    if (!pkg) return '₺0';
    return pkg.price === 0 ? 'Ücretsiz' : `₺${pkg.price.toFixed(0)}`;
  };

  const getPlanName = () => {
    const pkg = getSelectedPackage();
    if (!pkg) return 'Paket Seçilmedi';
    return `${pkg.name} (${pkg.durationDays} gün)`;
  };
  
  const getPackageColor = (slug: string) => {
    const colors: Record<string, { border: string; bg: string; text: string }> = {
      'trial': { border: 'border-blue-600', bg: 'bg-blue-50', text: 'text-blue-600' },
      'monthly': { border: 'border-green-600', bg: 'bg-green-50', text: 'text-green-600' },
      'yearly': { border: 'border-purple-600', bg: 'bg-purple-50', text: 'text-purple-600' },
    };
    return colors[slug] || { border: 'border-gray-600', bg: 'bg-gray-50', text: 'text-gray-600' };
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <img 
                src="https://i.hizliresim.com/4a00l8g.png" 
                alt="Net Randevu Logo" 
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold text-gray-900">Net Randevu</span>
            </Link>
            <Link href="/" className="text-gray-600 hover:text-gray-900 flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ana Sayfa
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero Text */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-4 py-2 bg-blue-100 rounded-full">
            <span className="text-[#163974] font-medium text-sm">✨ 15 Gün Ücretsiz Deneme</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            İşletmenizi <span className="bg-gradient-to-r from-[#163974] to-[#0F2A52] bg-clip-text text-transparent">Kaydedin</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Birkaç adımda sisteme katılın ve dijital dönüşümü başlatın
          </p>
        </div>

        {/* Progress Steps */}
        {currentStep !== 'success' && (
          <div className="mb-12">
            <div className="flex items-center justify-center space-x-2 md:space-x-4">
              <div className={`flex items-center ${currentStep === 'info' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                  currentStep === 'info' 
                    ? 'bg-gradient-to-br from-green-400 to-blue-500 text-white shadow-lg' 
                    : 'bg-gray-200'
                }`}>
                  1
                </div>
                <span className="ml-2 hidden sm:inline font-medium">Bilgiler</span>
              </div>
              <div className={`w-12 md:w-20 h-1 rounded transition ${
                currentStep === 'package' || currentStep === 'payment' ? 'bg-gradient-to-r from-green-400 to-blue-500' : 'bg-gray-300'
              }`}></div>
              <div className={`flex items-center ${currentStep === 'package' || currentStep === 'payment' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                  currentStep === 'package' || currentStep === 'payment'
                    ? 'bg-gradient-to-br from-green-400 to-blue-500 text-white shadow-lg' 
                    : 'bg-gray-200'
                }`}>
                  2
                </div>
                <span className="ml-2 hidden sm:inline font-medium">Paket</span>
              </div>
              {formData.subscriptionPlan !== 'trial' && (
                <>
                  <div className={`w-12 md:w-20 h-1 rounded transition ${
                    currentStep === 'payment' ? 'bg-gradient-to-r from-green-400 to-blue-500' : 'bg-gray-300'
                  }`}></div>
                  <div className={`flex items-center ${currentStep === 'payment' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                      currentStep === 'payment'
                        ? 'bg-gradient-to-br from-green-400 to-blue-500 text-white shadow-lg' 
                        : 'bg-gray-200'
                    }`}>
                      3
                    </div>
                    <span className="ml-2 hidden sm:inline font-medium">Ödeme</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Business Information */}
        {currentStep === 'info' && (
          <Card className="shadow-xl border-2"  >
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                İşletme Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Business Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">İşletme Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İşletme Adı *</label>
                    <Input
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      placeholder="Örn: Ayşe Güzellik Salonu"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İşletme Türü *</label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="salon">Güzellik Salonu</option>
                      <option value="barbershop">Berber</option>
                      <option value="spa">SPA & Masaj</option>
                      <option value="clinic">Klinik</option>
                      <option value="gym">Spor Salonu</option>
                      <option value="other">Diğer</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea
                    name="businessDescription"
                    value={formData.businessDescription}
                    onChange={handleInputChange}
                    placeholder="İşletmeniz hakkında kısa bir açıklama"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="İşletme adresi"
                  />
                </div>
              </div>

              {/* Owner Info */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Yetkili Bilgileri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                    <Input
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleInputChange}
                      placeholder="Yetkili adı soyadı"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <Input
                      type="email"
                      name="ownerEmail"
                      value={formData.ownerEmail}
                      onChange={handleInputChange}
                      placeholder="email@ornek.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                    <Input
                      type="tel"
                      name="phone"
                      value={formatPhone(formData.phone)}
                      onChange={(e) => {
                        const normalized = normalizePhone(e.target.value);
                        handleInputChange({ target: { name: 'phone', value: normalized } } as any);
                      }}
                      placeholder={PHONE_PLACEHOLDER}
                      maxLength={PHONE_MAX_LENGTH}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Login Info */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Giriş Bilgileri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı *</label>
                    <Input
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Kullanıcı adınız (en az 3 karakter)"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Şifre *</label>
                    <Input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="En az 6 karakter"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Şifre Tekrar *</label>
                    <Input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Şifrenizi tekrar girin"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleNext} 
                  size="lg" 
                  className="bg-gradient-to-r from-green-400 to-blue-500 text-white hover:shadow-xl transition"
                >
                  Devam Et
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Package Selection */}
        {currentStep === 'package' && (
          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle>Paket Seçimi</CardTitle>
              <p className="text-sm text-gray-600 mt-2">Size en uygun paketi seçin ve hemen başlayın</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {packagesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Paketler yükleniyor...</p>
                </div>
              ) : packages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Aktif paket bulunamadı</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {packages.map((pkg) => {
                    const colors = getPackageColor(pkg.slug);
                    const isSelected = formData.subscriptionPlan === pkg.slug;
                    const features = pkg.features ? JSON.parse(pkg.features) : [];

                    return (
                      <div
                        key={pkg.id}
                        className={`border-2 rounded-lg p-6 cursor-pointer transition-all relative ${
                          isSelected
                            ? `${colors.border} ${colors.bg}`
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, subscriptionPlan: pkg.slug }))}
                      >
                        {pkg.isFeatured && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white flex items-center gap-1 px-3 py-1">
                              <Star className="w-3 h-3 fill-current" />
                              {pkg.slug === 'yearly' ? 'En Çok Tercih Edilen' : 'Öne Çıkan'}
                            </Badge>
                          </div>
                        )}
                        
                        <div className="text-center">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                          <div className={`text-3xl font-bold ${colors.text} mb-2`}>
                            {pkg.price === 0 ? 'Ücretsiz' : `₺${pkg.price.toFixed(0)}`}
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{pkg.durationDays} gün geçerli</p>
                          
                          {pkg.description && (
                            <p className="text-xs text-gray-500 mb-4 italic">{pkg.description}</p>
                          )}

                          <ul className="text-left text-sm text-gray-600 space-y-2">
                            {features.map((feature: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {isSelected && (
                          <div className="mt-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors.border.replace('border-', 'bg-')} text-white`}>
                              <Check className="w-4 h-4 mr-1" />
                              Seçildi
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep('info')} size="lg">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </Button>
                <Button 
                  onClick={handleNext} 
                  size="lg" 
                  disabled={loading || packagesLoading}
                  className="bg-gradient-to-r from-green-400 to-blue-500 text-white hover:shadow-xl transition disabled:opacity-50"
                >
                  {loading ? 'İşleniyor...' : getSelectedPackage()?.price === 0 ? 'Kayıt Ol' : 'Ödemeye Geç'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Payment (Demo) */}
        {currentStep === 'payment' && (
          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Ödeme Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Seçilen Paket</p>
                    <p className="text-lg font-semibold text-gray-900">{getPlanName()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{getPlanPrice()}</p>
                  </div>
                </div>
              </div>

              {/* Demo Payment Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Demo Mod:</strong> Bu bir demo ödeme sayfasıdır. Gerçek ödeme alınmayacaktır.
                  Herhangi bir kart bilgisi girebilirsiniz.
                </p>
              </div>

              {/* Payment Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kart Numarası *</label>
                  <Input
                    name="cardNumber"
                    value={paymentData.cardNumber}
                    onChange={handlePaymentInputChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength={16}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kart Üzerindeki İsim *</label>
                  <Input
                    name="cardName"
                    value={paymentData.cardName}
                    onChange={handlePaymentInputChange}
                    placeholder="AD SOYAD"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ay *</label>
                    <select
                      name="expiryMonth"
                      value={paymentData.expiryMonth}
                      onChange={handlePaymentInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Ay</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month.toString().padStart(2, '0')}>
                          {month.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Yıl *</label>
                    <select
                      name="expiryYear"
                      value={paymentData.expiryYear}
                      onChange={handlePaymentInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Yıl</option>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVV *</label>
                    <Input
                      name="cvv"
                      value={paymentData.cvv}
                      onChange={handlePaymentInputChange}
                      placeholder="123"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep('package')} size="lg">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </Button>
                <Button 
                  onClick={handleNext} 
                  size="lg" 
                  disabled={loading}
                  className="bg-gradient-to-r from-green-400 to-blue-500 text-white hover:shadow-xl transition disabled:opacity-50"
                >
                  {loading ? 'İşleniyor...' : `${getPlanPrice()} Öde`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {currentStep === 'success' && credentials && (
          <Card className="shadow-2xl border-2">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Kayıt Başarılı!</h2>
              <p className="text-gray-600 mb-6">
                İşletmeniz başarıyla oluşturuldu. Aşağıdaki bilgileri not alınız.
              </p>

              {/* Credentials Box */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-4">📝 Giriş Bilgileriniz</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">İşletme Adı:</span>
                    <span className="font-semibold text-gray-900">{credentials.businessName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kullanıcı Adı:</span>
                    <span className="font-semibold text-gray-900">{credentials.username || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Slug:</span>
                    <span className="font-semibold text-gray-900">{credentials.slug || 'N/A'}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-3 mt-3">
                    <div className="mb-2">
                      <span className="text-gray-600 block mb-1">Admin Paneli:</span>
                      {credentials.loginUrl ? (
                        <a
                          href={credentials.loginUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs break-all"
                        >
                          {credentials.loginUrl}
                        </a>
                      ) : (
                        <span className="text-gray-500 text-xs">URL mevcut değil</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600 block mb-1">Müşteri Randevu Sayfası:</span>
                      {credentials.tenantUrl ? (
                        <a
                          href={credentials.tenantUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs break-all"
                        >
                          {credentials.tenantUrl}
                        </a>
                      ) : (
                        <span className="text-gray-500 text-xs">URL mevcut değil</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Önemli:</strong> Bu bilgileri güvenli bir yere kaydediniz. 
                  Bu bilgiler daha sonra email adresinize gönderilecektir.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {credentials.loginUrl && (
                  <a href={credentials.loginUrl} target="_blank" rel="noopener noreferrer">
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto bg-gradient-to-r from-green-400 to-blue-500 text-white hover:shadow-xl transition"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Admin Paneline Git
                    </Button>
                  </a>
                )}
                {credentials.tenantUrl && (
                  <a href={credentials.tenantUrl} target="_blank" rel="noopener noreferrer">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full sm:w-auto border-2 hover:bg-gray-50"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Randevu Sayfasını Gör
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

