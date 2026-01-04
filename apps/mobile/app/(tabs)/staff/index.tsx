import { useState, useCallback, useMemo } from 'react';
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
import DrawerMenu from '../../../src/components/DrawerMenu';
import Header from '../../../src/components/Header';
import PermissionGuard from '../../../src/components/PermissionGuard';
import api from '../../../src/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THEME_COLOR = '#163974';

// HIG/Material Design compliant values
const IS_IOS = Platform.OS === 'ios';

// Status configuration
const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706', label: 'Bekliyor', icon: 'time-outline' },
  confirmed: { bg: '#DBEAFE', text: '#2563EB', label: 'Onaylandı', icon: 'checkmark-circle-outline' },
  scheduled: { bg: '#DBEAFE', text: '#2563EB', label: 'Onaylandı', icon: 'checkmark-circle-outline' },
  completed: { bg: '#D1FAE5', text: '#059669', label: 'Tamamlandı', icon: 'checkmark-done-outline' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'İptal', icon: 'close-circle-outline' },
  no_show: { bg: '#F3F4F6', text: '#6B7280', label: 'Gelmedi', icon: 'alert-circle-outline' },
};

export default function StaffHomeScreen() {
  const router = useRouter();
  const { user, selectedTenant } = useAuthStore();
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Today's date
  const today = new Date().toISOString().split('T')[0];

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
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <PermissionGuard permissionKey="dashboard" pageName="Ana Sayfa">
    <SafeAreaView style={styles.container} edges={['top']}>
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
        {/* Header */}
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

        {/* Revenue Card */}
        <View style={styles.section}>
          <LinearGradient
            colors={[THEME_COLOR, '#1e4a8f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.revenueCard}
          >
            <View style={styles.revenueHeader}>
              <View style={styles.revenueIconContainer}>
                <Ionicons name="wallet-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.revenueLabel}>Bugünkü Gelir</Text>
            </View>
            <Text style={styles.revenueAmount}>{formatCurrency(stats.todayRevenue)}</Text>
            <View style={styles.revenueFooter}>
              <View style={styles.revenueSubItem}>
                <Text style={styles.revenueSubLabel}>Bu Hafta</Text>
                <Text style={styles.revenueSubValue}>{formatCurrency(stats.weekRevenue)}</Text>
              </View>
              <View style={styles.revenueDivider} />
              <View style={styles.revenueSubItem}>
                <Text style={styles.revenueSubLabel}>Tamamlanan</Text>
                <Text style={styles.revenueSubValue}>{stats.todayCompleted} randevu</Text>
              </View>
            </View>
          </LinearGradient>
        </View>


        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Yaklaşan Randevular</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/staff/appointments')}
            >
              <Text style={styles.seeAllText}>Tümü</Text>
              <Ionicons name="chevron-forward" size={16} color={THEME_COLOR} />
            </TouchableOpacity>
          </View>

          {upcomingAppointments.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrapper}>
                <Ionicons name="checkmark-done-circle-outline" size={40} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>Yaklaşan randevu yok</Text>
              <Text style={styles.emptySubtitle}>Bugünkü tüm randevular tamamlandı</Text>
            </View>
          ) : (
            upcomingAppointments.map((apt, index) => {
              const status = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
              return (
                <TouchableOpacity
                  key={apt.id}
                  style={styles.appointmentCard}
                  onPress={() => router.push('/(tabs)/staff/appointments')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.appointmentIndicator, { backgroundColor: status.text }]} />
                  <View style={styles.appointmentContent}>
                    <View style={styles.appointmentTop}>
                      <View style={styles.appointmentTimeContainer}>
                        <Text style={styles.appointmentTime}>{formatTime(apt.time)}</Text>
                        <Text style={styles.appointmentDuration}>{apt.duration} dk</Text>
                      </View>
                      <View style={[styles.appointmentStatus, { backgroundColor: status.bg }]}>
                        <Ionicons name={status.icon as any} size={12} color={status.text} />
                        <Text style={[styles.appointmentStatusText, { color: status.text }]}>
                          {status.label}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.appointmentBottom}>
                      <View style={styles.customerInfo}>
                        <View style={styles.customerAvatar}>
                          <Text style={styles.customerAvatarText}>
                            {apt.customerName?.charAt(0)?.toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.customerDetails}>
                          <Text style={styles.customerName} numberOfLines={1}>
                            {apt.customerName}
                          </Text>
                          <Text style={styles.serviceName} numberOfLines={1}>
                            {apt.serviceName}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.appointmentPrice}>{formatCurrency(apt.price || 0)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => Alert.alert('Yeni Randevu', 'Bu özellik yakında eklenecek')}
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
