import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../../src/store/auth.store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://admin.netrandevu.com';

interface TenantSettings {
  tenantId: string;
  businessName: string;
  workingHours: {
    [key: string]: {
      start: string;
      end: string;
      closed: boolean;
    };
  };
  appointmentTimeInterval: number;
  cardPaymentEnabled: boolean;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category?: string;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
  avatar?: string;
}

const DAY_NAMES: { [key: string]: string } = {
  monday: 'Pazartesi',
  tuesday: 'Salı',
  wednesday: 'Çarşamba',
  thursday: 'Perşembe',
  friday: 'Cuma',
  saturday: 'Cumartesi',
  sunday: 'Pazar',
};

export default function GuestBusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { exitGuestMode } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [activeTab, setActiveTab] = useState<'services' | 'staff' | 'hours'>('services');

  useEffect(() => {
    if (id) {
      fetchBusinessData();
    }
  }, [id]);

  const fetchBusinessData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, servicesRes, staffRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/mobile/tenants/${id}/settings?public=true`),
        fetch(`${API_BASE_URL}/api/mobile/services?public=true`, {
          headers: { 'X-Tenant-ID': id as string },
        }),
        fetch(`${API_BASE_URL}/api/mobile/staff?public=true`, {
          headers: { 'X-Tenant-ID': id as string },
        }),
      ]);

      const settingsData = await settingsRes.json();
      const servicesData = await servicesRes.json();
      const staffData = await staffRes.json();

      if (settingsData.success) {
        setSettings(settingsData.data);
      }
      if (servicesData.success) {
        setServices(servicesData.data || []);
      }
      if (staffData.success) {
        setStaff(staffData.data || []);
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
      Alert.alert('Hata', 'İşletme bilgileri yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookNow = async () => {
    Alert.alert(
      'Giriş Gerekli',
      'Randevu almak için giriş yapmanız gerekmektedir.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Giriş Yap',
          onPress: async () => {
            // Store the business ID so we can redirect after login
            await AsyncStorage.setItem('pendingBookingBusinessId', id as string);
            exitGuestMode();
            router.replace('/(auth)/customer-login');
          },
        },
      ]
    );
  };

  const groupServicesByCategory = () => {
    const grouped: { [key: string]: Service[] } = {};
    services.forEach((service) => {
      const category = service.category || 'Diğer';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(service);
    });
    return grouped;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['bottom']}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  const groupedServices = groupServicesByCategory();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Business Header */}
        <LinearGradient
          colors={['#059669', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.businessIcon}>
            <Ionicons name="business" size={40} color="#059669" />
          </View>
          <Text style={styles.businessName}>{settings?.businessName}</Text>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'services' && styles.tabActive]}
            onPress={() => setActiveTab('services')}
          >
            <Ionicons
              name="cut"
              size={18}
              color={activeTab === 'services' ? '#059669' : '#6B7280'}
            />
            <Text
              style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}
            >
              Hizmetler
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'staff' && styles.tabActive]}
            onPress={() => setActiveTab('staff')}
          >
            <Ionicons
              name="people"
              size={18}
              color={activeTab === 'staff' ? '#059669' : '#6B7280'}
            />
            <Text
              style={[styles.tabText, activeTab === 'staff' && styles.tabTextActive]}
            >
              Ekip
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'hours' && styles.tabActive]}
            onPress={() => setActiveTab('hours')}
          >
            <Ionicons
              name="time"
              size={18}
              color={activeTab === 'hours' ? '#059669' : '#6B7280'}
            />
            <Text
              style={[styles.tabText, activeTab === 'hours' && styles.tabTextActive]}
            >
              Çalışma Saatleri
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {activeTab === 'services' && (
            <>
              {Object.entries(groupedServices).map(([category, categoryServices]) => (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  {categoryServices.map((service) => (
                    <View key={service.id} style={styles.serviceCard}>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        {service.description && (
                          <Text style={styles.serviceDescription}>
                            {service.description}
                          </Text>
                        )}
                        <View style={styles.serviceMeta}>
                          <View style={styles.serviceMetaItem}>
                            <Ionicons name="time-outline" size={14} color="#6B7280" />
                            <Text style={styles.serviceMetaText}>
                              {service.duration} dk
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.servicePriceContainer}>
                        <Text style={styles.servicePrice}>{service.price} ₺</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
              {services.length === 0 && (
                <View style={styles.emptySection}>
                  <Ionicons name="cut-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyText}>Henüz hizmet eklenmemiş</Text>
                </View>
              )}
            </>
          )}

          {activeTab === 'staff' && (
            <>
              {staff.map((member) => (
                <View key={member.id} style={styles.staffCard}>
                  <View style={styles.staffAvatar}>
                    <Text style={styles.staffInitial}>
                      {member.firstName.charAt(0)}
                      {member.lastName.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>
                      {member.firstName} {member.lastName}
                    </Text>
                    {member.position && (
                      <Text style={styles.staffPosition}>{member.position}</Text>
                    )}
                  </View>
                </View>
              ))}
              {staff.length === 0 && (
                <View style={styles.emptySection}>
                  <Ionicons name="people-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyText}>Henüz ekip üyesi eklenmemiş</Text>
                </View>
              )}
            </>
          )}

          {activeTab === 'hours' && (
            <View style={styles.hoursCard}>
              {settings?.workingHours &&
                Object.entries(settings.workingHours).map(([day, hours]) => (
                  <View key={day} style={styles.hoursRow}>
                    <Text style={styles.dayName}>{DAY_NAMES[day]}</Text>
                    {hours.closed ? (
                      <Text style={styles.closedText}>Kapalı</Text>
                    ) : (
                      <Text style={styles.hoursText}>
                        {hours.start} - {hours.end}
                      </Text>
                    )}
                  </View>
                ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Book Now Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBookNow}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar" size={20} color="#fff" />
          <Text style={styles.bookButtonText}>Randevu Al</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  businessIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  businessName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#ECFDF5',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#059669',
  },
  content: {
    padding: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    paddingLeft: 4,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceMetaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  servicePriceContainer: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  hoursCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  hoursText: {
    fontSize: 15,
    color: '#059669',
    fontWeight: '600',
  },
  closedText: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '500',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 12,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});
