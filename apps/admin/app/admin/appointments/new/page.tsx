"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ArrowLeft, Save, Calendar, Clock, User, Search } from 'lucide-react';
import Link from 'next/link';
import { generateTimeSlots } from '../../../../lib/time-slots';

export default function NewAppointmentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [allTimeSlots, setAllTimeSlots] = useState<string[]>([]);
  const [timeInterval, setTimeInterval] = useState<number>(30); // Default: 30 minutes

  // Form state
  const [formData, setFormData] = useState({
    customerId: '',
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

  // Update available time slots when date changes
  useEffect(() => {
    console.log('🔄 useEffect triggered! formData.date:', formData.date);
    
    if (!formData.date) {
      console.log('⚠️ No date selected, showing all time slots');
      setAvailableTimeSlots(allTimeSlots);
      return;
    }

    // Get current time in Turkey timezone (UTC+3)
    const now = new Date();
    const turkeyOffset = 3 * 60; // Turkey is UTC+3
    const localOffset = now.getTimezoneOffset(); // Local timezone offset in minutes
    const turkeyTime = new Date(now.getTime() + (turkeyOffset + localOffset) * 60000);

    console.log('🕐 Current time:', now.toISOString());
    console.log('🇹🇷 Turkey time:', turkeyTime.toISOString());
    console.log('📅 Selected date:', formData.date);

    const selectedDate = new Date(formData.date + 'T00:00:00');
    const todayInTurkey = new Date(turkeyTime.toISOString().split('T')[0] + 'T00:00:00');

    console.log('📅 Selected date (parsed):', selectedDate.toISOString());
    console.log('📅 Today in Turkey:', todayInTurkey.toISOString());
    console.log('⚖️ Are they equal?', selectedDate.getTime() === todayInTurkey.getTime());

    // If selected date is not today, allow all time slots
    if (selectedDate.getTime() !== todayInTurkey.getTime()) {
      console.log('✅ Future date selected, showing all slots');
      setAvailableTimeSlots(allTimeSlots);
      return;
    }

    // If selected date is today, filter out past time slots
    const currentHour = turkeyTime.getHours();
    const currentMinute = turkeyTime.getMinutes();

    console.log('⏰ Current hour:', currentHour);
    console.log('⏰ Current minute:', currentMinute);

    const filtered = allTimeSlots.filter(timeSlot => {
      const [hour, minute] = timeSlot.split(':').map(Number);
      const slotTime = hour * 60 + minute;
      const currentTime = currentHour * 60 + currentMinute;
      
      console.log(`🔍 Checking ${timeSlot}: slotTime=${slotTime}, currentTime=${currentTime}, show=${slotTime > currentTime}`);
      
      return slotTime > currentTime;
    });

    console.log('✅ Filtered slots:', filtered);
    setAvailableTimeSlots(filtered);
  }, [formData.date]);

  // Fetch settings and generate time slots on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/tenant-info');
        if (response.ok) {
          const data = await response.json();
          const interval = data.data?.appointmentTimeInterval || 30;
          setTimeInterval(interval);
          
          // Generate time slots based on interval
          const slots = generateTimeSlots(9, 19, interval);
          setAllTimeSlots(slots);
          console.log('⚙️ Time interval loaded:', interval, 'minutes');
          console.log('📅 Generated time slots:', slots);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        // Fallback to default
        const slots = generateTimeSlots(9, 19, 30);
        setAllTimeSlots(slots);
      }
    };

    fetchSettings();
    fetchServices();
    fetchStaff();
    fetchCustomers();
  }, []);

  // Filter customers based on search
  useEffect(() => {
    if (customerSearch.length > 0) {
      const filtered = customers.filter(customer =>
        customer.firstName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.lastName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.phone?.includes(customerSearch) ||
        customer.email?.toLowerCase().includes(customerSearch.toLowerCase())
      );
      setFilteredCustomers(filtered);
      setShowCustomerDropdown(true);
    } else {
      setFilteredCustomers([]);
      setShowCustomerDropdown(false);
    }
  }, [customerSearch, customers]);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data.data || []);
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
        setStaff(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
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

  const handleCustomerSelect = (customer: any) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerPhone: customer.phone,
      customerEmail: customer.email
    }));
    setCustomerSearch(`${customer.firstName} ${customer.lastName}`);
    setShowCustomerDropdown(false);
  };

  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearch(value);
    setFormData(prev => ({
      ...prev,
      customerId: '',
      customerName: value,
      customerPhone: '',
      customerEmail: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      console.log('Appointment created:', result);
      
      alert('Randevu başarıyla oluşturuldu!');
      router.push('/admin/appointments');
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Randevu oluşturulurken bir hata oluştu.');
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

  return (
    <div className="p-6">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/admin/appointments" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Randevulara Geri Dön
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Yeni Randevu Oluştur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection with Autocomplete */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 relative">
                <Label htmlFor="customerSearch">Müşteri Ara *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="customerSearch"
                    value={customerSearch}
                    onChange={(e) => handleCustomerSearchChange(e.target.value)}
                    placeholder="Müşteri adı, telefon veya email ile ara..."
                    className="pl-10"
                    required
                  />
                </div>
                
                {/* Customer Dropdown */}
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                        <div className="text-sm text-gray-500">{customer.phone} • {customer.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Müşteri Telefonu</Label>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  placeholder="Telefon numarası"
                  readOnly={!!formData.customerId}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Müşteri Email</Label>
                <Input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  placeholder="Email adresi"
                  readOnly={!!formData.customerId}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceId">Hizmet *</Label>
                <select
                  id="serviceId"
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="staffId">Personel *</Label>
                <select
                  id="staffId"
                  name="staffId"
                  value={formData.staffId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Beklemede</option>
                  <option value="confirmed">Onaylandı</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal Edildi</option>
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
                  'Kaydediliyor...'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Randevuyu Kaydet
                  </>
                )}
              </Button>
              <Link href="/admin/appointments">
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