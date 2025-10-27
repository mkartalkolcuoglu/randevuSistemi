"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { generateTimeSlots, parseWorkingHours, getWorkingHoursForDay, type WorkingHours } from '../../../../../lib/time-slots';


export default function EditAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [allTimeSlots, setAllTimeSlots] = useState<string[]>([]);
  const [timeInterval, setTimeInterval] = useState<number>(30); // Default: 30 minutes
  const [workingHours, setWorkingHours] = useState<WorkingHours | null>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    serviceId: '',
    staffId: '',
    date: '',
    time: '',
    duration: 60,
    notes: '',
    status: 'pending',
    paymentType: 'cash',
    packageInfo: null as any
  });

  // Update available time slots when date or settings change
  useEffect(() => {
    if (!formData.date || !workingHours) {
      setAvailableTimeSlots([]);
      setAllTimeSlots([]);
      return;
    }

    // Check if the selected day is a working day
    const dayHours = getWorkingHoursForDay(formData.date, workingHours);
    
    if (!dayHours) {
      console.log('❌ Selected date is not a working day (closed)');
      setAvailableTimeSlots([]);
      setAllTimeSlots([]);
      return;
    }

    // Parse start and end hours
    const [startHour, startMinute] = dayHours.start.split(':').map(Number);
    const [endHour, endMinute] = dayHours.end.split(':').map(Number);

    // Generate time slots based on working hours
    const slots = generateTimeSlots(startHour, endHour, timeInterval);
    setAllTimeSlots(slots);

    // Get current time in Turkey timezone (UTC+3)
    const now = new Date();
    const turkeyOffset = 3 * 60; // Turkey is UTC+3
    const localOffset = now.getTimezoneOffset();
    const turkeyTime = new Date(now.getTime() + (turkeyOffset + localOffset) * 60000);

    const selectedDate = new Date(formData.date + 'T00:00:00');
    const todayInTurkey = new Date(turkeyTime.toISOString().split('T')[0] + 'T00:00:00');

    // If selected date is not today, allow all time slots
    if (selectedDate.getTime() !== todayInTurkey.getTime()) {
      setAvailableTimeSlots(slots);
      return;
    }

    // If today, filter out past times
    const currentHour = turkeyTime.getHours();
    const currentMinute = turkeyTime.getMinutes();

    const filtered = slots.filter(timeSlot => {
      const [hour, minute] = timeSlot.split(':').map(Number);
      const slotTime = hour * 60 + minute;
      const currentTime = currentHour * 60 + currentMinute;
      
      return slotTime > currentTime;
    });

    setAvailableTimeSlots(filtered);
  }, [formData.date, workingHours, timeInterval]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/tenant-info');
        if (response.ok) {
          const data = await response.json();
          const interval = data.data?.appointmentTimeInterval || 30;
          setTimeInterval(interval);
          
          // Parse working hours
          const hours = parseWorkingHours(data.data?.workingHours);
          setWorkingHours(hours);
          
          console.log('⚙️ Settings loaded:', { interval, workingHours: hours });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        // Fallback to defaults
        setTimeInterval(30);
        setWorkingHours(parseWorkingHours(null));
      }
    };

    if (params.id) {
      // Önce ayarları, hizmetleri ve personel listesini yükle, sonra randevu verisini yükle
      Promise.all([fetchSettings(), fetchServices(), fetchStaff()]).then(() => {
        fetchAppointment();
      });
    }
  }, [params.id]);

  // Services ve appointment yüklendikten sonra serviceId eşleştirmesi yap
  useEffect(() => {
    if (services.length > 0 && formData.serviceId && !services.find(s => s.id === formData.serviceId)) {
      // ServiceId eşleşmiyorsa, ilk hizmeti seç
      const firstService = services[0];
      if (firstService) {
        setFormData(prev => ({
          ...prev,
          serviceId: firstService.id,
          duration: firstService.duration
        }));
      }
    }
  }, [services, formData.serviceId]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/appointments/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        const appointment = data.data;
        
        
        // Parse packageInfo if it exists
        let parsedPackageInfo = null;
        if (appointment.packageInfo) {
          try {
            parsedPackageInfo = typeof appointment.packageInfo === 'string' 
              ? JSON.parse(appointment.packageInfo) 
              : appointment.packageInfo;
          } catch (error) {
            console.error('Error parsing packageInfo:', error);
          }
        }

        const newFormData = {
          customerName: appointment.customerName || '',
          customerPhone: appointment.customerPhone || '',
          customerEmail: appointment.customerEmail || '',
          serviceId: appointment.serviceId || '',
          staffId: appointment.staffId || '',
          date: appointment.date || '',
          time: appointment.time || '',
          duration: appointment.duration || 60,
          notes: appointment.notes || '',
          status: appointment.status || 'pending',
          paymentType: appointment.paymentType || 'cash',
          packageInfo: parsedPackageInfo
        };
        setFormData(newFormData);
      } else {
        console.error('Appointment not found');
        router.push('/admin/appointments');
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      router.push('/admin/appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        const servicesList = data.data || [];
        setServices(servicesList);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff');
      if (response.ok) {
        const data = await response.json();
        const staffList = data.data || [];
        setStaff(staffList);
        
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleServiceChange = (serviceId: string) => {
    const selectedService = services.find(s => s.id === serviceId);
    setFormData(prev => ({
      ...prev,
      serviceId,
      duration: selectedService ? selectedService.duration : 60
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/appointments/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      console.log('Appointment updated:', result);
      
      alert('Randevu başarıyla güncellendi!');
      router.push(`/admin/appointments/${params.id}`);
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Randevu güncellenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <div className="mb-6">
        <Link href={`/admin/appointments/${params.id}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Randevu Detayına Geri Dön
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Randevu Düzenle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customerName">Müşteri Adı *</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Müşteri adı"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Telefon</Label>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  placeholder="Telefon numarası"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  placeholder="Email adresi"
                />
              </div>
            </div>

            {/* Service & Staff Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="serviceId">Hizmet *</Label>
                <select
                  id="serviceId"
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Hizmet seçin</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - ₺{service.price} ({service.duration} dk)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staffId">Personel *</Label>
                <select
                  id="staffId"
                  name="staffId"
                  value={formData.staffId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Personel seçin</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} - {member.position}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date">Tarih *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Saat *</Label>
                <select
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Saat seçin</option>
                  {availableTimeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Süre (Dakika)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="15"
                  max="300"
                  step="15"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Beklemede</option>
                  <option value="confirmed">Onaylandı</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentType">Ödeme Tipi</Label>
                {formData.packageInfo ? (
                  <div className="flex items-center h-10 px-3 py-2 border border-green-300 bg-green-50 rounded-md">
                    <span className="text-green-700 font-semibold flex items-center">
                      🎁 Paket Kullanımı
                    </span>
                  </div>
                ) : (
                  <select
                    id="paymentType"
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Nakit</option>
                    <option value="credit_card">Kredi Kartı</option>
                    <option value="bank_transfer">Havale</option>
                  </select>
                )}
              </div>
            </div>

            {/* Package Info Banner */}
            {formData.packageInfo && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🎁</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-semibold text-green-900">
                      Paket Randevusu
                    </h3>
                    <p className="mt-1 text-sm text-green-700">
                      Bu randevu, <span className="font-semibold">{formData.packageInfo.packageName}</span> paketinden kullanılmaktadır.
                    </p>
                    <p className="mt-1 text-xs text-green-600">
                      Bu randevu için ödeme alınmayacaktır.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Randevu hakkında notlar..."
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  'Güncelleniyor...'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Randevuyu Güncelle
                  </>
                )}
              </Button>
              <Link href={`/admin/appointments/${params.id}`}>
                <Button type="button" variant="outline">
                  İptal
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
