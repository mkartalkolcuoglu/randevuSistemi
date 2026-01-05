import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../../src/store/auth.store';
import { appointmentService } from '../../../src/services/appointment.service';
import { Appointment } from '../../../src/types';

const IS_IOS = Platform.OS === 'ios';

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending: { bg: '#FEF3C7', text: '#D97706', label: 'Bekliyor', icon: 'time-outline' },
  confirmed: { bg: '#DBEAFE', text: '#2563EB', label: 'Onaylandı', icon: 'checkmark-circle-outline' },
  completed: { bg: '#D1FAE5', text: '#059669', label: 'Tamamlandı', icon: 'checkmark-done-outline' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'İptal', icon: 'close-circle-outline' },
  no_show: { bg: '#F3F4F6', text: '#6B7280', label: 'Gelmedi', icon: 'alert-circle-outline' },
};

const TENANT_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: '#D1FAE5', text: '#059669', label: '' },
  inactive: { bg: '#FEF3C7', text: '#D97706', label: 'Pasif İşletme' },
  deleted: { bg: '#FEE2E2', text: '#DC2626', label: 'Silinmiş İşletme' },
};

export default function CustomerAppointmentsScreen() {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  const fetchAppointments = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await appointmentService.getMyAppointments();
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [])
  );

  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = new Date(`${apt.date}T${apt.time}`);
    const now = new Date();
    if (filter === 'upcoming') {
      return aptDate >= now && !['cancelled', 'completed', 'no_show'].includes(apt.status);
    }
    return aptDate < now || ['cancelled', 'completed', 'no_show'].includes(apt.status);
  });

  const handleCancelAppointment = async (id: string) => {
    Alert.alert(
      'Randevuyu İptal Et',
      'Bu randevuyu iptal etmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              await appointmentService.cancelAppointment(id);
              fetchAppointments();
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              Alert.alert('Hata', 'Randevu iptal edilirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    };
    return date.toLocaleDateString('tr-TR', options);
  };

  const getRelativeDay = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Bugün';
    if (date.toDateString() === tomorrow.toDateString()) return 'Yarın';
    return null;
  };

  const renderAppointment = ({ item }: { item: Appointment }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const tenantStatus = TENANT_STATUS_CONFIG[item.tenantStatus || 'active'];
    const aptDate = new Date(`${item.date}T${item.time}`);
    const canCancel = aptDate > new Date() && ['pending', 'confirmed'].includes(item.status) && item.tenantStatus === 'active';
    const isInactiveTenant = item.tenantStatus === 'inactive' || item.tenantStatus === 'deleted';
    const relativeDay = getRelativeDay(item.date);

    return (
      <View style={[styles.appointmentCard, isInactiveTenant && styles.appointmentCardInactive]}>
        {/* Tenant Badge - show if inactive or deleted */}
        {isInactiveTenant && (
          <View style={[styles.tenantBadge, { backgroundColor: tenantStatus.bg }]}>
            <Ionicons
              name={item.tenantStatus === 'deleted' ? 'close-circle' : 'pause-circle'}
              size={14}
              color={tenantStatus.text}
            />
            <Text style={[styles.tenantBadgeText, { color: tenantStatus.text }]}>
              {tenantStatus.label}
            </Text>
          </View>
        )}

        {/* Tenant Name */}
        <View style={styles.tenantNameRow}>
          <View style={styles.tenantIconContainer}>
            <Ionicons name="storefront" size={16} color="#059669" />
          </View>
          <Text style={[styles.tenantName, isInactiveTenant && styles.tenantNameInactive]}>
            {item.tenantName || 'Bilinmiyor'}
          </Text>
        </View>

        {/* Date & Time Section */}
        <View style={styles.dateTimeSection}>
          <View style={styles.dateContainer}>
            {relativeDay && (
              <View style={styles.relativeDayBadge}>
                <Text style={styles.relativeDayText}>{relativeDay}</Text>
              </View>
            )}
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.timeContainer}>
            <Ionicons name="time" size={20} color="#059669" />
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={16} color={status.text} />
          <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
        </View>

        {/* Service Details */}
        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="cut" size={16} color="#059669" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Hizmet</Text>
              <Text style={styles.detailValue}>{item.serviceName}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="person" size={16} color="#059669" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Uzman</Text>
              <Text style={styles.detailValue}>{item.staffName}</Text>
            </View>
          </View>

          <View style={styles.detailsFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="hourglass-outline" size={16} color="#6B7280" />
              <Text style={styles.footerText}>{item.duration} dk</Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerItem}>
              <Ionicons name="wallet-outline" size={16} color="#059669" />
              <Text style={styles.footerPrice}>{item.price} ₺</Text>
            </View>
          </View>
        </View>

        {/* Cancel Button */}
        {canCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelAppointment(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
            <Text style={styles.cancelButtonText}>Randevuyu İptal Et</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="calendar-outline" size={48} color="#059669" />
      </View>
      <Text style={styles.emptyTitle}>
        {filter === 'upcoming' ? 'Yaklaşan randevunuz yok' : 'Geçmiş randevunuz yok'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'upcoming'
          ? 'Yeni randevu oluşturmak için "Randevu Al" butonuna tıklayın'
          : 'Geçmiş randevularınız burada görünecek'}
      </Text>
    </View>
  );

  const upcomingCount = appointments.filter((apt) => {
    const aptDate = new Date(`${apt.date}T${apt.time}`);
    return aptDate >= new Date() && !['cancelled', 'completed', 'no_show'].includes(apt.status);
  }).length;

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#059669', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + (IS_IOS ? 16 : 12) }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Merhaba,</Text>
            <Text style={styles.userName}>{user?.firstName || 'Müşteri'}</Text>
          </View>
          <View style={styles.appointmentCountBadge}>
            <Text style={styles.appointmentCount}>{upcomingCount}</Text>
            <Text style={styles.appointmentCountLabel}>Aktif Randevu</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'upcoming' && styles.filterButtonActive]}
            onPress={() => setFilter('upcoming')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calendar"
              size={18}
              color={filter === 'upcoming' ? '#059669' : 'rgba(255,255,255,0.7)'}
            />
            <Text style={[styles.filterText, filter === 'upcoming' && styles.filterTextActive]}>
              Yaklaşan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'past' && styles.filterButtonActive]}
            onPress={() => setFilter('past')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="time"
              size={18}
              color={filter === 'past' ? '#059669' : 'rgba(255,255,255,0.7)'}
            />
            <Text style={[styles.filterText, filter === 'past' && styles.filterTextActive]}>
              Geçmiş
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Randevular yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchAppointments(true)}
              tintColor="#059669"
              colors={['#059669']}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  appointmentCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  appointmentCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  appointmentCountLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#fff',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  filterTextActive: {
    color: '#059669',
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  appointmentCardInactive: {
    opacity: 0.85,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tenantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
    gap: 4,
  },
  tenantBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tenantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tenantIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 10,
    flex: 1,
  },
  tenantNameInactive: {
    color: '#9CA3AF',
  },
  dateTimeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flex: 1,
  },
  relativeDayBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  relativeDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 1,
  },
  detailsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  footerPrice: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
