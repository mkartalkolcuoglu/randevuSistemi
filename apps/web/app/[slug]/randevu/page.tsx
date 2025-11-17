"use client";

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle, formatPhone, normalizePhone, PHONE_PLACEHOLDER, PHONE_MAX_LENGTH, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui';
import { 
  ArrowLeft,
  ArrowRight, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Check,
  AlertCircle,
  X
} from 'lucide-react';
import { useTenant, useServices, useStaff, useAvailableSlots, useCreateAppointment } from '../../../lib/api-hooks';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { parseWorkingHours, isWorkingDay } from '../../../lib/time-slots';

interface PageProps {
  params: Promise<{ slug: string }>;
}

type StepType = 'phone' | 'service' | 'staff' | 'datetime' | 'customer' | 'confirmation';

export default function RandevuPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<StepType>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerPackages, setCustomerPackages] = useState<any[]>([]);
  const [hasPackages, setHasPackages] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<any>(null);
  const [selectedPackageUsage, setSelectedPackageUsage] = useState<any>(null);
  const [usePackageForService, setUsePackageForService] = useState<boolean>(false);
  const [showPackageChoice, setShowPackageChoice] = useState<boolean>(false);
  const [checkingPackages, setCheckingPackages] = useState<boolean>(false);
  const [phoneChecked, setPhoneChecked] = useState<boolean>(false);
  const [isBlacklisted, setIsBlacklisted] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successAppointment, setSuccessAppointment] = useState<{
    id: string;
    date: string;
    time: string;
    serviceName: string;
  } | null>(null);

  // Sözleşme onayı
  const [agreementsAccepted, setAgreementsAccepted] = useState(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'package' | 'card' | 'later' | null>(null);
  const [showPaymentIframe, setShowPaymentIframe] = useState(false);
  const [paymentIframeUrl, setPaymentIframeUrl] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // API Hooks
  const { data: tenant, isLoading: tenantLoading } = useTenant(slug);
  const { data: services, isLoading: servicesLoading } = useServices(slug);
  const { data: staff, isLoading: staffLoading } = useStaff(slug);
  const { data: availableSlots } = useAvailableSlots(selectedService, selectedDate, selectedStaff, slug);
  const createAppointmentMutation = useCreateAppointment();

  // Parse working hours from tenant data
  const workingHours = parseWorkingHours(tenant?.workingHours);
  
  // Debug: Log working hours and tenant data
  if (tenant) {
    console.log('🕒 Tenant workingHours (raw):', tenant.workingHours, typeof tenant.workingHours);
    console.log('🕒 Parsed workingHours:', workingHours);
  }
  
  // Generate next 14 days for date selection
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const isClosed = !isWorkingDay(dateStr, workingHours);
    
    if (i < 7) {
      console.log(`📅 ${dateStr} (${format(date, 'EEEE', { locale: tr })}): isClosed=${isClosed}`);
    }
    
    return {
      date: dateStr,
      display: format(date, 'dd MMM, EEEE', { locale: tr }),
      isToday: i === 0,
      isClosed: isClosed
    };
  });

  const selectedServiceData = services?.find(s => s.id === selectedService);

  // Check if selected service is covered by a package
  const checkServiceInPackage = (serviceId: string) => {
    if (!hasPackages || !customerPackages.length) return null;
    
    for (const cp of customerPackages) {
      const usage = cp.usages.find((u: any) => 
        u.itemType === 'service' && 
        u.itemId === serviceId && 
        u.remainingQuantity > 0
      );
      if (usage) {
        return {
          hasPackage: true,
          packageName: cp.package.name,
          remainingQuantity: usage.remainingQuantity,
          usage: usage,
          customerPackageId: cp.id
        };
      }
    }
    return null;
  };

  const servicePackageInfo = selectedService ? checkServiceInPackage(selectedService) : null;

  const steps = [
    { id: 'phone', title: 'Telefon Doğrulama', icon: '📱' },
    { id: 'service', title: 'Hizmet Seçimi', icon: '1️⃣' },
    { id: 'staff', title: 'Personel Seçimi', icon: '2️⃣' },
    { id: 'datetime', title: 'Tarih & Saat', icon: '3️⃣' },
    { id: 'customer', title: 'İletişim Bilgileri', icon: '4️⃣' },
    { id: 'confirmation', title: 'Onay', icon: '5️⃣' }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'phone': 
        // Can proceed if phone is valid AND not checking AND not blacklisted
        return phoneNumber.length >= 10 && !checkingPackages && !isBlacklisted;
      case 'service': return !!selectedService;
      case 'staff': return !!selectedStaff;
      case 'datetime': return !!selectedDate && !!selectedTime;
      case 'customer': return !!(customerInfo.name && customerInfo.email && customerInfo.phone);
      case 'confirmation': return true;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (!canProceedToNext()) return;
    
    // If on phone step, check for packages first
    if (currentStep === 'phone') {
      if (!phoneChecked && phoneNumber.length >= 10) {
        // First click: Check packages and show results
        await checkCustomerPackages();
        setPhoneChecked(true);
        // Don't proceed to next step - let user see the results
        return;
      }
      // Second click (after seeing results): Proceed to next step
    }
    
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < steps.length) {
      const nextStep = steps[nextStepIndex].id as StepType;
      
      // If moving to confirmation and service is covered by package, show choice modal
      if (nextStep === 'confirmation' && servicePackageInfo) {
        setShowPackageChoice(true);
      }
      
      setCurrentStep(nextStep);
    }
  };

  const checkCustomerPackages = async () => {
    setCheckingPackages(true);
    setIsBlacklisted(false); // Reset blacklist status
    
    try {
      console.log('📞 Checking packages and blacklist for phone:', phoneNumber, 'slug:', slug);
      
      // First, check if customer is blacklisted
      try {
        const blacklistUrl = `https://admin.netrandevu.com/api/public/check-blacklist?phone=${encodeURIComponent(phoneNumber)}&tenantSlug=${slug}`;
        console.log('🔍 Calling blacklist API:', blacklistUrl);
        
        const blacklistResponse = await fetch(blacklistUrl);
        console.log('📡 Blacklist API response status:', blacklistResponse.status);
        
        if (blacklistResponse.ok) {
          const blacklistData = await blacklistResponse.json();
          console.log('📊 Blacklist API data:', blacklistData);
          console.log('🔎 isBlacklisted value:', blacklistData.isBlacklisted, 'type:', typeof blacklistData.isBlacklisted);
          
          if (blacklistData.isBlacklisted === true) {
            console.log('🚫 Customer is blacklisted - SHOWING WARNING');
            setIsBlacklisted(true);
            return; // Stop here, don't check packages
          } else {
            console.log('✅ Customer is not blacklisted, continuing...');
          }
        } else {
          console.error('❌ Blacklist API returned error:', blacklistResponse.status);
        }
      } catch (blacklistError) {
        console.error('⚠️ Blacklist check failed, continuing:', blacklistError);
        // Continue to package check if blacklist check fails
      }
      
      // Continue with package check
      const response = await fetch(`https://admin.netrandevu.com/api/customer-packages/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          slug: slug
        })
      });

      const result = await response.json();
      console.log('📦 Package check result:', result);

      if (result.success && result.hasPackages) {
        setHasPackages(true);
        setCustomerPackages(result.packages);
        setExistingCustomer(result.customer);
        console.log('✅ Customer with packages found');
        // Pre-fill customer info
        setCustomerInfo({
          name: `${result.customer.firstName} ${result.customer.lastName}`,
          email: result.customer.email,
          phone: result.customer.phone,
          notes: ''
        });
      } else if (result.success && result.customer && !result.hasPackages) {
        // Customer exists but no packages
        setHasPackages(false);
        setCustomerPackages([]);
        setExistingCustomer(result.customer);
        console.log('✅ Customer without packages found');
        setCustomerInfo({
          name: `${result.customer.firstName} ${result.customer.lastName}`,
          email: result.customer.email,
          phone: result.customer.phone,
          notes: ''
        });
      } else {
        // New customer
        setHasPackages(false);
        setCustomerPackages([]);
        setExistingCustomer(null);
        console.log('ℹ️ New customer');
        // Set phone in customer info
        setCustomerInfo(prev => ({ ...prev, phone: phoneNumber }));
      }
    } catch (error) {
      console.error('❌ Error checking packages:', error);
      // Continue with normal flow on error
      setHasPackages(false);
      setExistingCustomer(null);
      setCustomerInfo(prev => ({ ...prev, phone: phoneNumber }));
    } finally {
      setCheckingPackages(false);
    }
  };

  const handlePrev = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(steps[prevStepIndex].id as StepType);
    }
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime || !customerInfo.name) {
      return;
    }

    // Payment method validation (unless using package)
    if (!paymentMethod && !(servicePackageInfo && usePackageForService)) {
      setPaymentError('Lütfen bir ödeme yöntemi seçin.');
      return;
    }

    // Sözleşme onayı kontrolü
    if (!agreementsAccepted) {
      alert('Randevunuzu oluşturmak için lütfen sözleşmeleri okuyup kabul edin.');
      return;
    }

    // Check if customer is blacklisted
    if (customerInfo.phone) {
      try {
        const checkResponse = await fetch(`https://admin.netrandevu.com/api/public/check-blacklist?phone=${encodeURIComponent(customerInfo.phone)}&tenantSlug=${slug}`);
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData.isBlacklisted) {
            alert('Bu telefon numarası için randevu oluşturulamıyor.\n\nLütfen işletme ile iletişime geçin.');
            return;
          }
        }
      } catch (error) {
        console.error('Kara liste kontrolü başarısız:', error);
        // Continue anyway if check fails
      }
    }

    const selectedServiceData = services?.find(s => s.id === selectedService);
    const staffData = staff?.find(s => s.id === selectedStaff);

    // SCENARIO 1: Using Package
    if (paymentMethod === 'package' || (servicePackageInfo && usePackageForService)) {
      try {
        const appointmentData = {
          tenantSlug: slug,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          serviceId: selectedService,
          serviceName: selectedServiceData?.name || 'Seçilen Hizmet',
          staffId: selectedStaff,
          date: selectedDate,
          time: selectedTime,
          duration: selectedServiceData?.duration || 60,
          price: selectedServiceData?.price || 0,
          notes: customerInfo.notes,
          customerInfo,
          usePackageForService: true,
          packageInfo: {
            customerPackageId: servicePackageInfo!.customerPackageId,
            usageId: servicePackageInfo!.usage.id,
            packageName: servicePackageInfo!.packageName,
            serviceId: selectedService
          }
        };

        console.log('📤 [PACKAGE] Creating appointment with package:', appointmentData);
        const appointment = await createAppointmentMutation.mutateAsync(appointmentData);

        setSuccessAppointment({
          id: appointment.id,
          date: selectedDate,
          time: selectedTime,
          serviceName: selectedServiceData?.name || 'Seçilen Hizmet'
        });

        setShowSuccessModal(true);
        resetForm();

      } catch (error) {
        console.error('Randevu oluşturma hatası:', error);
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
        alert(`Randevu oluşturulurken hata: ${errorMessage}`);
      }
    }
    // SCENARIO 2: Pay with Card
    else if (paymentMethod === 'card') {
      try {
        setPaymentLoading(true);
        setPaymentError(null);

        console.log('💳 [CARD] Initiating payment...');

        const appointmentData = {
          tenantId: tenant?.id || slug,
          customerId: existingCustomer?.id || null,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          serviceId: selectedService,
          serviceName: selectedServiceData?.name || 'Seçilen Hizmet',
          staffId: selectedStaff,
          staffName: `${staffData?.firstName} ${staffData?.lastName}`,
          date: selectedDate,
          time: selectedTime,
          duration: selectedServiceData?.duration || 60,
          notes: customerInfo.notes || null
        };

        // Call payment initiate API
        const response = await fetch('/api/payment/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: tenant?.id || slug,
            tenantSlug: slug, // Tenant slug'ı ekle (success sayfası için)
            customerId: existingCustomer?.id || null,
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone,
            amount: selectedServiceData?.price || 0,
            serviceName: selectedServiceData?.name || 'Seçilen Hizmet',
            appointmentData: appointmentData
          })
        });

        const paymentResult = await response.json();

        if (paymentResult.success && paymentResult.iframeUrl) {
          console.log('✅ [CARD] Payment initiated, opening iframe');
          setPaymentIframeUrl(paymentResult.iframeUrl);
          setShowPaymentIframe(true);
          setPaymentLoading(false);

          // Note: The appointment will be created by the callback after successful payment
          // User will need to complete payment in iframe, then we can show success
        } else {
          console.error('❌ [CARD] Payment initiation failed:', paymentResult);
          const errorMsg = paymentResult.details
            ? `${paymentResult.error}: ${paymentResult.details}`
            : (paymentResult.error || 'Ödeme başlatılamadı');
          setPaymentError(errorMsg);
          setPaymentLoading(false);
        }

      } catch (error) {
        console.error('❌ [CARD] Payment error:', error);
        setPaymentError('Ödeme işlemi başlatılırken hata oluştu');
        setPaymentLoading(false);
      }
    }
    // SCENARIO 3: Pay Later
    else if (paymentMethod === 'later') {
      try {
        const appointmentData = {
          tenantSlug: slug,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          serviceId: selectedService,
          serviceName: selectedServiceData?.name || 'Seçilen Hizmet',
          staffId: selectedStaff,
          date: selectedDate,
          time: selectedTime,
          duration: selectedServiceData?.duration || 60,
          price: selectedServiceData?.price || 0,
          notes: customerInfo.notes,
          customerInfo,
          usePackageForService: false,
          packageInfo: null,
          paymentStatus: 'pending' // Mark as pending payment
        };

        console.log('📤 [LATER] Creating appointment without payment:', appointmentData);
        const appointment = await createAppointmentMutation.mutateAsync(appointmentData);

        setSuccessAppointment({
          id: appointment.id,
          date: selectedDate,
          time: selectedTime,
          serviceName: selectedServiceData?.name || 'Seçilen Hizmet'
        });

        setShowSuccessModal(true);
        resetForm();

      } catch (error) {
        console.error('Randevu oluşturma hatası:', error);
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
        alert(`Randevu oluşturulurken hata: ${errorMessage}`);
      }
    }
  };

  const resetForm = () => {
    setCurrentStep('service');
    setSelectedService('');
    setSelectedStaff('');
    setSelectedDate('');
    setSelectedTime('');
    setCustomerInfo({ name: '', email: '', phone: '', notes: '' });
    setAgreementsAccepted(false);
    setPaymentMethod(null);
    setPaymentError(null);
    setUsePackageForService(false);
    setShowPackageChoice(false);
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">İşletme Bulunamadı</h2>
            <p className="text-gray-600 mb-4">Bu bağlantı geçersiz olabilir.</p>
            <Button onClick={() => window.location.href = '/'}>
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderPhoneVerification = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">📱 Telefon Numaranız</h2>
        <p className="text-gray-600">
          Paket kontrolü için telefon numaranızı girin
        </p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon Numarası
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={formatPhone(phoneNumber)}
                  onChange={(e) => {
                    const normalized = normalizePhone(e.target.value);
                    setPhoneNumber(normalized);
                    // Reset check state when phone changes
                    setPhoneChecked(false);
                    setExistingCustomer(null);
                    setCustomerPackages([]);
                    setHasPackages(false);
                    setIsBlacklisted(false);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder={PHONE_PLACEHOLDER}
                  maxLength={PHONE_MAX_LENGTH}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Örnek: 5551234567
              </p>
            </div>

            {phoneNumber.length >= 10 && !checkingPackages && !existingCustomer && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ✓ Telefon numaranız kaydedildi. Devam etmek için "İleri" butonuna tıklayın.
                </p>
              </div>
            )}

            {checkingPackages && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                  <p className="text-sm text-gray-700">
                    Müşteri bilgileri kontrol ediliyor...
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Blacklist Warning */}
      {isBlacklisted && !checkingPackages && (
        <Card className="bg-red-50 border-red-300 border-2">
          <CardContent className="p-6">
            <div className="flex items-start">
              <AlertCircle className="w-8 h-8 text-red-600 mr-4 flex-shrink-0 mt-1" />
              <div className="w-full">
                <h3 className="text-xl font-bold text-red-900 mb-3">
                  Randevu Alamazsınız
                </h3>
                <p className="text-red-800 mb-4">
                  Şu anda randevu alamıyorsunuz. Lütfen firma yetkilisi ile görüşme yapınız.
                </p>
                {tenant?.businessPhone && (
                  <div className="bg-white rounded-lg p-4 border border-red-200">
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 text-red-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600 mb-1">İletişim:</p>
                        <a 
                          href={`tel:${tenant.businessPhone}`}
                          className="text-lg font-semibold text-red-700 hover:text-red-900 underline"
                        >
                          {tenant.businessPhone}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {existingCustomer && !checkingPackages && !isBlacklisted && (
        <Card className={hasPackages ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}>
          <CardContent className="p-6">
            <div className="flex items-start">
              <Check className={`w-6 h-6 ${hasPackages ? 'text-green-600' : 'text-blue-600'} mr-3 flex-shrink-0 mt-1`} />
              <div className="w-full">
                <h3 className={`font-semibold ${hasPackages ? 'text-green-900' : 'text-blue-900'} mb-2`}>
                  👋 Hoş Geldiniz, {existingCustomer.firstName} {existingCustomer.lastName}!
                </h3>
                <div className="text-sm text-gray-700 mb-3 space-y-1">
                  <p><strong>Email:</strong> {existingCustomer.email}</p>
                  <p><strong>Telefon:</strong> {existingCustomer.phone}</p>
                </div>
                
                {hasPackages && customerPackages.length > 0 ? (
                  <>
                    <p className="text-sm text-green-800 mb-3 font-medium">
                      🎁 Size atanmış {customerPackages.length} paket bulundu!
                    </p>
                    <div className="space-y-2">
                      {customerPackages.map((cp: any) => (
                        <div key={cp.id} className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900">{cp.package.name}</h4>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Aktif</span>
                          </div>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {cp.usages.map((usage: any) => (
                              <li key={usage.id} className="flex justify-between">
                                <span>• {usage.itemName}</span>
                                <span className="font-semibold text-green-600">
                                  {usage.remainingQuantity} / {usage.totalQuantity}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-blue-800">
                    Bilgileriniz sistemde kayıtlı. Normal randevu akışı ile devam edebilirsiniz.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderServiceSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hizmet Seçin</h2>
        <p className="text-gray-600">Almak istediğiniz hizmeti seçin</p>
      </div>

      {servicesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-32"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services?.map((service) => {
            const packageInfo = checkServiceInPackage(service.id);
            return (
              <div
                key={service.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedService(service.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedService(service.id);
                  }
                }}
              >
              <Card
                className={`cursor-pointer transition-all duration-200 select-none relative ${
                  selectedService === service.id
                    ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200 shadow-lg'
                    : 'active:border-blue-200 active:shadow-md'
                }`}
              >
                {packageInfo && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                    <span>🎁</span>
                    <span>Paketinizde var ({packageInfo.remainingQuantity})</span>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      <span className="text-sm">{service.duration} dakika</span>
                    </div>
                    {packageInfo ? (
                      <div className="text-lg font-bold text-green-600">
                        Paketten
                      </div>
                    ) : (
                      <div className="text-lg font-bold text-blue-600">
                        ₺{service.price}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderStaffSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personel Seçin</h2>
        <p className="text-gray-600">Hizmetinizi alacağınız personeli seçin</p>
      </div>

      {selectedServiceData && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedServiceData.name}</h3>
                <p className="text-sm text-gray-600">{selectedServiceData.duration} dakika</p>
              </div>
              <div className="text-lg font-bold text-blue-600">₺{selectedServiceData.price}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {staffLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-24"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staff?.map((member) => (
            <div
              key={member.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedStaff(member.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedStaff(member.id);
                }
              }}
            >
            <Card
              className={`cursor-pointer transition-all duration-200 select-none ${
                selectedStaff === member.id
                  ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200 shadow-lg'
                  : 'active:border-blue-200 active:shadow-md'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {member.firstName} {member.lastName}
                    </h3>
                    <p className="text-gray-600 text-sm">{member.position}</p>
                  </div>
                  {selectedStaff === member.id && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </CardContent>
            </Card>
            </div>
          ))}
        </div>
      )}

      {staff && staff.length === 0 && (
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Henüz personel eklenmemiş.</p>
        </div>
      )}
    </div>
  );

  const renderDateTimeSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tarih & Saat Seçin</h2>
        <p className="text-gray-600">Uygun tarih ve saati seçin</p>
      </div>

      {selectedServiceData && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedServiceData.name}</h3>
                <p className="text-sm text-gray-600">{selectedServiceData.duration} dakika</p>
              </div>
              <div className="text-lg font-bold text-blue-600">₺{selectedServiceData.price}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tarih Seçin</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {availableDates.map((dateOption) => (
            <Button
              key={dateOption.date}
              variant={selectedDate === dateOption.date ? "default" : "outline"}
              className={`p-3 h-auto flex flex-col transition-all duration-200 touch-manipulation ${
                dateOption.isClosed
                  ? 'opacity-50 cursor-not-allowed bg-gray-100'
                  : ''
              } ${
                selectedDate === dateOption.date
                  ? 'bg-blue-600 text-white shadow-lg'
                  : dateOption.isClosed
                    ? ''
                    : 'active:bg-blue-50 active:border-blue-300'
              } ${
                dateOption.isToday ? 'border-blue-500' : ''
              }`}
              onClick={() => {
                if (!dateOption.isClosed) {
                  setSelectedDate(dateOption.date);
                }
              }}
              disabled={dateOption.isClosed}
            >
              <Calendar className="w-4 h-4 mb-1" />
              <span className="text-sm font-medium">{dateOption.display}</span>
              {dateOption.isToday && !dateOption.isClosed && <span className="text-xs text-blue-600">Bugün</span>}
              {dateOption.isClosed && <span className="text-xs text-red-600 font-semibold">KAPALI</span>}
            </Button>
          ))}
        </div>
      </div>

      {/* Time Selection - Only show when staff is selected */}
      {selectedDate && selectedStaff && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Saat Seçin</h3>
          <p className="text-sm text-gray-600 mb-4">
            Seçilen personel: {staff?.find(s => s.id === selectedStaff)?.firstName} {staff?.find(s => s.id === selectedStaff)?.lastName}
          </p>
          {availableSlots ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {availableSlots.slots
                .filter(slot => slot.available)
                .map((slot) => (
                  <Button
                    key={slot.time}
                    variant={selectedTime === slot.time ? "default" : "outline"}
                    className={`p-3 text-sm transition-all duration-200 touch-manipulation ${
                      selectedTime === slot.time
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'active:bg-blue-50 active:border-blue-300'
                    }`}
                    onClick={() => setSelectedTime(slot.time)}
                  >
                    {slot.time}
                  </Button>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Uygun saatler yükleniyor...</p>
            </div>
          )}
        </div>
      )}

      {/* Message when staff not selected */}
      {selectedDate && !selectedStaff && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Personel Seçimi Gerekli</h3>
          <p className="text-gray-600 mb-4">
            Saat seçimi için önce bir personel seçmeniz gerekmektedir.
          </p>
          <Button
            variant="outline"
            onClick={() => setCurrentStep('staff')}
          >
            Personel Seçimine Git
          </Button>
        </div>
      )}
    </div>
  );

  const renderCustomerInfo = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">İletişim Bilgileri</h2>
        <p className="text-gray-600">Randevu için gerekli bilgileri girin</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Ad Soyad *
          </label>
          <input
            type="text"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-blue-300"
            placeholder="Adınız ve soyadınız"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            E-posta *
          </label>
          <input
            type="email"
            value={customerInfo.email}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-blue-300"
            placeholder="ornek@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-2" />
            Telefon *
          </label>
          <input
            type="tel"
            value={formatPhone(customerInfo.phone)}
            onChange={(e) => {
              const normalized = normalizePhone(e.target.value);
              setCustomerInfo(prev => ({ ...prev, phone: normalized }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-blue-300"
            placeholder={PHONE_PLACEHOLDER}
            maxLength={PHONE_MAX_LENGTH}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notlar (Opsiyonel)
          </label>
          <textarea
            value={customerInfo.notes}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-blue-300 resize-none"
            placeholder="Özel istekleriniz varsa belirtebilirsiniz..."
          />
        </div>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Randevu Özeti</h2>
        <p className="text-gray-600">Bilgilerinizi kontrol edin ve onaylayın</p>
      </div>

      {/* Package Usage Choice - Only show if service is covered by package and user hasn't decided yet */}
      {servicePackageInfo && showPackageChoice && (
        <Card className="border-2 border-orange-300 bg-orange-50">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Paket Kullanımı
              </h3>
              <p className="text-gray-700 mb-4">
                Aldığınız <strong>{selectedServiceData?.name}</strong> hizmeti, 
                aktif olan <strong>{servicePackageInfo.packageName}</strong> paketinizde mevcut.
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Paketinizde <strong>{servicePackageInfo.remainingQuantity} seans</strong> hakkınız bulunuyor.
              </p>
              <div className="bg-white rounded-lg p-4 mb-6 border border-orange-200">
                <p className="font-semibold text-gray-900 mb-2">
                  Bu randevuyu paketinizden düşürmek ister misiniz?
                </p>
                <p className="text-sm text-gray-600">
                  Evet derseniz randevu tamamlandığında paket hakkınız azalacaktır. 
                  Hayır derseniz normal ücret (₺{selectedServiceData?.price}) tahsil edilecektir.
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => {
                    setUsePackageForService(true);
                    setShowPackageChoice(false);
                  }}
                  className="px-8 py-3 bg-green-600 text-white font-semibold hover:bg-green-700 active:bg-green-800 touch-manipulation flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Evet, Paketten Düş
                </Button>
                <Button
                  onClick={() => {
                    setUsePackageForService(false);
                    setShowPackageChoice(false);
                  }}
                  variant="outline"
                  className="px-8 py-3 font-semibold active:bg-gray-200 touch-manipulation flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Hayır, Ödeme Yapacağım
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Hizmet</h3>
            <p className="text-gray-600">{selectedServiceData?.name}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">{selectedServiceData?.duration} dakika</span>
              {servicePackageInfo ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-green-600">
                    🎁 Paketinizden kullanılacak
                  </span>
                </div>
              ) : (
                <span className="font-semibold text-blue-600">₺{selectedServiceData?.price}</span>
              )}
            </div>
            {servicePackageInfo && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                <p className="font-medium">{servicePackageInfo.packageName}</p>
                <p className="text-xs">Kalan: {servicePackageInfo.remainingQuantity} seans</p>
              </div>
            )}
          </div>

          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Personel</h3>
            {staff?.find(s => s.id === selectedStaff) && (
              <p className="text-gray-600">
                {staff.find(s => s.id === selectedStaff)?.firstName} {staff.find(s => s.id === selectedStaff)?.lastName}
                <span className="text-sm text-gray-500 ml-2">
                  ({staff.find(s => s.id === selectedStaff)?.position})
                </span>
              </p>
            )}
          </div>

          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Tarih & Saat</h3>
            <p className="text-gray-600">
              {selectedDate && format(new Date(selectedDate), 'dd MMMM yyyy, EEEE', { locale: tr })} - {selectedTime}
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-2">İletişim Bilgileri</h3>
            <div className="space-y-1 text-gray-600">
              <p>{customerInfo.name}</p>
              <p>{customerInfo.email}</p>
              <p>{customerInfo.phone}</p>
              {customerInfo.notes && (
                <div className="mt-2">
                  <span className="text-sm font-medium text-gray-700">Notlar: </span>
                  <span className="text-sm text-gray-600">{customerInfo.notes}</span>
                </div>
              )}
            </div>
          </div>

          {servicePackageInfo && usePackageForService ? (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Ödeme</span>
                <span className="text-2xl font-bold text-green-600">Paket Kullanılacak</span>
              </div>
              <p className="text-sm text-green-700 mt-2">
                Bu hizmet paketinizden düşülecektir. Ek ödeme gerekmez.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Toplam Tutar</span>
                <span className="text-2xl font-bold text-blue-600">₺{selectedServiceData?.price}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Selection - Only show after package choice is resolved */}
      {!showPackageChoice && (
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">💳 Ödeme Yöntemi Seçin</h3>
            <div className="space-y-3">
              {/* Option 1: Use Package (only if applicable) */}
              {servicePackageInfo && usePackageForService && (
                <a
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    setPaymentMethod('package');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setPaymentMethod('package');
                    }
                  }}
                  className={`block w-full p-4 rounded-lg border-2 text-left transition-all cursor-pointer select-none ${
                    paymentMethod === 'package'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 bg-white active:border-green-300 active:bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🎁</div>
                      <div>
                        <p className="font-semibold text-gray-900">Paket Kullan</p>
                        <p className="text-sm text-gray-600">
                          {servicePackageInfo.packageName} - Kalan: {servicePackageInfo.remainingQuantity} seans
                        </p>
                      </div>
                    </div>
                    {paymentMethod === 'package' && <Check className="w-6 h-6 text-green-600" />}
                  </div>
                </a>
              )}

              {/* Option 2: Pay with Card */}
              {(!servicePackageInfo || !usePackageForService) && (
                <a
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    setPaymentMethod('card');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setPaymentMethod('card');
                    }
                  }}
                  className={`block w-full p-4 rounded-lg border-2 text-left transition-all cursor-pointer select-none ${
                    paymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-white active:border-blue-300 active:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">💳</div>
                      <div>
                        <p className="font-semibold text-gray-900">Kredi Kartı ile Öde</p>
                        <p className="text-sm text-gray-600">
                          Güvenli ödeme ile hemen öde - ₺{selectedServiceData?.price}
                        </p>
                      </div>
                    </div>
                    {paymentMethod === 'card' && <Check className="w-6 h-6 text-blue-600" />}
                  </div>
                </a>
              )}

              {/* Option 3: Pay Later */}
              {(!servicePackageInfo || !usePackageForService) && (
                <a
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    setPaymentMethod('later');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setPaymentMethod('later');
                    }
                  }}
                  className={`block w-full p-4 rounded-lg border-2 text-left transition-all cursor-pointer select-none ${
                    paymentMethod === 'later'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300 bg-white active:border-orange-300 active:bg-orange-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">⏳</div>
                      <div>
                        <p className="font-semibold text-gray-900">Ödeme Yapmadan İlerle</p>
                        <p className="text-sm text-gray-600">
                          Randevuyu oluştur, ödemeyi sonra yap
                        </p>
                      </div>
                    </div>
                    {paymentMethod === 'later' && <Check className="w-6 h-6 text-orange-600" />}
                  </div>
                </a>
              )}
            </div>

            {paymentError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{paymentError}</p>
              </div>
            )}

            {!paymentMethod && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Devam etmek için bir ödeme yöntemi seçmeniz gerekmektedir.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sözleşme Onayı */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Sözleşme ve Onaylar</h3>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreementsAccepted}
              onChange={(e) => setAgreementsAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              <a href="/musteri-kullanici-sozlesmesi" target="_blank" className="text-blue-600 hover:underline font-medium">
                Müşteri Kullanıcı Sözleşmesi
              </a>,{' '}
              <a href="/gizlilik-politikasi" target="_blank" className="text-blue-600 hover:underline font-medium">
                Gizlilik Politikası
              </a>,{' '}
              <a href="/cerez-cookie-politikasi" target="_blank" className="text-blue-600 hover:underline font-medium">
                Çerez (Cookie) Politikası
              </a> ve{' '}
              <a href="/kvkk-aydinlatma-metni" target="_blank" className="text-blue-600 hover:underline font-medium">
                KVKK Aydınlatma Metni
              </a>'ni okudum ve kabul ediyorum.
            </span>
          </label>

          {!agreementsAccepted && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Randevunuzu oluşturmak için sözleşmeleri kabul etmeniz gerekmektedir.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'phone': return renderPhoneVerification();
      case 'service': return renderServiceSelection();
      case 'staff': return renderStaffSelection();
      case 'datetime': return renderDateTimeSelection();
      case 'customer': return renderCustomerInfo();
      case 'confirmation': return renderConfirmation();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">

      {/* Simple Progress Bar */}
      <div className="bg-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStepIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 w-16 ${
                      index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              {steps.map((step) => (
                <span key={step.id}>{step.title.replace(' Seçimi', '').replace('İletişim Bilgileri', 'Bilgiler')}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Main Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <button
            onClick={handlePrev}
            onTouchEnd={(e) => {
              if (currentStepIndex !== 0) {
                e.preventDefault();
                handlePrev();
              }
            }}
            disabled={currentStepIndex === 0}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className={`inline-flex items-center justify-center px-6 py-3 border-2 rounded-lg text-sm font-medium touch-manipulation select-none min-h-[48px] ${
              currentStepIndex === 0
                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 bg-white text-gray-700 active:bg-gray-50 active:border-gray-400 cursor-pointer'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2 pointer-events-none" />
            <span className="pointer-events-none">Geri</span>
          </button>

          {currentStep === 'confirmation' ? (
            <button
              onClick={handleSubmit}
              onTouchEnd={(e) => {
                const isDisabled = createAppointmentMutation.isPending ||
                  !agreementsAccepted ||
                  showPackageChoice ||
                  (!paymentMethod && !(servicePackageInfo && usePackageForService)) ||
                  paymentLoading;

                if (!isDisabled) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={
                createAppointmentMutation.isPending ||
                !agreementsAccepted ||
                showPackageChoice ||
                (!paymentMethod && !(servicePackageInfo && usePackageForService)) ||
                paymentLoading
              }
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className={`inline-flex items-center justify-center px-6 py-3 border-2 rounded-lg text-sm font-medium touch-manipulation select-none min-h-[48px] ${
                createAppointmentMutation.isPending ||
                !agreementsAccepted ||
                showPackageChoice ||
                (!paymentMethod && !(servicePackageInfo && usePackageForService)) ||
                paymentLoading
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-green-600 bg-green-600 text-white active:bg-green-700 active:border-green-700 cursor-pointer'
              }`}
            >
              {createAppointmentMutation.isPending || paymentLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 pointer-events-none"></div>
                  <span className="pointer-events-none">{paymentLoading ? 'Ödeme Hazırlanıyor...' : 'Oluşturuluyor...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2 pointer-events-none" />
                  <span className="pointer-events-none">Randevuyu Onayla</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              onTouchEnd={(e) => {
                if (canProceedToNext()) {
                  e.preventDefault();
                  handleNext();
                }
              }}
              disabled={!canProceedToNext()}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className={`inline-flex items-center justify-center px-6 py-3 border-2 rounded-lg text-sm font-medium touch-manipulation select-none min-h-[48px] ${
                !canProceedToNext()
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-blue-600 bg-blue-600 text-white active:bg-blue-700 active:border-blue-700 cursor-pointer'
              }`}
            >
              <span className="pointer-events-none">İleri</span>
              <ArrowRight className="w-4 h-4 ml-2 pointer-events-none" />
            </button>
          )}
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-center text-xl">Randevunuz Oluşturuldu!</DialogTitle>
            <DialogDescription className="text-center">
              Randevunuz başarıyla kaydedildi. Randevu bilgileriniz aşağıdadır.
            </DialogDescription>
          </DialogHeader>
          {successAppointment && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Randevu No:</span>
                  <span className="font-semibold text-gray-900">{successAppointment.id}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tarih:</span>
                  <span className="font-semibold text-gray-900">
                    {format(new Date(successAppointment.date), 'dd MMMM yyyy', { locale: tr })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Saat:</span>
                  <span className="font-semibold text-gray-900">{successAppointment.time}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Hizmet:</span>
                  <span className="font-semibold text-gray-900">{successAppointment.serviceName}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Randevu saatinizden önce size hatırlatma yapılacaktır.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                setSuccessAppointment(null);
                router.push(`/${slug}`);
              }}
              className="w-full"
            >
              Tamam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PayTR Payment Iframe Modal */}
      <Dialog open={showPaymentIframe} onOpenChange={setShowPaymentIframe}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-center">💳 Güvenli Ödeme</DialogTitle>
            <DialogDescription className="text-center">
              PayTR güvenli ödeme sistemi ile ödemenizi tamamlayın
            </DialogDescription>
          </DialogHeader>
          <div className="w-full h-[600px]">
            {paymentLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Ödeme sayfası yükleniyor...</p>
                </div>
              </div>
            ) : (
              <iframe
                src={paymentIframeUrl}
                className="w-full h-full border-0 rounded-lg"
                title="PayTR Ödeme"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentIframe(false);
                setPaymentIframeUrl('');
                setPaymentMethod(null);
              }}
              className="w-full"
            >
              İptal Et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
