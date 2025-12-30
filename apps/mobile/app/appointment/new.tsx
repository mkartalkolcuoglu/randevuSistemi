import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/auth.store';
import { appointmentService } from '../../src/services/appointment.service';
import { Service, Staff, Customer, Appointment } from '../../src/types';

// Day name mapping for working hours
const DAY_NAMES: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

interface TenantSettings {
  workingHours: Record<string, { start: string; end: string; closed: boolean }>;
  appointmentTimeInterval: number;
}

interface WorkingHours {
  start: string;
  end: string;
  closed: boolean;
}

export default function NewAppointmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
  }>();
  const { selectedTenant } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Tenant settings
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Time slots and busy times
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [busyTimeSlots, setBusyTimeSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [dayClosedMessage, setDayClosedMessage] = useState<string | null>(null);

  // Customer autocomplete states
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [step, setStep] = useState(1); // 1: Service, 2: Staff, 3: DateTime, 4: Customer

  // Handle pre-selected customer from params
  useEffect(() => {
    if (params.customerId && params.customerName && params.customerPhone) {
      setCustomerName(params.customerName);
      setCustomerPhone(params.customerPhone);
      setSelectedCustomer({
        id: params.customerId,
        firstName: params.customerName.split(' ')[0] || '',
        lastName: params.customerName.split(' ').slice(1).join(' ') || '',
        phone: params.customerPhone,
        email: params.customerEmail || '',
        tenantId: selectedTenant?.id || '',
        status: 'active',
        isBlacklisted: false,
        noShowCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [params.customerId]);

  useEffect(() => {
    fetchData();
  }, []);

  // When date or staff changes, recalculate available time slots
  useEffect(() => {
    if (selectedDate && selectedStaff && tenantSettings) {
      calculateAvailableSlots();
    }
  }, [selectedDate, selectedStaff, tenantSettings]);

  const fetchData = async () => {
    if (!selectedTenant?.id) return;
    setIsLoadingData(true);
    try {
      const [servicesRes, staffRes, settingsRes] = await Promise.all([
        appointmentService.getServices(selectedTenant.id),
        appointmentService.getAvailableStaff(selectedTenant.id),
        appointmentService.getTenantSettings(),
      ]);
      setServices(servicesRes.data || []);
      setStaffList(staffRes.data || []);

      console.log('🔧 Settings Response:', JSON.stringify(settingsRes, null, 2));

      if (settingsRes.success && settingsRes.data) {
        console.log('📅 Working Hours from API:', JSON.stringify(settingsRes.data.workingHours, null, 2));
        console.log('⏰ Appointment Interval:', settingsRes.data.appointmentTimeInterval);

        setTenantSettings({
          workingHours: settingsRes.data.workingHours,
          appointmentTimeInterval: settingsRes.data.appointmentTimeInterval,
        });
      } else {
        console.log('⚠️ Using default settings - API returned:', settingsRes);
        // Default settings
        setTenantSettings({
          workingHours: {
            monday: { start: '09:00', end: '18:00', closed: false },
            tuesday: { start: '09:00', end: '18:00', closed: false },
            wednesday: { start: '09:00', end: '18:00', closed: false },
            thursday: { start: '09:00', end: '18:00', closed: false },
            friday: { start: '09:00', end: '18:00', closed: false },
            saturday: { start: '09:00', end: '17:00', closed: false },
            sunday: { start: '10:00', end: '16:00', closed: true },
          },
          appointmentTimeInterval: 30,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Calculate available time slots based on working hours and existing appointments
  const calculateAvailableSlots = async () => {
    if (!selectedDate || !selectedStaff || !tenantSettings) return;

    setIsLoadingSlots(true);
    setDayClosedMessage(null);
    setSelectedTime(''); // Reset selected time when date/staff changes

    try {
      const dayOfWeek = selectedDate.getDay();
      const dayName = DAY_NAMES[dayOfWeek];

      // Get working hours for this day
      // Priority: Staff working hours > Tenant working hours
      let workingHours: WorkingHours | null = null;

      // Check if staff has custom working hours
      const staffMember = staffList.find((s) => s.id === selectedStaff.id);
      if (staffMember?.workingHours && staffMember.workingHours[dayName]) {
        workingHours = staffMember.workingHours[dayName];
      } else if (tenantSettings.workingHours[dayName]) {
        workingHours = tenantSettings.workingHours[dayName];
      }

      // Check if the day is closed
      if (!workingHours || workingHours.closed) {
        setAvailableTimeSlots([]);
        setBusyTimeSlots([]);
        setDayClosedMessage(
          staffMember?.workingHours?.[dayName]?.closed
            ? `${selectedStaff.firstName} bu gün çalışmıyor`
            : 'İşletme bu gün kapalı'
        );
        setIsLoadingSlots(false);
        return;
      }

      // Generate time slots based on working hours and interval
      const slots = generateTimeSlots(
        workingHours.start,
        workingHours.end,
        tenantSettings.appointmentTimeInterval
      );

      // Get existing appointments for this staff and date
      const dateStr = selectedDate.toISOString().split('T')[0];
      const appointmentsRes = await appointmentService.getStaffAppointmentsForDate(
        selectedStaff.id,
        dateStr
      );

      // Filter out busy slots (existing appointments)
      const busySlots: string[] = [];
      if (appointmentsRes.success && appointmentsRes.data) {
        appointmentsRes.data.forEach((apt: Appointment) => {
          if (apt.status !== 'cancelled') {
            busySlots.push(apt.time.substring(0, 5)); // HH:MM format
          }
        });
      }
      setBusyTimeSlots(busySlots);

      // Filter past times if the selected date is today
      const today = new Date();
      const isToday = selectedDate.toDateString() === today.toDateString();

      let filteredSlots = slots;
      if (isToday) {
        // Get current time in Turkey timezone (UTC+3)
        const turkeyOffset = 3 * 60; // minutes
        const localOffset = today.getTimezoneOffset();
        const turkeyTime = new Date(today.getTime() + (turkeyOffset + localOffset) * 60000);
        const currentHour = turkeyTime.getHours();
        const currentMinute = turkeyTime.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        filteredSlots = slots.filter((slot) => {
          const [hour, minute] = slot.split(':').map(Number);
          const slotTimeInMinutes = hour * 60 + minute;
          return slotTimeInMinutes > currentTimeInMinutes;
        });
      }

      setAvailableTimeSlots(filteredSlots);
    } catch (error) {
      console.error('Error calculating available slots:', error);
      setAvailableTimeSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Generate time slots between start and end with given interval
  const generateTimeSlots = (start: string, end: string, intervalMinutes: number): string[] => {
    const slots: string[] = [];
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    for (let time = startTimeInMinutes; time < endTimeInMinutes; time += intervalMinutes) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }

    return slots;
  };

  // Generate dates for the next 14 days (excluding past dates)
  const generateDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Check if a date is closed
  const isDateClosed = (date: Date): boolean => {
    if (!tenantSettings) return false;
    const dayName = DAY_NAMES[date.getDay()];
    const workingHours = tenantSettings.workingHours[dayName];
    return !workingHours || workingHours.closed;
  };

  // Customer search with debounce
  const searchCustomers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await appointmentService.searchCustomers(query);
      if (response.success && response.data) {
        setCustomerSuggestions(response.data);
        setShowSuggestions(response.data.length > 0);
      }
    } catch (error) {
      console.error('Search customers error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleCustomerNameChange = (text: string) => {
    setCustomerName(text);
    setSelectedCustomer(null);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      searchCustomers(text);
    }, 300);
    setSearchTimeout(timeout);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(`${customer.firstName} ${customer.lastName}`);
    setCustomerPhone(customer.phone);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(''); // Reset time when date changes
  };

  const handleCreateAppointment = async () => {
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime || !customerName || !customerPhone) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    // Validate phone number
    const phoneDigits = customerPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      Alert.alert('Hata', 'Geçerli bir telefon numarası girin (10-11 hane)');
      return;
    }

    setIsLoading(true);
    try {
      const response = await appointmentService.createAppointmentForCustomer({
        customerId: selectedCustomer?.id,
        serviceId: selectedService.id,
        staffId: selectedStaff.id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        customerName,
        customerPhone,
        notes,
      });

      if (response.success) {
        Alert.alert('Başarılı', 'Randevu oluşturuldu', [
          { text: 'Tamam', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Hata', response.error || 'Randevu oluşturulamadı');
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((s) => (
        <View key={s} style={styles.stepRow}>
          <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
            {step > s ? (
              <Ionicons name="checkmark" size={14} color="#fff" />
            ) : (
              <Text style={[styles.stepNumber, step >= s && styles.stepNumberActive]}>{s}</Text>
            )}
          </View>
          {s < 4 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  if (isLoadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1E3A8A', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Randevu</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {renderStepIndicator()}

      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Service Selection */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Hizmet Seçin</Text>
            <Text style={styles.stepSubtitle}>Randevu için bir hizmet seçin</Text>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.optionCard,
                  selectedService?.id === service.id && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedService(service)}
              >
                <View style={[styles.serviceIcon, selectedService?.id === service.id && styles.serviceIconSelected]}>
                  <Ionicons name="cut" size={20} color={selectedService?.id === service.id ? '#fff' : '#3B82F6'} />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>{service.name}</Text>
                  <Text style={styles.optionSubtitle}>
                    {service.duration} dk
                  </Text>
                </View>
                <Text style={[styles.priceTag, selectedService?.id === service.id && styles.priceTagSelected]}>
                  {service.price} ₺
                </Text>
                {selectedService?.id === service.id && (
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 2: Staff Selection */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Personel Seçin</Text>
            <Text style={styles.stepSubtitle}>Randevu için bir personel seçin</Text>
            {staffList.map((staff) => (
              <TouchableOpacity
                key={staff.id}
                style={[
                  styles.optionCard,
                  selectedStaff?.id === staff.id && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedStaff(staff)}
              >
                <View style={[styles.staffAvatar, selectedStaff?.id === staff.id && styles.staffAvatarSelected]}>
                  <Text style={[styles.staffInitial, selectedStaff?.id === staff.id && styles.staffInitialSelected]}>
                    {staff.firstName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>
                    {staff.firstName} {staff.lastName}
                  </Text>
                  {staff.position && (
                    <Text style={styles.optionSubtitle}>{staff.position}</Text>
                  )}
                </View>
                {selectedStaff?.id === staff.id && (
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 3: Date & Time */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Tarih ve Saat</Text>
            <Text style={styles.stepSubtitle}>Uygun bir tarih ve saat seçin</Text>

            <Text style={styles.label}>Tarih</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {generateDates().map((date) => {
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                const isClosed = isDateClosed(date);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    style={[
                      styles.dateCard,
                      isSelected && styles.dateCardSelected,
                      isClosed && styles.dateCardClosed,
                    ]}
                    onPress={() => !isClosed && handleDateSelect(date)}
                    disabled={isClosed}
                  >
                    <Text style={[
                      styles.dateDay,
                      isSelected && styles.dateDaySelected,
                      isClosed && styles.dateDayClosed,
                    ]}>
                      {date.toLocaleDateString('tr-TR', { weekday: 'short' })}
                    </Text>
                    <Text style={[
                      styles.dateNum,
                      isSelected && styles.dateNumSelected,
                      isClosed && styles.dateNumClosed,
                    ]}>
                      {date.getDate()}
                    </Text>
                    {isToday && !isSelected && (
                      <View style={styles.todayDot} />
                    )}
                    {isClosed && (
                      <Text style={styles.closedText}>Kapalı</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>Saat</Text>
            {isLoadingSlots ? (
              <View style={styles.slotsLoading}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.slotsLoadingText}>Müsait saatler yükleniyor...</Text>
              </View>
            ) : dayClosedMessage ? (
              <View style={styles.closedDayMessage}>
                <Ionicons name="calendar-outline" size={24} color="#DC2626" />
                <Text style={styles.closedDayText}>{dayClosedMessage}</Text>
              </View>
            ) : !selectedDate ? (
              <View style={styles.selectDateMessage}>
                <Ionicons name="calendar-outline" size={24} color="#6B7280" />
                <Text style={styles.selectDateText}>Önce bir tarih seçin</Text>
              </View>
            ) : availableTimeSlots.length === 0 ? (
              <View style={styles.noSlotsMessage}>
                <Ionicons name="time-outline" size={24} color="#F59E0B" />
                <Text style={styles.noSlotsText}>Bu tarih için müsait saat bulunmuyor</Text>
              </View>
            ) : (
              <View style={styles.timeGrid}>
                {availableTimeSlots.map((time) => {
                  const isSelected = time === selectedTime;
                  const isBusy = busyTimeSlots.includes(time);

                  return (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeSlot,
                        isSelected && styles.timeSlotSelected,
                        isBusy && styles.timeSlotBusy,
                      ]}
                      onPress={() => !isBusy && setSelectedTime(time)}
                      disabled={isBusy}
                    >
                      <Text style={[
                        styles.timeText,
                        isSelected && styles.timeTextSelected,
                        isBusy && styles.timeTextBusy,
                      ]}>
                        {time}
                      </Text>
                      {isBusy && (
                        <Text style={styles.busyLabel}>Dolu</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Step 4: Customer Info */}
        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>Müşteri Bilgileri</Text>
            <Text style={styles.stepSubtitle}>Müşteri bilgilerini girin</Text>

            <Text style={styles.label}>Ad Soyad *</Text>
            <View style={styles.autocompleteContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Müşteri adı yazın..."
                  value={customerName}
                  onChangeText={handleCustomerNameChange}
                  onFocus={() => customerSuggestions.length > 0 && setShowSuggestions(true)}
                />
                {isSearching && (
                  <ActivityIndicator
                    style={styles.searchIndicator}
                    size="small"
                    color="#3B82F6"
                  />
                )}
                {selectedCustomer && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#10B981"
                    style={styles.selectedIcon}
                  />
                )}
              </View>

              {showSuggestions && (
                <View style={styles.suggestionsContainer}>
                  {customerSuggestions.map((customer) => (
                    <TouchableOpacity
                      key={customer.id}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectCustomer(customer)}
                    >
                      <View style={styles.customerAvatar}>
                        <Text style={styles.customerInitial}>
                          {customer.firstName.charAt(0)}
                        </Text>
                      </View>
                      <View style={styles.customerInfo}>
                        <Text style={styles.customerName}>
                          {customer.firstName} {customer.lastName}
                        </Text>
                        <Text style={styles.customerPhone}>{customer.phone}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <Text style={styles.label}>Telefon *</Text>
            <TextInput
              style={[styles.input, selectedCustomer && styles.inputDisabled]}
              placeholder="5XX XXX XXXX"
              keyboardType="phone-pad"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              editable={!selectedCustomer}
            />

            <Text style={styles.label}>Notlar</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Opsiyonel notlar"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />

            {/* Summary */}
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Randevu Özeti</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Hizmet:</Text>
                <Text style={styles.summaryValue}>{selectedService?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Personel:</Text>
                <Text style={styles.summaryValue}>
                  {selectedStaff?.firstName} {selectedStaff?.lastName}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tarih:</Text>
                <Text style={styles.summaryValue}>
                  {selectedDate?.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Saat:</Text>
                <Text style={styles.summaryValue}>{selectedTime}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Ücret:</Text>
                <Text style={styles.summaryValueBold}>{selectedService?.price} ₺</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </KeyboardAwareScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        {step > 1 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
            <Ionicons name="arrow-back" size={20} color="#4B5563" />
            <Text style={styles.backBtnText}>Geri</Text>
          </TouchableOpacity>
        )}
        {step < 4 ? (
          <TouchableOpacity
            style={[
              styles.nextBtn,
              step === 1 && !selectedService && styles.btnDisabled,
              step === 2 && !selectedStaff && styles.btnDisabled,
              step === 3 && !selectedTime && styles.btnDisabled,
            ]}
            onPress={() => setStep(step + 1)}
            disabled={
              (step === 1 && !selectedService) ||
              (step === 2 && !selectedStaff) ||
              (step === 3 && !selectedTime)
            }
          >
            <Text style={styles.nextBtnText}>Devam</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, styles.createBtn, isLoading && styles.btnDisabled]}
            onPress={handleCreateAppointment}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.nextBtnText}>Randevu Oluştur</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#3B82F6',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLine: {
    width: 40,
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  stepLineActive: {
    backgroundColor: '#3B82F6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    flexGrow: 1,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  serviceIconSelected: {
    backgroundColor: '#3B82F6',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  priceTag: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginRight: 12,
  },
  priceTagSelected: {
    color: '#3B82F6',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  staffAvatarSelected: {
    backgroundColor: '#3B82F6',
  },
  staffInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4F46E5',
  },
  staffInitialSelected: {
    color: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    marginTop: 20,
  },
  dateScroll: {
    marginBottom: 8,
  },
  dateCard: {
    width: 68,
    paddingVertical: 14,
    marginRight: 10,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dateCardSelected: {
    backgroundColor: '#3B82F6',
  },
  dateCardClosed: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
  },
  dateDay: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  dateDaySelected: {
    color: '#BFDBFE',
  },
  dateDayClosed: {
    color: '#9CA3AF',
  },
  dateNum: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  dateNumSelected: {
    color: '#fff',
  },
  dateNumClosed: {
    color: '#9CA3AF',
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginTop: 6,
  },
  closedText: {
    fontSize: 9,
    color: '#DC2626',
    marginTop: 4,
  },
  slotsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  slotsLoadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  selectDateMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  selectDateText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  closedDayMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
  },
  closedDayText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  noSlotsMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
  },
  noSlotsText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#D97706',
    fontWeight: '500',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeSlot: {
    width: '23%',
    marginRight: '2%',
    marginBottom: 10,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  timeSlotSelected: {
    backgroundColor: '#3B82F6',
  },
  timeSlotBusy: {
    backgroundColor: '#FEE2E2',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  timeTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  timeTextBusy: {
    color: '#DC2626',
    textDecorationLine: 'line-through',
  },
  busyLabel: {
    fontSize: 9,
    color: '#DC2626',
    marginTop: 2,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  autocompleteContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  inputWrapper: {
    position: 'relative',
  },
  searchIndicator: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  selectedIcon: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1001,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  customerPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  summaryValueBold: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  bottomButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  backBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 8,
  },
  nextBtn: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
  },
  createBtn: {
    backgroundColor: '#059669',
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginHorizontal: 8,
  },
  btnDisabled: {
    backgroundColor: '#D1D5DB',
  },
});
