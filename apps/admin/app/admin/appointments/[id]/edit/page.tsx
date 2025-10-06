"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

// Window type extension for currentAppointment
declare global {
  interface Window {
    currentAppointment?: any;
  }
}

export default function EditAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);

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
    paymentType: 'cash'
  });

  // Time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30'
  ];

  useEffect(() => {
    if (params.id) {
      fetchAppointment();
      fetchServices();
      fetchStaff();
    }
  }, [params.id]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/appointments/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        const appointment = data.data;
        
        // Appointment data'yı store edelim ki sonra service/staff matching yapabilelim
        window.currentAppointment = appointment;
        
        setFormData({
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
          paymentType: appointment.paymentType || 'cash'
        });
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
        
        // Appointment yüklendiyse, serviceName'e göre gerçek serviceId'yi bul
        if (window.currentAppointment && window.currentAppointment.serviceName) {
          const matchingService = servicesList.find(s => s.name === window.currentAppointment.serviceName);
          if (matchingService) {
            setFormData(prev => ({
              ...prev,
              serviceId: matchingService.id,
              duration: matchingService.duration
            }));
          }
        }
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
        
        // Appointment yüklendiyse, staffName'e göre gerçek staffId'yi bul
        if (window.currentAppointment && window.currentAppointment.staffName) {
          let matchingStaff = staffList.find(s => 
            `${s.firstName} ${s.lastName}` === window.currentAppointment.staffName ||
            s.firstName === window.currentAppointment.staffName.split(' ')[0]
          );
          
          // Eğer tam eşleşme bulunamazsa (örn: "Web Randevu" gibi fake isimler için)
          // ilk staff'ı seç
          if (!matchingStaff && staffList.length > 0) {
            matchingStaff = staffList[0];
            console.log('Staff matching bulunamadı, ilk staff seçildi:', matchingStaff.firstName, matchingStaff.lastName);
          }
          
          if (matchingStaff) {
            setFormData(prev => ({
              ...prev,
              staffId: matchingStaff.id
            }));
          }
        } else if (staffList.length > 0) {
          // Hiç appointment staffName'i yoksa da ilk staff'ı seç
          setFormData(prev => ({
            ...prev,
            staffId: staffList[0].id
          }));
        }
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
                  {timeSlots.map((time) => (
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
              </div>
            </div>

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
