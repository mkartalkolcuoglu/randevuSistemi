import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { db } from '../../../../lib/sqlite';

export async function POST(request: NextRequest) {
  // STATİK SAYFA OLUŞTURMA DEVRE DIŞI BIRAKILDI
  // Artık tüm tenant'lar dynamic route kullanıyor: apps/web/app/[slug]/
  
  return NextResponse.json({
    success: true,
    message: 'Dynamic routing kullanılıyor - statik sayfa oluşturmaya gerek yok'
  });
}

function generateLandingPageContent(tenant: any): string {
  const businessTypeTexts = {
    salon: {
      title: 'Güzellik ve Bakım Hizmetleri',
      description: 'Profesyonel güzellik ve bakım hizmetleri ile kendinizi şımartın.',
      services: ['Saç Kesimi ve Boyama', 'Makyaj', 'Cilt Bakımı', 'Nail Art', 'Kaş ve Kirpik Uygulamaları']
    },
    barber: {
      title: 'Erkek Kuaförü',
      description: 'Modern erkek kuaförlük hizmetleri ile tarzınızı yansıtın.',
      services: ['Saç Kesimi', 'Sakal Düzenleme', 'Klasik Traş', 'Saç Şekillendirme', 'Yüz Bakımı']
    },
    clinic: {
      title: 'Sağlık Hizmetleri',
      description: 'Uzman doktor kadromuz ile sağlığınız güvende.',
      services: ['Muayene', 'Teşhis', 'Tedavi', 'Kontrol', 'Sağlık Danışmanlığı']
    },
    spa: {
      title: 'SPA & Wellness',
      description: 'Rahatlama ve yenilenme için mükemmel bir deneyim.',
      services: ['Masaj Terapisi', 'Sauna', 'Türk Hamamı', 'Aromaterapi', 'Meditasyon']
    },
    fitness: {
      title: 'Fitness & Spor',
      description: 'Sağlıklı yaşam için fitness ve spor hizmetleri.',
      services: ['Kişisel Antrenman', 'Grup Dersleri', 'Beslenme Danışmanlığı', 'Fitness Programları', 'Spor Masajı']
    },
    other: {
      title: 'Profesyonel Hizmetler',
      description: 'Kaliteli hizmet anlayışımız ile yanınızdayız.',
      services: ['Danışmanlık', 'Hizmet 1', 'Hizmet 2', 'Hizmet 3', 'Özel Hizmetler']
    }
  };

  const businessInfo = businessTypeTexts[tenant.businessType as keyof typeof businessTypeTexts] || businessTypeTexts.other;

  return `"use client";

import Link from 'next/link';
import { Button } from '@repo/ui';
import { Phone, MapPin, Clock, Star, Calendar } from 'lucide-react';

export default function ${tenant.businessName.replace(/[^a-zA-Z0-9]/g, '')}LandingPage() {
  const businessInfo = {
    name: "${tenant.businessName}",
    description: "${tenant.businessDescription || businessInfo.description}",
    address: "${tenant.address || 'Adres bilgisi güncelleniyor...'}",
    phone: "${tenant.phone || ''}",
    slug: "${tenant.slug}",
    primaryColor: "${tenant.theme?.primaryColor || '#EC4899'}",
    secondaryColor: "${tenant.theme?.secondaryColor || '#BE185D'}",
    logo: "${tenant.theme?.logo || ''}",
    headerImage: "${tenant.theme?.headerImage || ''}"
  };

  const services = ${JSON.stringify(businessInfo.services)};

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header 
        className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20"
        style={{
          background: \`linear-gradient(135deg, \${businessInfo.primaryColor}, \${businessInfo.secondaryColor})\`,
          ...(businessInfo.headerImage && {
            backgroundImage: \`linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('\${businessInfo.headerImage}')\`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          })
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              {businessInfo.logo ? (
                <img src={businessInfo.logo} alt={businessInfo.name} className="h-12 w-auto mr-4" />
              ) : (
                <div className="h-12 w-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-xl font-bold">{businessInfo.name.charAt(0)}</span>
                </div>
              )}
              <h1 className="text-2xl font-bold">{businessInfo.name}</h1>
            </div>
            <div className="flex items-center space-x-4">
              {businessInfo.phone && (
                <a href={\`tel:\${businessInfo.phone}\`} className="flex items-center hover:text-blue-200">
                  <Phone className="w-4 h-4 mr-2" />
                  {businessInfo.phone}
                </a>
              )}
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">${businessInfo.title}</h2>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              {businessInfo.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/${tenant.slug}/randevu">
                <Button 
                  size="lg" 
                  className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Randevu Al
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-3 text-lg font-semibold"
              >
                Hizmetlerimizi İncele
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Hizmetlerimiz</h3>
            <p className="text-xl text-gray-600">Profesyonel ekibimizle size en iyi hizmeti sunuyoruz</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold mr-4"
                    style={{ backgroundColor: businessInfo.primaryColor }}
                  >
                    {index + 1}
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900">{service}</h4>
                </div>
                <p className="text-gray-600">Uzman ekibimizle kaliteli hizmet</p>
                <div className="flex items-center mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                  <span className="ml-2 text-sm text-gray-500">(4.8)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-20 text-white text-center"
        style={{ backgroundColor: businessInfo.primaryColor }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">Randevunuzu Hemen Alın</h3>
          <p className="text-xl mb-8 opacity-90">
            Online randevu sistemi ile kolayca randevu alabilir, istediğiniz tarih ve saati seçebilirsiniz.
          </p>
          <Link href="/${tenant.slug}/randevu">
            <Button 
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Şimdi Randevu Al
            </Button>
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">İletişim</h3>
              <div className="space-y-4">
                {businessInfo.address && (
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                    <p className="text-gray-600">{businessInfo.address}</p>
                  </div>
                )}
                {businessInfo.phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <a href={\`tel:\${businessInfo.phone}\`} className="text-gray-600 hover:text-blue-600">
                      {businessInfo.phone}
                    </a>
                  </div>
                )}
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 mr-3" />
                  <p className="text-gray-600">Pazartesi - Cumartesi: 09:00 - 18:00</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Çalışma Saatleri</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pazartesi - Cuma</span>
                  <span className="text-gray-900 font-medium">09:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cumartesi</span>
                  <span className="text-gray-900 font-medium">09:00 - 17:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pazar</span>
                  <span className="text-gray-900 font-medium">10:00 - 16:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 {businessInfo.name}. Tüm hakları saklıdır.</p>
          <p className="text-gray-400 mt-2">
            <a href="/" className="hover:text-white">Randevu Sistemi</a> ile güçlendirilmiştir.
          </p>
        </div>
      </footer>
    </div>
  );
}`;
}

