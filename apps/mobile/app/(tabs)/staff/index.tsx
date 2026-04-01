import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../../src/store/auth.store';
import { appointmentService } from '../../../src/services/appointment.service';
import { Appointment } from '../../../src/types';
import { formatLocalDate } from '../../../src/utils/date';
import DrawerMenu from '../../../src/components/DrawerMenu';
import Header from '../../../src/components/Header';
import PermissionGuard from '../../../src/components/PermissionGuard';
import OnboardingWizard from '../../../src/components/OnboardingWizard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../src/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THEME_COLOR = '#163974';

// HIG/Material Design compliant values
const IS_IOS = Platform.OS === 'ios';

// Status configuration
const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706', label: 'Beklemede', icon: 'time-outline' },
  confirmed: { bg: '#DBEAFE', text: '#2563EB', label: 'Onaylandı', icon: 'checkmark-circle-outline' },
  scheduled: { bg: '#DBEAFE', text: '#2563EB', label: 'Onaylandı', icon: 'checkmark-circle-outline' },
  completed: { bg: '#D1FAE5', text: '#059669', label: 'Tamamlandı', icon: 'checkmark-done-outline' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'İptal Edildi', icon: 'close-circle-outline' },
  no_show: { bg: '#F3F4F6', text: '#6B7280', label: 'Gelmedi ve Bilgi Vermedi', icon: 'alert-circle-outline' },
};

