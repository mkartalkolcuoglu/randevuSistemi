"use client";

import { useState, use } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { 
  ArrowLeft,
  ArrowRight, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Check,
  AlertCircle
} from 'lucide-react';
import { useTenant, useServices, useStaff, useAvailableSlots, useCreateAppointment } from '../../../lib/api-hooks';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';

interface PageProps {
  params: Promise<{ slug: string }>;
}

type StepType = 'service' | 'staff' | 'datetime' | 'customer' | 'confirmation';

export default function RandevuPage({ params }: PageProps) {
  const { slug } = use(params);
  const [currentStep, setCurrentStep] = useState<StepType>('service');
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

  // API Hooks
  const { data: tenant, isLoading: tenantLoading } = useTenant(slug);
  const { data: services, isLoading: servicesLoading } = useServices(slug);
  const { data: staff, isLoading: staffLoading } = useStaff(slug);
  const { data: availableSlots } = useAvailableSlots(selectedService, selectedDate, selectedStaff);
  const createAppointmentMutation = useCreateAppointment();

  // Generate next 14 days for date selection
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      date: format(date, 'yyyy-MM-dd'),
      display: format(date, 'dd MMM, EEEE', { locale: tr }),
      isToday: i === 0
    };
  });

  const selectedServiceData = services?.find(s => s.id === selectedService);

  const steps = [
    { id: 'service', title: 'Hizmet Seçimi', icon: '1️⃣' },
    { id: 'staff', title: 'Personel Seçimi', icon: '2️⃣' },
    { id: 'datetime', title: 'Tarih & Saat', icon: '3️⃣' },
    { id: 'customer', title: 'İletişim Bilgileri', icon: '4️⃣' },
    { id: 'confirmation', title: 'Onay', icon: '5️⃣' }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'service': return !!selectedService;
      case 'staff': return !!selectedStaff;
      case 'datetime': return !!selectedDate && !!selectedTime;
      case 'customer': return !!(customerInfo.name && customerInfo.email && customerInfo.phone);
      case 'confirmation': return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canProceedToNext()) return;
    
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < steps.length) {
      setCurrentStep(steps[nextStepIndex].id as StepType);
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

    try {
      const selectedServiceData = services?.find(s => s.id === selectedService);
      const appointmentData = {
        tenantSlug: slug,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        serviceName: selectedServiceData?.name || 'Seçilen Hizmet',
        staffId: selectedStaff,
        date: selectedDate,
        time: selectedTime,
        duration: selectedServiceData?.duration || 60,
        price: selectedServiceData?.price || 0,
        notes: customerInfo.notes,
        customerInfo
      };
      
      console.log('Gönderilen randevu verisi:', appointmentData);
      const appointment = await createAppointmentMutation.mutateAsync(appointmentData);

      // Redirect to success page or show success message
      alert(`Randevunuz başarıyla oluşturuldu! Randevu ID: ${appointment.id}`);
      
      // Reset form
      setCurrentStep('service');
      setSelectedService('');
      setSelectedStaff('');
      setSelectedDate('');
      setSelectedTime('');
      setCustomerInfo({ name: '', email: '', phone: '', notes: '' });
      
    } catch (error) {
      console.error('Randevu oluşturma hatası:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      alert(`Randevu oluşturulurken hata: ${errorMessage}`);
    }
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
          {services?.map((service) => (
            <Card 
              key={service.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02] ${
                selectedService === service.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200 shadow-lg' 
                  : 'hover:border-blue-200'
              }`}
              onClick={() => setSelectedService(service.id)}
            >
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="text-sm">{service.duration} dakika</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    ₺{service.price}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
            <Card 
              key={member.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02] ${
                selectedStaff === member.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200 shadow-lg' 
                  : 'hover:border-blue-200'
              }`}
              onClick={() => setSelectedStaff(member.id)}
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
              className={`p-3 h-auto flex flex-col transition-all duration-200 transform hover:scale-105 ${
                selectedDate === dateOption.date 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'hover:bg-blue-50 hover:border-blue-300'
              } ${
                dateOption.isToday ? 'border-blue-500' : ''
              }`}
              onClick={() => setSelectedDate(dateOption.date)}
            >
              <Calendar className="w-4 h-4 mb-1" />
              <span className="text-sm font-medium">{dateOption.display}</span>
              {dateOption.isToday && <span className="text-xs text-blue-600">Bugün</span>}
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
                    className={`p-3 text-sm transition-all duration-200 transform hover:scale-105 ${
                      selectedTime === slot.time 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'hover:bg-blue-50 hover:border-blue-300'
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
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-blue-300"
            placeholder="0555 123 45 67"
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

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Hizmet</h3>
            <p className="text-gray-600">{selectedServiceData?.name}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">{selectedServiceData?.duration} dakika</span>
              <span className="font-semibold text-blue-600">₺{selectedServiceData?.price}</span>
            </div>
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

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Toplam Tutar</span>
              <span className="text-2xl font-bold text-blue-600">₺{selectedServiceData?.price}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
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
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>

          {currentStep === 'confirmation' ? (
            <Button
              onClick={handleSubmit}
              disabled={createAppointmentMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createAppointmentMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Randevuyu Onayla
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceedToNext()}
            >
              İleri
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
