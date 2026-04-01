"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ArrowLeft, Save, Calendar, Clock, User, Search, Gift } from 'lucide-react';
import Link from 'next/link';
import { generateTimeSlots, parseWorkingHours, getWorkingHoursForDay, type WorkingHours } from '../../../../lib/time-slots';

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
  const [workingHours, setWorkingHours] = useState<WorkingHours | null>(null);
  const [blacklistWarning, setBlacklistWarning] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [blockedDates, setBlockedDates] = useState<{ title: string; startDate: string; endDate: string }[]>([]);
  const [blockedDateWarning, setBlockedDateWarning] = useState<string | null>(null);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);
  const [customerPackages, setCustomerPackages] = useState<any[]>([]);
  const [matchingPackageUsage, setMatchingPackageUsage] = useState<any>(null);
  const [usePackage, setUsePackage] = useState<boolean | null>(null);

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

  // Update available time slots when date or settings change
  useEffect(() => {
    console.log('🔄 useEffect triggered! date:', formData.date, 'workingHours:', workingHours, 'timeInterval:', timeInterval);
    
    if (!formData.date || !workingHours) {
      setAvailableTimeSlots([]);
      setAllTimeSlots([]);
      setBlockedDateWarning(null);
      return;
    }

    // Check if the selected date is blocked (holiday)
    const blocked = blockedDates.find(
      b => b.startDate <= formData.date && b.endDate >= formData.date
    );
    if (blocked) {
      setBlockedDateWarning(`Bu tarih tatil nedeniyle kapalı: ${blocked.title}`);
      setAvailableTimeSlots([]);
      setAllTimeSlots([]);
      return;
    }
    setBlockedDateWarning(null);

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

    console.log('⏰ Working hours for this day:', dayHours.start, '-', dayHours.end);

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
      console.log('✅ Future date selected, showing all slots');
      setAvailableTimeSlots(slots);
      return;
    }

    // If today, filter out past times
    console.log('⏰ Selected date is today, filtering past times');
    const currentHour = turkeyTime.getHours();
    const currentMinute = turkeyTime.getMinutes();

    const filtered = slots.filter(timeSlot => {
      const [hour, minute] = timeSlot.split(':').map(Number);
      const slotTime = hour * 60 + minute;
      const currentTime = currentHour * 60 + currentMinute;
      
      return slotTime > currentTime;
    });

    console.log('✅ Filtered slots:', filtered);
    setAvailableTimeSlots(filtered);
  }, [formData.date, workingHours, timeInterval, blockedDates]);

  // Fetch booked time slots when date, staff, or service duration changes
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!formData.date || !formData.staffId) {
        setBookedTimeSlots([]);
        return;
      }

      try {
        const response = await fetch(`/api/appointments?date=${formData.date}&staffId=${formData.staffId}&limit=100`);
        if (response.ok) {
          const data = await response.json();
          const appointments = (data.data || []).filter((apt: any) => apt.status !== 'cancelled');
          const newDuration = formData.duration || 60;
          const interval = timeInterval || 30;

          // Generate all possible slot times
          const allSlots = availableTimeSlots.length > 0 ? availableTimeSlots : allTimeSlots;
          const booked: string[] = [];

          allSlots.forEach((slotTime) => {
            const [slotH, slotM] = slotTime.split(':').map(Number);
            const slotStart = slotH * 60 + slotM;
            const slotEnd = slotStart + newDuration;

            // Check overlap with each existing appointment
            for (const apt of appointments) {
              const [aptH, aptM] = (apt.time || '').split(':').map(Number);
              if (isNaN(aptH)) continue;
              const aptStart = aptH * 60 + aptM;
              const aptEnd = aptStart + (apt.duration || 60);

              // Overlap: new appointment would clash with existing one
              if (slotStart < aptEnd && slotEnd > aptStart) {
                booked.push(slotTime);
                break;
              }
            }
          });

          setBookedTimeSlots(booked);
        }
      } catch (error) {
        console.error('Error fetching booked slots:', error);
      }
    };

    fetchBookedSlots();
  }, [formData.date, formData.staffId, formData.duration, timeInterval, availableTimeSlots]);

  // Fetch settings and generate time slots on mount
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

          // Save blocked dates
          setBlockedDates(data.data?.blockedDates || []);

          console.log('⚙️ Settings loaded:', { interval, workingHours: hours });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        // Fallback to defaults
        setTimeInterval(30);
        setWorkingHours(parseWorkingHours(null));
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
        setServices((data.data || []).filter((s: any) => s.status === 'active'));
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

  // Fetch customer packages
  const fetchCustomerPackages = async (phone: string) => {
    try {
      const response = await fetch('/api/customer-packages/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.hasPackages) {
          setCustomerPackages(data.packages || []);
        } else {
          setCustomerPackages([]);
        }
      }
    } catch (error) {
      console.error('Error fetching customer packages:', error);
      setCustomerPackages([]);
    }
  };

  // Check if selected service matches a customer package
  useEffect(() => {
    if (!formData.serviceId || customerPackages.length === 0) {
      setMatchingPackageUsage(null);
      setUsePackage(null);
      return;
    }

    for (const pkg of customerPackages) {
      const usages = pkg.usages || [];
      const match = usages.find((u: any) =>
        u.itemType === 'service' && u.itemId === formData.serviceId && u.remainingQuantity > 0
      );
      if (match) {
        setMatchingPackageUsage({ ...match, packageName: pkg.package?.name, customerPackageId: pkg.id });
        setUsePackage(null); // Reset choice when service changes
        return;
      }
    }
    setMatchingPackageUsage(null);
    setUsePackage(null);
  }, [formData.serviceId, customerPackages]);

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

    // Fetch packages for this customer
    if (customer.phone) {
      fetchCustomerPackages(customer.phone);
    } else {
      setCustomerPackages([]);
    }

    // Check if customer is blacklisted
    if (customer.isBlacklisted) {
      setBlacklistWarning(
        `⚠️ UYARI: Bu müşteri kara listede! (${customer.noShowCount || 0} defa gelmedi) ` +
        `Randevu oluşturabilirsiniz ancak dikkatli olun.`
      );
    } else if (customer.noShowCount > 0) {
      setBlacklistWarning(
        `⚠️ DİKKAT: Bu müşteri ${customer.noShowCount} defa randevusuna gelmedi.`
      );
    } else {
      setBlacklistWarning(null);
    }
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
    setCustomerPackages([]);
    setMatchingPackageUsage(null);
    setUsePackage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Tatil günü kontrolü
    if (blockedDateWarning) {
      alert(blockedDateWarning);
      return;
    }

    // Telefon numarası validasyonu
    if (formData.customerPhone && (formData.customerPhone.length < 10 || formData.customerPhone.length > 11)) {
      setPhoneError('Telefon numarası 10-11 hane olmalıdır');
      return;
    }

    setIsLoading(true);

    try {
      const submitData: any = { ...formData };

      // Add package info if user chose to use package
      if (usePackage && matchingPackageUsage) {
        submitData.usePackageForService = true;
        submitData.packageInfo = {
          customerPackageId: matchingPackageUsage.customerPackageId,
          usageId: matchingPackageUsage.id,
          packageName: matchingPackageUsage.packageName,
          serviceId: formData.serviceId
        };
        submitData.paymentType = 'package';
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Randevu oluşturulamadı');
      }
      console.log('Appointment created:', result);
      
      alert('Randevu başarıyla oluşturuldu!');
      router.push('/admin/appointments');
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      alert(error?.message || 'Randevu oluşturulurken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Telefon numarası validasyonu
    if (name === 'customerPhone') {
      // Sadece rakamları kabul et
      const digitsOnly = value.replace(/\D/g, '');

      // Maksimum 11 hane (05XX XXX XXXX formatı)
      if (digitsOnly.length > 11) {
        return;
      }

      // Hata mesajı kontrolü
      if (digitsOnly.length > 0 && digitsOnly.length < 10) {
        setPhoneError('Telefon numarası en az 10 hane olmalıdır');
      } else if (digitsOnly.length > 11) {
        setPhoneError('Telefon numarası en fazla 11 hane olabilir');
      } else {
        setPhoneError(null);
      }

      setFormData(prev => ({
        ...prev,
        customerPhone: digitsOnly
      }));
      return;
    }

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
          {/* Blacklist Warning */}
          {blacklistWarning && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r">
              <p className="text-red-800 font-medium">{blacklistWarning}</p>
            </div>
          )}

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
                  placeholder="05XX XXX XXXX"
                  readOnly={!!formData.customerId}
                  maxLength={11}
                  className={phoneError ? 'border-red-500' : ''}
                />
                {phoneError && (
                  <p className="text-sm text-red-500">{phoneError}</p>
                )}
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

            {/* Package Usage Banner */}
            {matchingPackageUsage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Gift className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">
                      Bu hizmet müşterinin paketinde mevcut!
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      <strong>{matchingPackageUsage.packageName}</strong> - {matchingPackageUsage.itemName} ({matchingPackageUsage.remainingQuantity} kullanım kaldı)
                    </p>
                    <div className="flex gap-3 mt-3">
                      <button
                        type="button"
                        onClick={() => setUsePackage(true)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                          usePackage === true
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-green-700 border border-green-300 hover:bg-green-100'
                        }`}
                      >
                        Paketten Düş
                      </button>
                      <button
                        type="button"
                        onClick={() => setUsePackage(false)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                          usePackage === false
                            ? 'bg-gray-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        Paket Kullanma
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                {blockedDateWarning && (
                  <p className="text-sm text-red-600 font-medium mt-1">⚠️ {blockedDateWarning}</p>
                )}
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
                  {availableTimeSlots.map((time) => {
                    const isBooked = bookedTimeSlots.includes(time);
                    return (
                      <option key={time} value={time} disabled={isBooked} style={isBooked ? { color: '#9ca3af' } : {}}>
                        {time}{isBooked ? ' (Dolu)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="duration">Süre (Dakika)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="1"
                  max="300"
                  step="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentType">Ödeme Tipi</Label>
                <select
                  id="paymentType"
                  name="paymentType"
                  value={formData.paymentType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Nakit</option>
                  <option value="bank_transfer">Havale</option>
                </select>
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
                  <option value="no_show">Gelmedi ve Bilgi Vermedi</option>
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