export default function StaffHomeScreen() {
  const router = useRouter();
  const { user, selectedTenant } = useAuthStore();
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<{ completedSteps: string[]; totalSteps: number } | null>(null);

  useEffect(() => {
    if (user?.userType !== 'owner') return;
    const checkOnboarding = async () => {
      try {
        const dismissed = await AsyncStorage.getItem(`onboarding_dismissed_${selectedTenant?.id}`);
        const res = await api.get('/api/mobile/onboarding/status');
        if (res.data?.success && !res.data.completed) {
          setOnboardingStatus({ completedSteps: res.data.completedSteps, totalSteps: res.data.totalSteps });
          if (dismissed === 'true') {
            setOnboardingDismissed(true);
          } else {
            setShowOnboarding(true);
          }
        }
      } catch {}
    };
    checkOnboarding();
  }, [user?.userType, selectedTenant?.id]);

  const handleOnboardingDismiss = async () => {
    setShowOnboarding(false);
    setOnboardingDismissed(true);
    await AsyncStorage.setItem(`onboarding_dismissed_${selectedTenant?.id}`, 'true');
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    setOnboardingDismissed(false);
    setOnboardingStatus(null);
    await AsyncStorage.removeItem(`onboarding_dismissed_${selectedTenant?.id}`);
  };

  // Today's date
  const today = formatLocalDate(new Date());

  // Fetch data
  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await appointmentService.getStaffAppointments();
      setAllAppointments(response.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setAllAppointments([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch notifications count
  const fetchNotificationsCount = async () => {
    try {
      const response = await api.get('/api/mobile/notifications');
      if (response.data.success) {
        setUnreadNotifications(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      fetchNotificationsCount();
    }, [])
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const todayAppointments = allAppointments.filter((apt) => apt.date === today);
    const pendingCount = allAppointments.filter((apt) => apt.status === 'pending').length;
    const confirmedToday = todayAppointments.filter((apt) => apt.status === 'confirmed' || apt.status === 'scheduled').length;
    const completedToday = todayAppointments.filter((apt) => apt.status === 'completed').length;
    const revenueToday = todayAppointments
      .filter((apt) => apt.status === 'completed')
      .reduce((sum, apt) => sum + (apt.price || 0), 0);

    // This week stats
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekAppointments = allAppointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      return aptDate >= weekStart;
    });
    const weekRevenue = weekAppointments
      .filter((apt) => apt.status === 'completed')
      .reduce((sum, apt) => sum + (apt.price || 0), 0);

    return {
      todayTotal: todayAppointments.length,
      todayPending: pendingCount,
      todayConfirmed: confirmedToday,
      todayCompleted: completedToday,
      todayRevenue: revenueToday,
      weekRevenue,
      upcomingCount: todayAppointments.filter(
        (apt) => apt.status !== 'completed' && apt.status !== 'cancelled' && apt.status !== 'no_show'
      ).length,
    };
  }, [allAppointments, today]);

  // Today's appointments sorted by time
  const todayAppointments = useMemo(() => {
    return allAppointments
      .filter((apt) => apt.date === today)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [allAppointments, today]);

  // Upcoming appointments (next few)
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return todayAppointments
      .filter(
        (apt) =>
          apt.time >= currentTime &&
          apt.status !== 'completed' &&
          apt.status !== 'cancelled' &&
          apt.status !== 'no_show'
      )
      .slice(0, 3);
  }, [todayAppointments]);

  // Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  // Format time
  const formatTime = (time: string) => time.substring(0, 5);

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('tr-TR') + ' ₺';
  };

  // Get current date formatted
  const getFormattedDate = () => {
    return new Date().toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <PermissionGuard permissionKey="dashboard" pageName="Ana Sayfa">
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header - Fixed */}
      <Header
        title={`${getGreeting()}, ${user?.firstName || 'Personel'}`}
        subtitle={selectedTenant?.businessName}
        onMenuPress={() => setDrawerOpen(true)}
        showNotification
        notificationCount={unreadNotifications}
        onNotificationPress={() => router.push('/(tabs)/staff/notifications')}
        gradientColors={[THEME_COLOR, '#1e4a8f']}
        stats={[
          {
            icon: 'calendar',
            iconColor: '#3B82F6',
            iconBg: '#EFF6FF',
            value: stats.todayTotal,
            label: 'Bugün',
          },
          {
              icon: 'checkmark',
              iconColor: '#059669',
              iconBg: '#D1FAE5',
              value: stats.todayCompleted,
              label: 'Tamam',
            },
            {
              icon: 'time',
              iconColor: '#D97706',
              iconBg: '#FEF3C7',
              value: stats.todayPending,
              label: 'Bekleyen',
            },
            {
              icon: 'cash',
              iconColor: '#4F46E5',
              iconBg: '#E0E7FF',
              value: stats.todayRevenue,
              label: 'Kazanç ₺',
            },
          ]}
        />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchData(true)}
            tintColor={THEME_COLOR}
            colors={[THEME_COLOR]}
          />
        }
      >
        {/* Onboarding Banner */}
        {onboardingDismissed && !showOnboarding && onboardingStatus && (
          <View style={styles.section}>
            <TouchableOpacity
              onPress={() => { setShowOnboarding(true); setOnboardingDismissed(false); }}
              style={{ backgroundColor: '#FEF3C7', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#FDE68A' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#92400E' }}>
                    Kurulum %{Math.round((onboardingStatus.completedSteps.length / onboardingStatus.totalSteps) * 100)} tamamlandı
                  </Text>
                  <Text style={{ fontSize: 12, color: '#A16207', marginTop: 2 }}>
                    {onboardingStatus.completedSteps.length}/{onboardingStatus.totalSteps} adım. Devam etmek için dokunun.
                  </Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={28} color="#D97706" />
              </View>
              <View style={{ height: 4, backgroundColor: '#FDE68A', borderRadius: 2, marginTop: 10 }}>
                <View style={{ height: 4, backgroundColor: '#D97706', borderRadius: 2, width: `${Math.round((onboardingStatus.completedSteps.length / onboardingStatus.totalSteps) * 100)}%` }} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/appointment/new')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="add-circle-outline" size={24} color={THEME_COLOR} />
              </View>
              <Text style={styles.quickActionLabel}>Yeni Randevu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/staff/customers')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="people-outline" size={24} color="#059669" />
              </View>
              <Text style={styles.quickActionLabel}>Müşteriler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/staff/appointments')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="calendar-outline" size={24} color="#D97706" />
              </View>
              <Text style={styles.quickActionLabel}>Takvim</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Schedule */}
        {todayAppointments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Bugünün Programı</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{todayAppointments.length}</Text>
              </View>
            </View>

            <View style={styles.scheduleCard}>
              {todayAppointments.map((apt, index) => {
                const status = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
                const isLast = index === todayAppointments.length - 1;

                return (
                  <View key={apt.id} style={styles.scheduleItem}>
                    <View style={styles.scheduleTimeColumn}>
                      <Text style={styles.scheduleTime}>{formatTime(apt.time)}</Text>
                      {!isLast && <View style={styles.scheduleLine} />}
                    </View>
                    <TouchableOpacity
                      style={[styles.scheduleContent, { borderLeftColor: status.text }]}
                      onPress={() => router.push('/(tabs)/staff/appointments')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.scheduleHeader}>
                        <Text style={styles.scheduleCustomer} numberOfLines={1}>
                          {apt.customerName}
                        </Text>
                        <View style={[styles.scheduleStatusBadge, { backgroundColor: status.bg }]}>
                          <Text style={[styles.scheduleStatusText, { color: status.text }]}>
                            {status.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.scheduleService} numberOfLines={1}>
                        {apt.serviceName} • {apt.duration} dk
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Drawer Menu */}
      <DrawerMenu isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Onboarding Wizard */}
      {onboardingStatus && (
        <OnboardingWizard
          visible={showOnboarding}
          completedSteps={onboardingStatus.completedSteps}
          onDismiss={handleOnboardingDismiss}
          onComplete={handleOnboardingComplete}
        />
      )}
    </SafeAreaView>
    </PermissionGuard>
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
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME_COLOR,
  },
  countBadge: {
    backgroundColor: THEME_COLOR,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  // Revenue Card
  revenueCard: {
    borderRadius: 16,
    padding: 20,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  revenueIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  revenueFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  revenueSubItem: {
    flex: 1,
    alignItems: 'center',
  },
  revenueSubLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  revenueSubValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  revenueDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // Appointment Card - HIG/Material Design Compliant
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: IS_IOS ? 16 : 16, // Both platforms: 16dp/pt for larger cards
    marginBottom: IS_IOS ? 12 : 12,
    overflow: 'hidden',
    // Platform-specific shadows
    ...(IS_IOS ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    } : {
      elevation: 2,
    }),
  },
  appointmentIndicator: {
    width: IS_IOS ? 4 : 6,
  },
  appointmentContent: {
    flex: 1,
    padding: IS_IOS ? 16 : 16,
  },
  appointmentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentTimeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  appointmentTime: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  appointmentDuration: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  appointmentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  appointmentStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME_COLOR,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  serviceName: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  appointmentPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
  },

  // Schedule
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  scheduleTimeColumn: {
    width: 50,
    alignItems: 'center',
  },
  scheduleTime: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME_COLOR,
  },
  scheduleLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 8,
  },
  scheduleContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginLeft: 12,
    borderLeftWidth: 3,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  scheduleCustomer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  scheduleStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  scheduleStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  scheduleService: {
    fontSize: 12,
    color: '#6B7280',
  },
});
