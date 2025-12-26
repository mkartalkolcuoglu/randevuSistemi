import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/auth.store';
import { appointmentService } from '../../../src/services/appointment.service';
import { Appointment } from '../../../src/types';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706', label: 'Bekliyor' },
  confirmed: { bg: '#DBEAFE', text: '#2563EB', label: 'Onaylandı' },
  completed: { bg: '#D1FAE5', text: '#059669', label: 'Tamamlandı' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'İptal' },
  no_show: { bg: '#F3F4F6', text: '#6B7280', label: 'Gelmedi' },
};

export default function StaffHomeScreen() {
  const router = useRouter();
  const { user, selectedTenant } = useAuthStore();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    completed: 0,
    revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await appointmentService.getStaffAppointments();
      const appointments = response.data || [];
      const today = new Date().toISOString().split('T')[0];

      const todayApts = appointments.filter((apt) => apt.date === today);
      setTodayAppointments(todayApts);

      const pendingCount = appointments.filter((apt) => apt.status === 'pending').length;
      const completedToday = todayApts.filter((apt) => apt.status === 'completed').length;
      const revenueToday = todayApts
        .filter((apt) => apt.status === 'completed')
        .reduce((sum, apt) => sum + (apt.price || 0), 0);

      setStats({
        today: todayApts.length,
        pending: pendingCount,
        completed: completedToday,
        revenue: revenueToday,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  const formatTime = (time: string) => time.substring(0, 5);

  const renderStatCard = (
    icon: string,
    label: string,
    value: string | number,
    color: string
  ) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchData(true)}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>
              {user?.firstName || 'Personel'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Tenant Info */}
        <View style={styles.tenantBanner}>
          <View
            style={[
              styles.tenantLogo,
              { backgroundColor: selectedTenant?.primaryColor || '#3B82F6' },
            ]}
          >
            <Text style={styles.tenantInitial}>
              {selectedTenant?.businessName?.charAt(0) || 'S'}
            </Text>
          </View>
          <Text style={styles.tenantName}>{selectedTenant?.businessName}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {renderStatCard('calendar', 'Bugün', stats.today, '#3B82F6')}
          {renderStatCard('time', 'Bekleyen', stats.pending, '#F59E0B')}
          {renderStatCard('checkmark-circle', 'Tamamlanan', stats.completed, '#10B981')}
          {renderStatCard('cash', 'Gelir', `${stats.revenue}₺`, '#8B5CF6')}
        </View>

        {/* Today's Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bugünün Randevuları</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/staff/appointments')}>
              <Text style={styles.seeAllText}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>

          {todayAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Bugün randevu yok</Text>
            </View>
          ) : (
            todayAppointments.slice(0, 5).map((apt) => {
              const status = STATUS_COLORS[apt.status] || STATUS_COLORS.pending;
              return (
                <TouchableOpacity
                  key={apt.id}
                  style={styles.appointmentCard}
                  onPress={() => router.push(`/appointment/${apt.id}`)}
                >
                  <View style={styles.timeColumn}>
                    <Text style={styles.aptTime}>{formatTime(apt.time)}</Text>
                    <Text style={styles.aptDuration}>{apt.duration} dk</Text>
                  </View>
                  <View style={styles.aptInfo}>
                    <Text style={styles.aptCustomer}>{apt.customerName}</Text>
                    <Text style={styles.aptService}>{apt.serviceName}</Text>
                  </View>
                  <View style={[styles.aptStatus, { backgroundColor: status.bg }]}>
                    <Text style={[styles.aptStatusText, { color: status.text }]}>
                      {status.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/appointment/new')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="add-circle" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.actionLabel}>Yeni Randevu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/staff/customers')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="people" size={24} color="#10B981" />
              </View>
              <Text style={styles.actionLabel}>Müşteriler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/staff/settings')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="settings" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.actionLabel}>Ayarlar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tenantLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenantInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  tenantName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
    marginLeft: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    backgroundColor: '#fff',
  },
  statCard: {
    width: '50%',
    padding: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    marginTop: 16,
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 12,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  timeColumn: {
    alignItems: 'center',
    marginRight: 16,
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  aptTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  aptDuration: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  aptInfo: {
    flex: 1,
  },
  aptCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  aptService: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  aptStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aptStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
});
