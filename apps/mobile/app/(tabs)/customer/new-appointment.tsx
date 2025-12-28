import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/auth.store';
import { appointmentService } from '../../../src/services/appointment.service';
import api from '../../../src/services/api';
import { Service, Staff, TimeSlot } from '../../../src/types';

type Step = 'tenant' | 'service' | 'staff' | 'date' | 'time' | 'confirm';

interface TenantSearchResult {
  id: string;
  businessName: string;
  slug: string;
  logo?: string;
  phone?: string;
  address?: string;
}

interface WorkingHours {
  [key: string]: {
    start: string;
    end: string;
    closed: boolean;
  };
}

interface TenantSettings {
  workingHours: WorkingHours;
  appointmentTimeInterval: number;
}

interface PackageInfo {
  packageId: string;
  packageName: string;
  usageId: string;
  remainingQuantity: number;
  customerPackageId: string;
}

interface CustomerPackageData {
  hasPackages: boolean;
  packages: any[];
  servicePackageMap: Record<string, PackageInfo>;
}

export default function NewAppointmentScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>('tenant');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TenantSearchResult[]>([]);

  // Data
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null);
  const [customerPackages, setCustomerPackages] = useState<CustomerPackageData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Selections
  const [selectedTenant, setSelectedTenantState] = useState<TenantSearchResult | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Payment options: 'package' | 'pay' | 'later' | null
  const [paymentOption, setPaymentOption] = useState<'package' | 'pay' | 'later' | null>(null);
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  // Generate next 14 days with availability info
  const getAvailableDates = () => {
    const dates: { date: Date; isOpen: boolean; dayName: string }[] = [];
    const today = new Date();

    const dayNames: { [key: number]: string } = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayName = dayNames[date.getDay()];
      let isOpen = true;

      // Check if tenant is open on this day
      if (tenantSettings?.workingHours) {
        const dayHours = tenantSettings.workingHours[dayName];
        isOpen = dayHours ? !dayHours.closed : true;
      }

      dates.push({ date, isOpen, dayName });
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchTenants();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedTenant) {
      fetchTenantSettings();
      fetchCustomerPackages();
      fetchServices();
    }
  }, [selectedTenant]);

  useEffect(() => {
    if (selectedService) {
      fetchStaff();
    }
  }, [selectedService]);

  useEffect(() => {
    if (selectedService && selectedStaff && selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedService, selectedStaff, selectedDate]);

  const searchTenants = async () => {
    setIsSearching(true);
    try {
      const response = await api.get(`/api/mobile/tenants/search?search=${encodeURIComponent(searchQuery)}`);
      console.log('🔍 Search results:', response.data.data?.length);
      setSearchResults(response.data.data || []);
    } catch (error) {
      console.error('Error searching tenants:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchTenantSettings = async () => {
    if (!selectedTenant) return;

    try {
      const response = await api.get(`/api/mobile/tenants/${selectedTenant.id}/settings`);
      console.log('⚙️ Tenant settings:', response.data.data);
      if (response.data.success) {
        setTenantSettings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tenant settings:', error);
    }
  };

  const fetchCustomerPackages = async () => {
    if (!selectedTenant) return;

    try {
      const response = await api.get('/api/mobile/customer/packages', {
        headers: { 'X-Tenant-ID': selectedTenant.id }
      });
      console.log('📦 Customer packages:', response.data.data);
      if (response.data.success) {
        setCustomerPackages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching customer packages:', error);
    }
  };

  const fetchServices = async () => {
    if (!selectedTenant) return;

    setIsLoading(true);
    try {
      const response = await api.get('/api/mobile/services', {
        headers: { 'X-Tenant-ID': selectedTenant.id }
      });
      setServices(response.data.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaff = async () => {
    if (!selectedTenant || !selectedService) return;

    setIsLoading(true);
    try {
      const response = await api.get(`/api/mobile/staff?serviceId=${selectedService.id}`, {
        headers: { 'X-Tenant-ID': selectedTenant.id }
      });
      setStaff(response.data.data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    if (!selectedDate || !selectedStaff || !selectedService || !selectedTenant) return;

    setIsLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await api.get(
        `/api/mobile/availability?staffId=${selectedStaff.id}&date=${dateStr}&serviceId=${selectedService.id}`,
        { headers: { 'X-Tenant-ID': selectedTenant.id } }
      );
      setTimeSlots(response.data.data || []);
    } catch (error) {
      console.error('Error fetching time slots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    const steps: Step[] = ['tenant', 'service', 'staff', 'date', 'time', 'confirm'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: Step[] = ['tenant', 'service', 'staff', 'date', 'time', 'confirm'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!selectedTenant || !selectedService || !selectedStaff || !selectedDate || !selectedTime) return;

    // Check agreement
    if (!agreementAccepted) {
      Alert.alert('Hata', 'Devam etmek için sözleşme koşullarını kabul etmelisiniz.');
      return;
    }

    // Check payment option selected
    if (!paymentOption) {
      Alert.alert('Hata', 'Lütfen ödeme seçeneğini belirleyin.');
      return;
    }

    // Get package info for the selected service
    const packageInfo = customerPackages?.servicePackageMap?.[selectedService.id];

    // If selected package but no package available
    if (paymentOption === 'package' && !packageInfo) {
      Alert.alert('Hata', 'Bu hizmet için paket hakkınız bulunmuyor.');
      return;
    }

    // If paying now, redirect to payment screen
    if (paymentOption === 'pay') {
      const appointmentData = {
        tenantId: selectedTenant.id,
        serviceId: selectedService.id,
        staffId: selectedStaff.id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
      };

      router.push({
        pathname: '/(tabs)/customer/payment',
        params: {
          tenantId: selectedTenant.id,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          amount: selectedService.price.toString(),
          appointmentData: JSON.stringify(appointmentData),
        },
      });
      return;
    }

    // Create appointment directly (package or pay later)
    setIsSubmitting(true);
    try {
      const appointmentData: any = {
        tenantId: selectedTenant.id,
        serviceId: selectedService.id,
        staffId: selectedStaff.id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
      };

      // Add package info if using package
      if (paymentOption === 'package' && packageInfo) {
        appointmentData.usePackage = true;
        appointmentData.customerPackageId = packageInfo.customerPackageId;
        appointmentData.packageUsageId = packageInfo.usageId;
      }

      await appointmentService.createAppointment(appointmentData);

      const successMessage = paymentOption === 'package'
        ? 'Randevunuz oluşturuldu ve paket hakkınızdan düşüldü!'
        : 'Randevunuz oluşturuldu!';

      Alert.alert('Başarılı', successMessage, [
        { text: 'Tamam', onPress: () => router.replace('/(tabs)/customer') },
      ]);
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.message || 'Randevu oluşturulamadı');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const renderTenantStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>İşletme Seçin</Text>
      <Text style={styles.stepSubtitle}>Randevu almak istediğiniz işletmeyi arayın</Text>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="İşletme adı yazın..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => {
            setSearchQuery('');
            setSearchResults([]);
          }}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Selected Tenant Display */}
      {selectedTenant && (
        <View style={styles.selectedTenantCard}>
          <View style={styles.tenantAvatar}>
            <Ionicons name="business" size={24} color="#3B82F6" />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionName}>{selectedTenant.businessName}</Text>
            {selectedTenant.address && (
              <Text style={styles.optionDesc} numberOfLines={1}>{selectedTenant.address}</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => {
            setSelectedTenantState(null);
            setSearchQuery('');
          }}>
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}

      {/* Search Results */}
      {!selectedTenant && (
        <>
          {isSearching ? (
            <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
          ) : searchQuery.length < 2 ? (
            <View style={styles.noSlots}>
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text style={styles.noSlotsText}>İşletme aramak için en az 2 karakter girin</Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.noSlots}>
              <Ionicons name="business-outline" size={48} color="#D1D5DB" />
              <Text style={styles.noSlotsText}>İşletme bulunamadı</Text>
            </View>
          ) : (
            searchResults.map((tenant) => (
              <TouchableOpacity
                key={tenant.id}
                style={styles.optionCard}
                onPress={() => {
                  setSelectedTenantState(tenant);
                  // Reset other selections when tenant changes
                  setTenantSettings(null);
                  setSelectedService(null);
                  setSelectedStaff(null);
                  setSelectedDate(null);
                  setSelectedTime(null);
                  setServices([]);
                  setStaff([]);
                  setTimeSlots([]);
                }}
              >
                <View style={styles.tenantAvatar}>
                  <Ionicons name="business" size={24} color="#3B82F6" />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionName}>{tenant.businessName}</Text>
                  {tenant.address && (
                    <Text style={styles.optionDesc} numberOfLines={1}>{tenant.address}</Text>
                  )}
                  {tenant.phone && (
                    <Text style={styles.tenantPhone}>{tenant.phone}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </>
      )}
    </View>
  );

  const renderStepIndicator = () => {
    const steps: { key: Step; label: string }[] = [
      { key: 'tenant', label: 'İşletme' },
      { key: 'service', label: 'Hizmet' },
      { key: 'staff', label: 'Personel' },
      { key: 'date', label: 'Tarih' },
      { key: 'time', label: 'Saat' },
      { key: 'confirm', label: 'Onay' },
    ];

    return (
      <View style={styles.stepIndicator}>
        {steps.map((s, index) => {
          const isActive = steps.findIndex((st) => st.key === step) >= index;
          const isCurrent = s.key === step;
          return (
            <View key={s.key} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  isActive && styles.stepDotActive,
                  isCurrent && styles.stepDotCurrent,
                ]}
              >
                {isActive && !isCurrent && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
              {index < steps.length - 1 && (
                <View style={[styles.stepLine, isActive && styles.stepLineActive]} />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderServiceStep = () => {
    const getPackageForService = (serviceId: string) => {
      return customerPackages?.servicePackageMap?.[serviceId] || null;
    };

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Hizmet Seçin</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
        ) : (
          services.map((service) => {
            const packageInfo = getPackageForService(service.id);
            return (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.optionCard,
                  selectedService?.id === service.id && styles.optionCardSelected,
                  packageInfo && styles.optionCardWithPackage,
                ]}
                onPress={() => {
                  setSelectedService(service);
                  // Reset payment option when service changes
                  setPaymentOption(null);
                }}
              >
                <View style={styles.optionInfo}>
                  <View style={styles.serviceHeader}>
                    <Text style={styles.optionName}>{service.name}</Text>
                    {packageInfo && (
                      <View style={styles.packageBadge}>
                        <Ionicons name="gift" size={12} color="#fff" />
                        <Text style={styles.packageBadgeText}>Paket</Text>
                      </View>
                    )}
                  </View>
                  {service.description && (
                    <Text style={styles.optionDesc}>{service.description}</Text>
                  )}
                  {packageInfo && (
                    <View style={styles.packageInfoRow}>
                      <Ionicons name="checkmark-circle" size={14} color="#059669" />
                      <Text style={styles.packageInfoText}>
                        {packageInfo.packageName} - {packageInfo.remainingQuantity} seans hakkınız var
                      </Text>
                    </View>
                  )}
                  <View style={styles.optionMeta}>
                    <Text style={styles.optionDuration}>{service.duration} dk</Text>
                    <Text style={[styles.optionPrice, packageInfo && styles.optionPriceWithPackage]}>
                      {packageInfo ? 'Paketten kullanılabilir' : `${service.price} ₺`}
                    </Text>
                  </View>
                </View>
                {selectedService?.id === service.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>
    );
  };

  const renderStaffStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personel Seçin</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
      ) : (
        staff.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[
              styles.optionCard,
              selectedStaff?.id === s.id && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedStaff(s)}
          >
            <View style={styles.staffAvatar}>
              <Text style={styles.staffInitial}>
                {s.firstName.charAt(0)}
                {s.lastName.charAt(0)}
              </Text>
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionName}>
                {s.firstName} {s.lastName}
              </Text>
              {s.position && <Text style={styles.optionDesc}>{s.position}</Text>}
            </View>
            {selectedStaff?.id === s.id && (
              <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
            )}
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderDateStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Tarih Seçin</Text>
      {tenantSettings && (
        <Text style={styles.stepSubtitle}>
          Randevu aralığı: {tenantSettings.appointmentTimeInterval} dakika
        </Text>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.dateGrid}>
          {availableDates.map((item) => {
            const isSelected =
              selectedDate?.toDateString() === item.date.toDateString();
            const isClosed = !item.isOpen;
            return (
              <TouchableOpacity
                key={item.date.toISOString()}
                style={[
                  styles.dateCard,
                  isSelected && styles.dateCardSelected,
                  isClosed && styles.dateCardClosed,
                ]}
                onPress={() => !isClosed && setSelectedDate(item.date)}
                disabled={isClosed}
              >
                <Text style={[
                  styles.dateDay,
                  isSelected && styles.dateDaySelected,
                  isClosed && styles.dateDayClosed,
                ]}>
                  {item.date.toLocaleDateString('tr-TR', { weekday: 'short' })}
                </Text>
                <Text style={[
                  styles.dateNum,
                  isSelected && styles.dateNumSelected,
                  isClosed && styles.dateNumClosed,
                ]}>
                  {item.date.getDate()}
                </Text>
                <Text style={[
                  styles.dateMonth,
                  isSelected && styles.dateMonthSelected,
                  isClosed && styles.dateMonthClosed,
                ]}>
                  {item.date.toLocaleDateString('tr-TR', { month: 'short' })}
                </Text>
                {isClosed && (
                  <Text style={styles.closedLabel}>Kapalı</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  const renderTimeStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Saat Seçin</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
      ) : timeSlots.length === 0 ? (
        <View style={styles.noSlots}>
          <Ionicons name="time-outline" size={48} color="#D1D5DB" />
          <Text style={styles.noSlotsText}>Bu tarihte müsait saat yok</Text>
        </View>
      ) : (
        <View style={styles.timeGrid}>
          {timeSlots.map((slot) => (
            <TouchableOpacity
              key={slot.time}
              style={[
                styles.timeSlot,
                !slot.available && styles.timeSlotDisabled,
                selectedTime === slot.time && styles.timeSlotSelected,
              ]}
              onPress={() => slot.available && setSelectedTime(slot.time)}
              disabled={!slot.available}
            >
              <Text
                style={[
                  styles.timeText,
                  !slot.available && styles.timeTextDisabled,
                  selectedTime === slot.time && styles.timeTextSelected,
                ]}
              >
                {slot.time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderConfirmStep = () => {
    const packageInfo = selectedService ? customerPackages?.servicePackageMap?.[selectedService.id] : null;
    const showPackageOption = packageInfo && packageInfo.remainingQuantity > 0;

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Randevu Özeti</Text>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="business" size={20} color="#6B7280" />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>İşletme</Text>
              <Text style={styles.summaryValue}>{selectedTenant?.businessName}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="cut" size={20} color="#6B7280" />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Hizmet</Text>
              <Text style={styles.summaryValue}>{selectedService?.name}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="person" size={20} color="#6B7280" />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Personel</Text>
              <Text style={styles.summaryValue}>
                {selectedStaff?.firstName} {selectedStaff?.lastName}
              </Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="calendar" size={20} color="#6B7280" />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Tarih</Text>
              <Text style={styles.summaryValue}>
                {selectedDate?.toLocaleDateString('tr-TR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowLast]}>
            <Ionicons name="time" size={20} color="#6B7280" />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Saat</Text>
              <Text style={styles.summaryValue}>{selectedTime}</Text>
            </View>
          </View>
        </View>

        {/* Payment Options */}
        <View style={styles.paymentOptionsCard}>
          <View style={styles.paymentOptionsHeader}>
            <Ionicons name="wallet" size={24} color="#3B82F6" />
            <Text style={styles.paymentOptionsTitle}>Ödeme Seçenekleri</Text>
          </View>

          <View style={styles.paymentOptionsAmount}>
            <Text style={styles.paymentOptionsLabel}>Hizmet Ücreti</Text>
            <Text style={styles.paymentOptionsPrice}>{selectedService?.price} ₺</Text>
          </View>

          <View style={styles.packageOptionsContainer}>
            {/* Package Option - Only show if customer has package */}
            {showPackageOption && (
              <TouchableOpacity
                style={[
                  styles.packageOption,
                  paymentOption === 'package' && styles.packageOptionSelected,
                ]}
                onPress={() => setPaymentOption('package')}
              >
                <Ionicons
                  name={paymentOption === 'package' ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={paymentOption === 'package' ? "#059669" : "#9CA3AF"}
                />
                <View style={styles.packageOptionContent}>
                  <Text style={[
                    styles.packageOptionTitle,
                    paymentOption === 'package' && styles.packageOptionTitleSelected
                  ]}>Paketten Düş</Text>
                  <Text style={styles.packageOptionDesc}>
                    {packageInfo?.packageName} - {packageInfo?.remainingQuantity} seans hakkınız var
                  </Text>
                </View>
                <View style={styles.packageBadgeSmall}>
                  <Ionicons name="gift" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
            )}

            {/* Pay Now Option */}
            <TouchableOpacity
              style={[
                styles.packageOption,
                paymentOption === 'pay' && styles.packageOptionSelectedBlue,
              ]}
              onPress={() => setPaymentOption('pay')}
            >
              <Ionicons
                name={paymentOption === 'pay' ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={paymentOption === 'pay' ? "#3B82F6" : "#9CA3AF"}
              />
              <View style={styles.packageOptionContent}>
                <Text style={[
                  styles.packageOptionTitle,
                  paymentOption === 'pay' && styles.packageOptionTitleSelectedBlue
                ]}>Şimdi Öde</Text>
                <Text style={styles.packageOptionDesc}>
                  Kredi kartı ile güvenli ödeme yapın
                </Text>
              </View>
              <Ionicons name="card" size={20} color={paymentOption === 'pay' ? "#3B82F6" : "#9CA3AF"} />
            </TouchableOpacity>

            {/* Pay Later Option */}
            <TouchableOpacity
              style={[
                styles.packageOption,
                paymentOption === 'later' && styles.packageOptionSelectedGray,
              ]}
              onPress={() => setPaymentOption('later')}
            >
              <Ionicons
                name={paymentOption === 'later' ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={paymentOption === 'later' ? "#6B7280" : "#9CA3AF"}
              />
              <View style={styles.packageOptionContent}>
                <Text style={[
                  styles.packageOptionTitle,
                  paymentOption === 'later' && styles.packageOptionTitleSelectedGray
                ]}>İşletmede Öde</Text>
                <Text style={styles.packageOptionDesc}>
                  Randevu sonrası işletmede ödeme yapın
                </Text>
              </View>
              <Ionicons name="storefront" size={20} color={paymentOption === 'later' ? "#6B7280" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Agreement Section */}
        <TouchableOpacity
          style={styles.agreementRow}
          onPress={() => setAgreementAccepted(!agreementAccepted)}
        >
          <Ionicons
            name={agreementAccepted ? "checkbox" : "square-outline"}
            size={24}
            color={agreementAccepted ? "#3B82F6" : "#9CA3AF"}
          />
          <Text style={styles.agreementText}>
            Randevu koşullarını ve iptal politikasını okudum, kabul ediyorum.
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const canProceed = () => {
    switch (step) {
      case 'tenant':
        return selectedTenant !== null;
      case 'service':
        return selectedService !== null;
      case 'staff':
        return selectedStaff !== null;
      case 'date':
        return selectedDate !== null;
      case 'time':
        return selectedTime !== null;
      case 'confirm': {
        // Agreement must be accepted
        if (!agreementAccepted) return false;

        // Payment option must be selected
        if (!paymentOption) return false;

        return true;
      }
      default:
        return false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons
            name="arrow-back"
            size={24}
            color="#1F2937"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Randevu</Text>
        <View style={{ width: 24 }} />
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 'tenant' && renderTenantStep()}
        {step === 'service' && renderServiceStep()}
        {step === 'staff' && renderStaffStep()}
        {step === 'date' && renderDateStep()}
        {step === 'time' && renderTimeStep()}
        {step === 'confirm' && renderConfirmStep()}
      </ScrollView>

      <View style={styles.footer}>
        {step === 'confirm' ? (
          <TouchableOpacity
            style={[styles.nextButton, (isSubmitting || !canProceed()) && styles.nextButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || !canProceed()}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextButtonText}>Randevuyu Onayla</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={styles.nextButtonText}>Devam Et</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#3B82F6',
  },
  stepDotCurrent: {
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#BFDBFE',
  },
  stepLine: {
    width: 28,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  stepLineActive: {
    backgroundColor: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  selectedTenantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  loader: {
    marginTop: 40,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  optionDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  optionMeta: {
    flexDirection: 'row',
    marginTop: 8,
  },
  optionDuration: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 16,
  },
  optionPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  tenantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tenantPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  staffInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  dateGrid: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  dateCard: {
    width: 70,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    marginRight: 10,
  },
  dateCardSelected: {
    backgroundColor: '#3B82F6',
  },
  dateDay: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  dateDaySelected: {
    color: '#BFDBFE',
  },
  dateNum: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginVertical: 4,
  },
  dateNumSelected: {
    color: '#fff',
  },
  dateMonth: {
    fontSize: 12,
    color: '#6B7280',
  },
  dateMonthSelected: {
    color: '#BFDBFE',
  },
  dateCardClosed: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  dateDayClosed: {
    color: '#9CA3AF',
  },
  dateNumClosed: {
    color: '#9CA3AF',
  },
  dateMonthClosed: {
    color: '#9CA3AF',
  },
  closedLabel: {
    fontSize: 9,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 2,
  },
  noSlots: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSlotsText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  timeSlot: {
    width: '30%',
    margin: '1.66%',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  timeSlotDisabled: {
    backgroundColor: '#F3F4F6',
  },
  timeSlotSelected: {
    backgroundColor: '#3B82F6',
  },
  timeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  timeTextDisabled: {
    color: '#D1D5DB',
  },
  timeTextSelected: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginTop: 2,
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  // Service step - package styles
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  packageBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  packageInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  packageInfoText: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 4,
    fontWeight: '500',
  },
  optionCardWithPackage: {
    borderColor: '#059669',
    borderWidth: 1,
    backgroundColor: '#F0FDF4',
  },
  optionPriceWithPackage: {
    color: '#059669',
    fontSize: 13,
  },
  // Confirm step - package usage styles
  packageUsageCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#059669',
  },
  packageUsageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageUsageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 8,
  },
  packageUsageDesc: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  packageUsageBold: {
    fontWeight: '600',
    color: '#059669',
  },
  packageUsageQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 16,
  },
  packageOptionsContainer: {
    gap: 12,
  },
  packageOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  packageOptionSelected: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  packageOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  packageOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  packageOptionTitleSelected: {
    color: '#059669',
  },
  packageOptionTitleSelectedBlue: {
    color: '#3B82F6',
  },
  packageOptionTitleSelectedGray: {
    color: '#374151',
  },
  packageOptionSelectedBlue: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  packageOptionSelectedGray: {
    borderColor: '#6B7280',
    backgroundColor: '#F3F4F6',
  },
  packageOptionDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  packageBadgeSmall: {
    backgroundColor: '#059669',
    padding: 6,
    borderRadius: 12,
  },
  // Payment options card
  paymentOptionsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  paymentOptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentOptionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  paymentOptionsAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  paymentOptionsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentOptionsPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  // Payment card styles (keep for backwards compatibility)
  paymentCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
    marginLeft: 8,
  },
  paymentAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
  },
  paymentNote: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Agreement styles
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    paddingHorizontal: 4,
  },
  agreementText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    lineHeight: 20,
  },
});
