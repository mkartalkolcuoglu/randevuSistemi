"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '../../components/ui';
import { ArrowLeft, ArrowRight, Building2, User, Mail, Phone, MapPin, Lock, Check, CreditCard, Calendar } from 'lucide-react';

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
  subscriptionPlan: 'trial' | 'monthly' | 'yearly';
}

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState<any>(null);
  
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
    subscriptionPlan: 'trial'
  });

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
      // If trial, skip payment
      if (formData.subscriptionPlan === 'trial') {
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
          loginUrl: `https://randevu-sistemi-admin.vercel.app/login`,
          tenantUrl: `https://randevu-sistemi-web.vercel.app/${slug}`
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

  const getPlanPrice = () => {
    switch (formData.subscriptionPlan) {
      case 'trial': return '₺0';
      case 'monthly': return '₺299';
      case 'yearly': return '₺899';
    }
  };

  const getPlanName = () => {
    switch (formData.subscriptionPlan) {
      case 'trial': return 'Deneme (15 gün)';
      case 'monthly': return 'Aylık (30 gün)';
      case 'yearly': return 'Yıllık (365 gün)';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ana Sayfaya Dön
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">İşletmenizi Kaydedin</h1>
          <p className="text-gray-600">Birkaç adımda sisteme katılın ve dijital dönüşümü başlatın</p>
        </div>

        {/* Progress Steps */}
        {currentStep !== 'success' && (
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center ${currentStep === 'info' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'info' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="ml-2 hidden sm:inline">Bilgiler</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <div className={`flex items-center ${currentStep === 'package' || currentStep === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'package' || currentStep === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="ml-2 hidden sm:inline">Paket</span>
              </div>
              {formData.subscriptionPlan !== 'trial' && (
                <>
                  <div className="w-12 h-0.5 bg-gray-300"></div>
                  <div className={`flex items-center ${currentStep === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                      3
                    </div>
                    <span className="ml-2 hidden sm:inline">Ödeme</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Business Information */}
        {currentStep === 'info' && (
          <Card>
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
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="05XX XXX XX XX"
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
                <Button onClick={handleNext} size="lg">
                  Devam Et
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Package Selection */}
        {currentStep === 'package' && (
          <Card>
            <CardHeader>
              <CardTitle>Paket Seçimi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Trial */}
                <div
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    formData.subscriptionPlan === 'trial'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, subscriptionPlan: 'trial' }))}
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Deneme</h3>
                    <div className="text-3xl font-bold text-blue-600 mb-4">₺0</div>
                    <p className="text-sm text-gray-600 mb-4">15 gün ücretsiz</p>
                    <ul className="text-left text-sm text-gray-600 space-y-2">
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>50 randevu/ay</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Temel özellikler</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Email desteği</span>
                      </li>
                    </ul>
                  </div>
                  {formData.subscriptionPlan === 'trial' && (
                    <div className="mt-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
                        <Check className="w-4 h-4 mr-1" />
                        Seçildi
                      </span>
                    </div>
                  )}
                </div>

                {/* Monthly */}
                <div
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all relative ${
                    formData.subscriptionPlan === 'monthly'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, subscriptionPlan: 'monthly' }))}
                >
                  <div className="absolute top-0 right-0 bg-green-600 text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg">
                    Popüler
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Aylık</h3>
                    <div className="text-3xl font-bold text-green-600 mb-1">₺299</div>
                    <p className="text-sm text-gray-600 mb-4">aylık</p>
                    <ul className="text-left text-sm text-gray-600 space-y-2">
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Sınırsız randevu</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Tüm özellikler</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Öncelikli destek</span>
                      </li>
                    </ul>
                  </div>
                  {formData.subscriptionPlan === 'monthly' && (
                    <div className="mt-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-600 text-white">
                        <Check className="w-4 h-4 mr-1" />
                        Seçildi
                      </span>
                    </div>
                  )}
                </div>

                {/* Yearly */}
                <div
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    formData.subscriptionPlan === 'yearly'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-400'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, subscriptionPlan: 'yearly' }))}
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Yıllık</h3>
                    <div className="text-3xl font-bold text-purple-600 mb-1">₺899</div>
                    <p className="text-sm text-gray-600 mb-1">yıllık</p>
                    <p className="text-xs text-green-600 font-semibold mb-4">%75 tasarruf!</p>
                    <ul className="text-left text-sm text-gray-600 space-y-2">
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Sınırsız randevu</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Tüm özellikler</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>7/24 destek</span>
                      </li>
                    </ul>
                  </div>
                  {formData.subscriptionPlan === 'yearly' && (
                    <div className="mt-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-600 text-white">
                        <Check className="w-4 h-4 mr-1" />
                        Seçildi
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep('info')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </Button>
                <Button onClick={handleNext} size="lg" disabled={loading}>
                  {loading ? 'İşleniyor...' : formData.subscriptionPlan === 'trial' ? 'Kayıt Ol' : 'Ödemeye Geç'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Payment (Demo) */}
        {currentStep === 'payment' && (
          <Card>
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
                <Button variant="outline" onClick={() => setCurrentStep('package')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </Button>
                <Button onClick={handleNext} size="lg" disabled={loading}>
                  {loading ? 'İşleniyor...' : `${getPlanPrice()} Öde`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {currentStep === 'success' && credentials && (
          <Card>
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
                    <Button size="lg" className="w-full sm:w-auto">
                      <Lock className="w-4 h-4 mr-2" />
                      Admin Paneline Git
                    </Button>
                  </a>
                )}
                {credentials.tenantUrl && (
                  <a href={credentials.tenantUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
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