function generateAppointmentPageContent(tenant: any): string {
  return `"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@repo/ui';
import { ArrowLeft, Calendar, Clock, User, Phone, Mail, CheckCircle } from 'lucide-react';

export default function AppointmentPage() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState(null);

  const businessInfo = {
    name: "${tenant.businessName}",
    slug: "${tenant.slug}",
    primaryColor: "${tenant.theme?.primaryColor || '#EC4899'}"
  };

  // Mock services - gerçek implementasyonda API'den gelecek
  const services = [
    { id: '1', name: 'Saç Kesimi', duration: 60, price: 150 },
    { id: '2', name: 'Saç Boyama', duration: 120, price: 300 },
    { id: '3', name: 'Saç Şekillendirme', duration: 45, price: 100 },
    { id: '4', name: 'Makyaj', duration: 90, price: 200 },
    { id: '5', name: 'Cilt Bakımı', duration: 75, price: 250 }
  ];

  // Mock available times
  const availableTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setStep(2);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep(3);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(4);
  };

  const handleCustomerInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock appointment creation - gerçek implementasyonda API'ye gönderilecek
      const selectedServiceObj = services.find(s => s.id === selectedService);
      
      const appointmentData = {
        tenantSlug: businessInfo.slug,
        serviceId: selectedService,
        serviceName: selectedServiceObj?.name,
        date: selectedDate,
        time: selectedTime,
        customer: customerInfo,
        duration: selectedServiceObj?.duration,
        price: selectedServiceObj?.price
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAppointment(appointmentData);
      setStep(5);
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Randevu oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Generate next 14 days for date selection
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/${tenant.slug}">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {businessInfo.name}'e Dön
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Randevu Al</h1>
          <p className="text-gray-600">Hızlı ve kolay randevu sistemi ile yerinizi ayırtın</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div 
                  className={\`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium \${
                    step >= stepNumber 
                      ? 'text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }\`}
                  style={{
                    backgroundColor: step >= stepNumber ? businessInfo.primaryColor : undefined
                  }}
                >
                  {stepNumber}
                </div>
                {stepNumber < 5 && (
                  <div 
                    className={\`h-1 w-16 \${step > stepNumber ? '' : 'bg-gray-200'}\`}
                    style={{
                      backgroundColor: step > stepNumber ? businessInfo.primaryColor : undefined
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Hizmet</span>
            <span>Tarih</span>
            <span>Saat</span>
            <span>Bilgiler</span>
            <span>Onay</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Hizmet Seçin</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service.id)}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{service.name}</h3>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{service.duration} dakika</span>
                      <span className="font-medium text-gray-900">{service.price}₺</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Tarih Seçin</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getAvailableDates().map((date) => (
                  <div
                    key={date.toISOString()}
                    onClick={() => handleDateSelect(date.toISOString().split('T')[0])}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all text-center"
                  >
                    <div className="font-semibold text-gray-900">
                      {date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="text-sm text-gray-600">
                      {date.toLocaleDateString('tr-TR', { weekday: 'long' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Saat Seçin</h2>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {availableTimes.map((time) => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className="border border-gray-200 rounded-lg p-3 hover:border-blue-500 hover:shadow-md transition-all text-center font-medium"
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">İletişim Bilgileri</h2>
              <form onSubmit={handleSubmitAppointment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ad *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={customerInfo.firstName}
                      onChange={handleCustomerInfoChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Soyad *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={customerInfo.lastName}
                      onChange={handleCustomerInfoChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={customerInfo.phone}
                      onChange={handleCustomerInfoChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-posta
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={customerInfo.email}
                      onChange={handleCustomerInfoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notlar
                  </label>
                  <textarea
                    name="notes"
                    value={customerInfo.notes}
                    onChange={handleCustomerInfoChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Özel istekleriniz varsa belirtebilirsiniz..."
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    style={{ backgroundColor: businessInfo.primaryColor }}
                    className="hover:opacity-90"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Randevu Oluşturuluyor...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Randevuyu Onayla
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {step === 5 && appointment && (
            <div className="text-center">
              <div 
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: businessInfo.primaryColor }}
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Randevunuz Başarıyla Oluşturuldu!</h2>
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="space-y-2 text-left max-w-md mx-auto">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hizmet:</span>
                    <span className="font-medium">{appointment.serviceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tarih:</span>
                    <span className="font-medium">{new Date(appointment.date).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saat:</span>
                    <span className="font-medium">{appointment.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Müşteri:</span>
                    <span className="font-medium">{appointment.customer.firstName} {appointment.customer.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telefon:</span>
                    <span className="font-medium">{appointment.customer.phone}</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Randevu detayları telefon numaranıza SMS ile gönderilecektir.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/${tenant.slug}">
                  <Button variant="outline">Ana Sayfaya Dön</Button>
                </Link>
                <Button 
                  onClick={() => window.print()}
                  style={{ backgroundColor: businessInfo.primaryColor }}
                  className="hover:opacity-90"
                >
                  Randevuyu Yazdır
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;
}