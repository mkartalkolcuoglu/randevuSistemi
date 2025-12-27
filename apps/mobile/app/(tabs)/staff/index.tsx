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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/auth.store';
import { appointmentService } from '../../../src/services/appointment.service';
import { Appointment } from '../../../src/types';
import DrawerMenu from '../../../src/components/DrawerMenu';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  useFocusEffect(
    useCallback(() => {
      fetchData();
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
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchData(true)}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
      >
        {/* Header with Menu Button */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setDrawerOpen(true)}
            >
              <Ionicons name="menu" size={24} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>
                {user?.firstName || 'Personel'} {user?.lastName?.charAt(0) ? user.lastName.charAt(0) + '.' : ''}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => Alert.alert('Bildirimler', 'Bu özellik yakında eklenecek')}
            >
              <Ionicons name="notifications-outline" size={22} color="#1F2937" />
              {stats.todayPending > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {stats.todayPending > 9 ? '9+' : stats.todayPending}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Tenant Banner */}
        <View style={styles.tenantBanner}>
          <View
            style={[
              styles.tenantLogo,
              { backgroundColor: selectedTenant?.primaryColor || '#3B82F6' },
            ]}
          >
            <Text style={styles.tenantInitial}>
              {selectedTenant?.businessName?.charAt(0)?.toUpperCase() || 'S'}
            </Text>
          </View>
          <View style={styles.tenantInfo}>
            <Text style={styles.tenantName}>{selectedTenant?.businessName || 'Salon'}</Text>
            <Text style={styles.dateText}>{getFormattedDate()}</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsScrollContent}
          >
            {/* Today's Revenue Card */}
            <View style={[styles.statCard, styles.revenueCard]}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="cash-outline" size={24} color="#fff" />
                </View>
                <Text style={[styles.statCardLabel, { color: 'rgba(255,255,255,0.8)' }]}>
                  Bugünkü Gelir
                </Text>
              </View>
              <Text style={[styles.statCardValue, { color: '#fff' }]}>
                {formatCurrency(stats.todayRevenue)}
              </Text>
              <Text style={[styles.statCardSubtext, { color: 'rgba(255,255,255,0.7)' }]}>
                Bu hafta: {formatCurrency(stats.weekRevenue)}
              </Text>
            </View>

            {/* Today's Appointments Card */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.statCardLabel}>Bugünkü Randevular</Text>
              </View>
              <Text style={styles.statCardValue}>{stats.todayTotal}</Text>
              <Text style={styles.statCardSubtext}>
                {stats.upcomingCount} yaklaşan
              </Text>
            </View>

            {/* Pending Card */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="time-outline" size={24} color="#D97706" />
                </View>
                <Text style={styles.statCardLabel}>Bekleyen</Text>
              </View>
              <Text style={styles.statCardValue}>{stats.todayPending}</Text>
              <Text style={styles.statCardSubtext}>onay bekliyor</Text>
            </View>

            {/* Completed Card */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="checkmark-circle-outline" size={24} color="#059669" />
                </View>
                <Text style={styles.statCardLabel}>Tamamlanan</Text>
              </View>
              <Text style={styles.statCardValue}>{stats.todayCompleted}</Text>
              <Text style={styles.statCardSubtext}>bugün</Text>
            </View>
          </ScrollView>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="time" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Yaklaşan Randevular</Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/staff/appointments')}
            >
              <Text style={styles.seeAllText}>Tümü</Text>
              <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {upcomingAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrapper}>
                <Ionicons name="checkmark-done-circle-outline" size={40} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>Yaklaşan randevu yok</Text>
              <Text style={styles.emptySubtitle}>
                Bugünkü tüm randevular tamamlandı
              </Text>
            </View>
          ) : (
            upcomingAppointments.map((apt, index) => {
              const status = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
              return (
                <TouchableOpacity
                  key={apt.id}
                  style={[
                    styles.appointmentCard,
                    index === 0 && styles.appointmentCardFirst,
                  ]}
                  onPress={() => router.push('/(tabs)/staff/appointments')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.timeIndicator, { backgroundColor: status.text }]} />
                  <View style={styles.appointmentContent}>
                    <View style={styles.appointmentHeader}>
                      <View style={styles.timeSection}>
                        <Text style={styles.aptTime}>{formatTime(apt.time)}</Text>
                        <Text style={styles.aptDuration}>{apt.duration} dk</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Ionicons name={status.icon as any} size={12} color={status.text} />
                        <Text style={[styles.statusText, { color: status.text }]}>
                          {status.label}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.appointmentBody}>
                      <View style={styles.customerAvatar}>
                        <Text style={styles.customerAvatarText}>
                          {apt.customerName?.charAt(0)?.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.appointmentDetails}>
                        <Text style={styles.aptCustomer} numberOfLines={1}>
                          {apt.customerName}
                        </Text>
                        <Text style={styles.aptService} numberOfLines={1}>
                          {apt.serviceName}
                        </Text>
                      </View>
                      <Text style={styles.aptPrice}>{formatCurrency(apt.price || 0)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="flash" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
            </View>
          </View>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => Alert.alert('Yeni Randevu', 'Bu özellik yakında eklenecek')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="add-circle" size={28} color="#3B82F6" />
              </View>
              <Text style={styles.quickActionLabel}>Yeni Randevu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push('/(tabs)/staff/customers')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="people" size={28} color="#059669" />
              </View>
              <Text style={styles.quickActionLabel}>Müşteriler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push('/settings/cashier' as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="cash" size={28} color="#D97706" />
              </View>
              <Text style={styles.quickActionLabel}>Kasa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push('/(tabs)/staff/settings')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="settings" size={28} color="#8B5CF6" />
              </View>
              <Text style={styles.quickActionLabel}>Ayarlar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's All Appointments */}
        {todayAppointments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="calendar" size={20} color="#059669" />
                <Text style={styles.sectionTitle}>Bugünün Programı</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{todayAppointments.length}</Text>
              </View>
            </View>

            <View style={styles.timelineContainer}>
              {todayAppointments.map((apt, index) => {
                const status = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
                const isLast = index === todayAppointments.length - 1;

                return (
                  <View key={apt.id} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <Text style={styles.timelineTime}>{formatTime(apt.time)}</Text>
                      {!isLast && <View style={styles.timelineLine} />}
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.timelineCard,
                        { borderLeftColor: status.text },
                      ]}
                      onPress={() => router.push('/(tabs)/staff/appointments')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.timelineCardHeader}>
                        <Text style={styles.timelineCustomer} numberOfLines={1}>
                          {apt.customerName}
                        </Text>
                        <View style={[styles.timelineBadge, { backgroundColor: status.bg }]}>
                          <Text style={[styles.timelineBadgeText, { color: status.text }]}>
                            {status.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.timelineService} numberOfLines={1}>
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
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  // Tenant Banner
  tenantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tenantLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenantInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  tenantInfo: {
    marginLeft: 12,
  },
  tenantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  dateText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },

  // Stats Section
  statsSection: {
    marginTop: 16,
  },
  statsScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: SCREEN_WIDTH * 0.42,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  revenueCard: {
    backgroundColor: '#3B82F6',
    width: SCREEN_WIDTH * 0.5,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statCardLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  statCardValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
  },
  statCardSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // Section
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
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
    color: '#3B82F6',
  },
  countBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  // Empty State
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
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

  // Appointment Card
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  appointmentCardFirst: {
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  timeIndicator: {
    width: 4,
  },
  appointmentContent: {
    flex: 1,
    padding: 16,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  aptTime: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  aptDuration: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  appointmentDetails: {
    flex: 1,
  },
  aptCustomer: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  aptService: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  aptPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionItem: {
    width: (SCREEN_WIDTH - 52) / 4,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
  },

  // Timeline
  timelineContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineLeft: {
    width: 50,
    alignItems: 'center',
  },
  timelineTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 8,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginLeft: 12,
    borderLeftWidth: 3,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineCustomer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  timelineBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timelineBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  timelineService: {
    fontSize: 12,
    color: '#6B7280',
  },
});
