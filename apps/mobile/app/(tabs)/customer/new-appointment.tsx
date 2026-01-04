import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  cardPaymentEnabled?: boolean;
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

const STEPS: { key: Step; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'tenant', label: 'İşletme', icon: 'storefront' },
  { key: 'service', label: 'Hizmet', icon: 'cut' },
  { key: 'staff', label: 'Personel', icon: 'person' },
  { key: 'date', label: 'Tarih', icon: 'calendar' },
  { key: 'time', label: 'Saat', icon: 'time' },
  { key: 'confirm', label: 'Onay', icon: 'checkmark-circle' },
];

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

  // Payment options
  const [paymentOption, setPaymentOption] = useState<'package' | 'pay' | 'later' | null>(null);
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  const resetAllStates = useCallback(() => {
    setStep('tenant');
    setIsLoading(false);
    setIsSubmitting(false);
    setIsSearching(false);
    setSearchQuery('');
    setSearchResults([]);
    setTenantSettings(null);
    setCustomerPackages(null);
    setServices([]);
    setStaff([]);
    setTimeSlots([]);
    setSelectedTenantState(null);
    setSelectedService(null);
    setSelectedStaff(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setPaymentOption(null);
    setAgreementAccepted(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetAllStates();
    }, [resetAllStates])
  );

  const getAvailableDates = () => {
    const dates: { date: Date; isOpen: boolean; dayName: string }[] = [];
    const today = new Date();
    const dayNames: { [key: number]: string } = {
      0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
      4: 'thursday', 5: 'friday', 6: 'saturday',
    };

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = dayNames[date.getDay()];
      let isOpen = true;

      if (tenantSettings?.workingHours) {
        const dayHours = tenantSettings.workingHours[dayName];
        isOpen = dayHours ? !dayHours.closed : true;
      }

      dates.push({ date, isOpen, dayName });
    }
    return dates;
  };

  const availableDates = getAvailableDates();

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
      setSearchResults(response.data.data || []);
    } catch (error) {
      console.error('Error searching tenants:', error);
      Alert.alert('Hata', 'İşletme aranırken bir hata oluştu');
    } finally {
      setIsSearching(false);
    }
  };

  const fetchTenantSettings = async () => {
    if (!selectedTenant) return;
    try {
      const response = await api.get(`/api/mobile/tenants/${selectedTenant.id}/settings`);
      if (response.data.success) {
        setTenantSettings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tenant settings:', error);
    }
  };

  const fetchCustomerPackages = async () => {
    if (!selectedTenant) return;
    if (user?.isNewCustomer) {
      setCustomerPackages({ hasPackages: false, packages: [], servicePackageMap: {} });
      return;
    }
    try {
      const response = await api.get('/api/mobile/customer/packages', {
        headers: { 'X-Tenant-ID': selectedTenant.id }
      });
      if (response.data.success) {
        setCustomerPackages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching customer packages:', error);
      setCustomerPackages({ hasPackages: false, packages: [], servicePackageMap: {} });
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
    const currentIndex = STEPS.findIndex((s) => s.key === step);
    if (currentIndex < STEPS.length - 1) {
      setStep(STEPS[currentIndex + 1].key);
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.findIndex((s) => s.key === step);
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1].key);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!selectedTenant || !selectedService || !selectedStaff || !selectedDate || !selectedTime) return;

    if (!agreementAccepted) {
      Alert.alert('Hata', 'Devam etmek için sözleşme koşullarını kabul etmelisiniz.');
      return;
    }

    if (!paymentOption) {
      Alert.alert('Hata', 'Lütfen ödeme seçeneğini belirleyin.');
      return;
    }

    const packageInfo = customerPackages?.servicePackageMap?.[selectedService.id];

    if (paymentOption === 'package' && !packageInfo) {
      Alert.alert('Hata', 'Bu hizmet için paket hakkınız bulunmuyor.');
      return;
    }

    if (paymentOption === 'pay') {
      const appointmentData: any = {
        tenantId: selectedTenant.id,
        serviceId: selectedService.id,
        staffId: selectedStaff.id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
      };

      if (user?.isNewCustomer) {
        appointmentData.customerFirstName = user.firstName || 'Müşteri';
        appointmentData.customerLastName = user.lastName || '';
      }

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

    setIsSubmitting(true);
    try {
      const appointmentData: any = {
        tenantId: selectedTenant.id,
        serviceId: selectedService.id,
        staffId: selectedStaff.id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
      };

      if (user?.isNewCustomer) {
        appointmentData.customerFirstName = user.firstName || 'Müşteri';
        appointmentData.customerLastName = user.lastName || '';
      }

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

  const canProceed = () => {
    switch (step) {
      case 'tenant': return selectedTenant !== null;
      case 'service': return selectedService !== null;
      case 'staff': return selectedStaff !== null;
      case 'date': return selectedDate !== null;
      case 'time': return selectedTime !== null;
      case 'confirm': return agreementAccepted && paymentOption !== null;
      default: return false;
    }
  };

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      <View style={styles.stepIndicator}>
        {STEPS.map((s, index) => {
          const isActive = currentStepIndex >= index;
          const isCurrent = s.key === step;
          return (
            <View key={s.key} style={styles.stepItem}>
              <View style={[
                styles.stepDot,
                isActive && styles.stepDotActive,
                isCurrent && styles.stepDotCurrent,
              ]}>
                {isActive && !isCurrent ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : (
                  <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              {index < STEPS.length - 1 && (
                <View style={[styles.stepLine, isActive && styles.stepLineActive]} />
              )}
            </View>
          );
        })}
      </View>
      <Text style={styles.stepLabel}>{STEPS[currentStepIndex]?.label}</Text>
    </View>
  );

  const renderTenantStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconContainer}>
          <Ionicons name="storefront" size={24} color="#059669" />
        </View>
        <View>
          <Text style={styles.stepTitle}>İşletme Seçin</Text>
          <Text style={styles.stepSubtitle}>Randevu almak istediğiniz işletmeyi arayın</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
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
          <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {selectedTenant && (
        <View style={styles.selectedCard}>
          <View style={styles.selectedCardIcon}>
            <Ionicons name="business" size={24} color="#059669" />
          </View>
          <View style={styles.selectedCardInfo}>
            <Text style={styles.selectedCardName}>{selectedTenant.businessName}</Text>
            {selectedTenant.address && (
              <Text style={styles.selectedCardDesc} numberOfLines={1}>{selectedTenant.address}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.selectedCardRemove}
            onPress={() => { setSelectedTenantState(null); setSearchQuery(''); }}
          >
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {!selectedTenant && (
        <>
          {isSearching ? (
            <ActivityIndicator size="large" color="#059669" style={styles.loader} />
          ) : searchQuery.length < 2 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="search-outline" size={40} color="#059669" />
              </View>
              <Text style={styles.emptyText}>İşletme aramak için en az 2 karakter girin</Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="business-outline" size={40} color="#059669" />
              </View>
              <Text style={styles.emptyText}>İşletme bulunamadı</Text>
            </View>
          ) : (
            searchResults.map((tenant) => (
              <TouchableOpacity
                key={tenant.id}
                style={styles.optionCard}
                onPress={() => {
                  setSelectedTenantState(tenant);
                  setTenantSettings(null);
                  setSelectedService(null);
                  setSelectedStaff(null);
                  setSelectedDate(null);
                  setSelectedTime(null);
                  setServices([]);
                  setStaff([]);
                  setTimeSlots([]);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="business" size={22} color="#059669" />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionName}>{tenant.businessName}</Text>
                  {tenant.address && (
                    <Text style={styles.optionDesc} numberOfLines={1}>{tenant.address}</Text>
                  )}
                  {tenant.phone && (
                    <View style={styles.optionMeta}>
                      <Ionicons name="call-outline" size={12} color="#6B7280" />
                      <Text style={styles.optionMetaText}>{tenant.phone}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            ))
          )}
        </>
      )}
    </View>
  );

  const renderServiceStep = () => {
    const getPackageForService = (serviceId: string) => customerPackages?.servicePackageMap?.[serviceId] || null;

    return (
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <View style={styles.stepIconContainer}>
            <Ionicons name="cut" size={24} color="#059669" />
          </View>
          <View>
            <Text style={styles.stepTitle}>Hizmet Seçin</Text>
            <Text style={styles.stepSubtitle}>{selectedTenant?.businessName}</Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#059669" style={styles.loader} />
        ) : (
          services.map((service) => {
            const packageInfo = getPackageForService(service.id);
            const isSelected = selectedService?.id === service.id;
            return (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceCard,
                  isSelected && styles.serviceCardSelected,
                  packageInfo && styles.serviceCardWithPackage,
                ]}
                onPress={() => { setSelectedService(service); setPaymentOption(null); }}
                activeOpacity={0.7}
              >
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  {packageInfo && (
                    <View style={styles.packageBadge}>
                      <Ionicons name="gift" size={12} color="#fff" />
                      <Text style={styles.packageBadgeText}>Paket</Text>
                    </View>
                  )}
                </View>
                {service.description && (
                  <Text style={styles.serviceDesc}>{service.description}</Text>
                )}
                {packageInfo && (
                  <View style={styles.packageInfoRow}>
                    <Ionicons name="checkmark-circle" size={14} color="#059669" />
                    <Text style={styles.packageInfoText}>
                      {packageInfo.remainingQuantity} seans hakkınız var
                    </Text>
                  </View>
                )}
                <View style={styles.serviceFooter}>
                  <View style={styles.serviceDuration}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.serviceDurationText}>{service.duration} dk</Text>
                  </View>
                  <Text style={[styles.servicePrice, packageInfo && styles.servicePricePackage]}>
                    {packageInfo ? 'Paketten' : `${service.price} ₺`}
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={24} color="#059669" />
                  </View>
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
      <View style={styles.stepHeader}>
        <View style={styles.stepIconContainer}>
          <Ionicons name="person" size={24} color="#059669" />
        </View>
        <View>
          <Text style={styles.stepTitle}>Personel Seçin</Text>
          <Text style={styles.stepSubtitle}>{selectedService?.name}</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#059669" style={styles.loader} />
      ) : (
        staff.map((s) => {
          const isSelected = selectedStaff?.id === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              style={[styles.staffCard, isSelected && styles.staffCardSelected]}
              onPress={() => setSelectedStaff(s)}
              activeOpacity={0.7}
            >
              <View style={styles.staffAvatar}>
                <Text style={styles.staffInitial}>
                  {s.firstName.charAt(0)}{s.lastName.charAt(0)}
                </Text>
              </View>
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>{s.firstName} {s.lastName}</Text>
                {s.position && <Text style={styles.staffPosition}>{s.position}</Text>}
              </View>
              {isSelected && (
                <View style={styles.selectedCheck}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );

  const renderDateStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconContainer}>
          <Ionicons name="calendar" size={24} color="#059669" />
        </View>
        <View>
          <Text style={styles.stepTitle}>Tarih Seçin</Text>
          <Text style={styles.stepSubtitle}>
            {selectedStaff?.firstName} {selectedStaff?.lastName}
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
        <View style={styles.dateGrid}>
          {availableDates.map((item) => {
            const isSelected = selectedDate?.toDateString() === item.date.toDateString();
            const isClosed = !item.isOpen;
            const isToday = item.date.toDateString() === new Date().toDateString();
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
                activeOpacity={0.7}
              >
                {isToday && !isClosed && (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayText}>Bugün</Text>
                  </View>
                )}
                <Text style={[styles.dateDay, isSelected && styles.dateDaySelected, isClosed && styles.dateDayClosed]}>
                  {item.date.toLocaleDateString('tr-TR', { weekday: 'short' })}
                </Text>
                <Text style={[styles.dateNum, isSelected && styles.dateNumSelected, isClosed && styles.dateNumClosed]}>
                  {item.date.getDate()}
                </Text>
                <Text style={[styles.dateMonth, isSelected && styles.dateMonthSelected, isClosed && styles.dateMonthClosed]}>
                  {item.date.toLocaleDateString('tr-TR', { month: 'short' })}
                </Text>
                {isClosed && <Text style={styles.closedLabel}>Kapalı</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  const renderTimeStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconContainer}>
          <Ionicons name="time" size={24} color="#059669" />
        </View>
        <View>
          <Text style={styles.stepTitle}>Saat Seçin</Text>
          <Text style={styles.stepSubtitle}>
            {selectedDate?.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#059669" style={styles.loader} />
      ) : timeSlots.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="time-outline" size={40} color="#059669" />
          </View>
          <Text style={styles.emptyText}>Bu tarihte müsait saat yok</Text>
        </View>
      ) : (
        <View style={styles.timeGrid}>
          {timeSlots.map((slot) => {
            const isSelected = selectedTime === slot.time;
            return (
              <TouchableOpacity
                key={slot.time}
                style={[
                  styles.timeSlot,
                  !slot.available && styles.timeSlotDisabled,
                  isSelected && styles.timeSlotSelected,
                ]}
                onPress={() => slot.available && setSelectedTime(slot.time)}
                disabled={!slot.available}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.timeText,
                  !slot.available && styles.timeTextDisabled,
                  isSelected && styles.timeTextSelected,
                ]}>
                  {slot.time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderConfirmStep = () => {
    const packageInfo = selectedService ? customerPackages?.servicePackageMap?.[selectedService.id] : null;
    const showPackageOption = packageInfo && packageInfo.remainingQuantity > 0;

    return (
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <View style={styles.stepIconContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#059669" />
          </View>
          <View>
            <Text style={styles.stepTitle}>Randevu Özeti</Text>
            <Text style={styles.stepSubtitle}>Bilgileri kontrol edin</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="storefront" size={18} color="#059669" />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>İşletme</Text>
              <Text style={styles.summaryValue}>{selectedTenant?.businessName}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="cut" size={18} color="#059669" />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Hizmet</Text>
              <Text style={styles.summaryValue}>{selectedService?.name}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="person" size={18} color="#059669" />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Personel</Text>
              <Text style={styles.summaryValue}>{selectedStaff?.firstName} {selectedStaff?.lastName}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="calendar" size={18} color="#059669" />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Tarih & Saat</Text>
              <Text style={styles.summaryValue}>
                {selectedDate?.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} - {selectedTime}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.paymentCard}>
          <View style={styles.paymentHeader}>
            <Ionicons name="wallet" size={22} color="#059669" />
            <Text style={styles.paymentTitle}>Ödeme Seçenekleri</Text>
          </View>

          <View style={styles.paymentAmount}>
            <Text style={styles.paymentLabel}>Hizmet Ücreti</Text>
            <Text style={styles.paymentPrice}>{selectedService?.price} ₺</Text>
          </View>

          <View style={styles.paymentOptions}>
            {showPackageOption && (
              <TouchableOpacity
                style={[styles.paymentOption, paymentOption === 'package' && styles.paymentOptionSelected]}
                onPress={() => setPaymentOption('package')}
                activeOpacity={0.7}
              >
                <View style={[styles.paymentOptionRadio, paymentOption === 'package' && styles.paymentOptionRadioSelected]}>
                  {paymentOption === 'package' && <View style={styles.paymentOptionRadioDot} />}
                </View>
                <View style={styles.paymentOptionContent}>
                  <Text style={[styles.paymentOptionTitle, paymentOption === 'package' && styles.paymentOptionTitleSelected]}>
                    Paketten Düş
                  </Text>
                  <Text style={styles.paymentOptionDesc}>{packageInfo?.remainingQuantity} seans hakkınız var</Text>
                </View>
                <View style={styles.packageBadgeSmall}>
                  <Ionicons name="gift" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
            )}

            {tenantSettings?.cardPaymentEnabled !== false && (
              <TouchableOpacity
                style={[styles.paymentOption, paymentOption === 'pay' && styles.paymentOptionSelectedBlue]}
                onPress={() => setPaymentOption('pay')}
                activeOpacity={0.7}
              >
                <View style={[styles.paymentOptionRadio, paymentOption === 'pay' && styles.paymentOptionRadioSelectedBlue]}>
                  {paymentOption === 'pay' && <View style={styles.paymentOptionRadioDotBlue} />}
                </View>
                <View style={styles.paymentOptionContent}>
                  <Text style={[styles.paymentOptionTitle, paymentOption === 'pay' && styles.paymentOptionTitleBlue]}>
                    Şimdi Öde
                  </Text>
                  <Text style={styles.paymentOptionDesc}>Kredi kartı ile güvenli ödeme</Text>
                </View>
                <Ionicons name="card" size={20} color={paymentOption === 'pay' ? '#3B82F6' : '#9CA3AF'} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.paymentOption, paymentOption === 'later' && styles.paymentOptionSelectedGray]}
              onPress={() => setPaymentOption('later')}
              activeOpacity={0.7}
            >
              <View style={[styles.paymentOptionRadio, paymentOption === 'later' && styles.paymentOptionRadioSelectedGray]}>
                {paymentOption === 'later' && <View style={styles.paymentOptionRadioDotGray} />}
              </View>
              <View style={styles.paymentOptionContent}>
                <Text style={[styles.paymentOptionTitle, paymentOption === 'later' && styles.paymentOptionTitleGray]}>
                  İşletmede Öde
                </Text>
                <Text style={styles.paymentOptionDesc}>Randevu sonrası ödeme</Text>
              </View>
              <Ionicons name="storefront" size={20} color={paymentOption === 'later' ? '#6B7280' : '#9CA3AF'} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.agreementRow} onPress={() => setAgreementAccepted(!agreementAccepted)}>
          <View style={[styles.checkbox, agreementAccepted && styles.checkboxChecked]}>
            {agreementAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.agreementText}>
            Randevu koşullarını ve iptal politikasını okudum, kabul ediyorum.
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#059669', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#059669" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Randevu</Text>
        <View style={{ width: 44 }} />
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
        {step === 'tenant' && renderTenantStep()}
        {step === 'service' && renderServiceStep()}
        {step === 'staff' && renderStaffStep()}
        {step === 'date' && renderDateStep()}
        {step === 'time' && renderTimeStep()}
        {step === 'confirm' && renderConfirmStep()}
      </KeyboardAwareScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, (!canProceed() || isSubmitting) && styles.nextButtonDisabled]}
          onPress={step === 'confirm' ? handleSubmit : handleNext}
          disabled={!canProceed() || isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {step === 'confirm' ? 'Randevuyu Onayla' : 'Devam Et'}
              </Text>
              {step !== 'confirm' && (
                <View style={styles.nextButtonIcon}>
                  <Ionicons name="arrow-forward" size={18} color="#059669" />
                </View>
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  stepIndicatorContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#059669',
  },
  stepDotCurrent: {
    backgroundColor: '#059669',
    borderWidth: 3,
    borderColor: '#A7F3D0',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLine: {
    width: 24,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  stepLineActive: {
    backgroundColor: '#059669',
  },
  stepLabel: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  stepContent: {
    padding: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#059669',
    marginBottom: 16,
  },
  selectedCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  selectedCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedCardDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  selectedCardRemove: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
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
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  optionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  optionMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  serviceCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  serviceCardSelected: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  serviceCardWithPackage: {
    borderColor: '#10B981',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  serviceDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  packageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  packageBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  packageInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    gap: 6,
  },
  packageInfoText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDurationText: {
    fontSize: 13,
    color: '#6B7280',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  servicePricePackage: {
    color: '#10B981',
    fontSize: 14,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  staffCardSelected: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  staffAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  staffInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  staffPosition: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  selectedCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  dateGrid: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  dateCard: {
    width: 72,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  dateCardSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  dateCardClosed: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  todayBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  todayText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  dateDay: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  dateDaySelected: {
    color: '#A7F3D0',
  },
  dateDayClosed: {
    color: '#9CA3AF',
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
  dateNumClosed: {
    color: '#9CA3AF',
  },
  dateMonth: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  dateMonthSelected: {
    color: '#A7F3D0',
  },
  dateMonthClosed: {
    color: '#9CA3AF',
  },
  closedLabel: {
    fontSize: 9,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 4,
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
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  timeSlotDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#F3F4F6',
  },
  timeSlotSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  timeTextDisabled: {
    color: '#D1D5DB',
  },
  timeTextSelected: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 14,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  paymentTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  paymentAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  paymentOptions: {
    gap: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  paymentOptionSelected: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  paymentOptionSelectedBlue: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  paymentOptionSelectedGray: {
    borderColor: '#6B7280',
    backgroundColor: '#F3F4F6',
  },
  paymentOptionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentOptionRadioSelected: {
    borderColor: '#059669',
  },
  paymentOptionRadioSelectedBlue: {
    borderColor: '#3B82F6',
  },
  paymentOptionRadioSelectedGray: {
    borderColor: '#6B7280',
  },
  paymentOptionRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#059669',
  },
  paymentOptionRadioDotBlue: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
  paymentOptionRadioDotGray: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6B7280',
  },
  paymentOptionContent: {
    flex: 1,
    marginLeft: 14,
  },
  paymentOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  paymentOptionTitleSelected: {
    color: '#059669',
  },
  paymentOptionTitleBlue: {
    color: '#3B82F6',
  },
  paymentOptionTitleGray: {
    color: '#374151',
  },
  paymentOptionDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  packageBadgeSmall: {
    backgroundColor: '#059669',
    padding: 6,
    borderRadius: 10,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  agreementText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  nextButtonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
