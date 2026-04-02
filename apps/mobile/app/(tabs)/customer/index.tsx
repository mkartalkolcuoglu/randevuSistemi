import { useState, useCallback, useRef, useMemo } from 'react';
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
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAuthStore } from '../../../src/store/auth.store';
import { appointmentService } from '../../../src/services/appointment.service';
import { notificationService } from '../../../src/services/notification.service';
import { Appointment } from '../../../src/types';

const IS_IOS = Platform.OS === 'ios';

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending: { bg: '#FEF3C7', text: '#D97706', label: 'Beklemede', icon: 'time-outline' },
  confirmed: { bg: '#DBEAFE', text: '#2563EB', label: 'Onaylandı', icon: 'checkmark-circle-outline' },
  completed: { bg: '#D1FAE5', text: '#059669', label: 'Tamamlandı', icon: 'checkmark-done-outline' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'İptal Edildi', icon: 'close-circle-outline' },
  no_show: { bg: '#F3F4F6', text: '#6B7280', label: 'Gelmedi ve Bilgi Vermedi', icon: 'alert-circle-outline' },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc'>('date_asc');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const lastAppointmentsHashRef = useRef<string>('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAppointments = async (silent = false, showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else if (!silent) setIsLoading(true);

    try {
      const response = await appointmentService.getMyAppointments();
      const appts = response.data || [];

      const newHash = JSON.stringify(appts.map(a => `${a.id}_${a.status}_${a.time}_${a.date}`));
      if (silent && newHash === lastAppointmentsHashRef.current) {
        return;
      }

      // Yeni veya değişen randevu bildirimi
      if (silent && lastAppointmentsHashRef.current) {
        const oldIds = new Set(
          lastAppointmentsHashRef.current.match(/([a-z0-9]+)_/g)?.map(s => s.replace('_', '')) || []
        );
        const newAppts = appts.filter(a => !oldIds.has(a.id));
        if (newAppts.length > 0) {
          const apt = newAppts[0];
          notificationService.scheduleLocalNotification(
            'Yeni Randevu',
            `${apt.serviceName} - ${apt.date} ${apt.time}`,
            { appointmentId: apt.id },
          );
        }
      }

      lastAppointmentsHashRef.current = newHash;
      setAppointments(appts);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      if (!silent) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
      pollingRef.current = setInterval(() => {
        fetchAppointments(true);
      }, 30000);
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }, [])
  );

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(IS_IOS ? true : false);
    if (date) setSelectedDate(date);
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
    setShowDatePicker(false);
  };

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const filteredAppointments = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = appointments.filter((apt) => {
      const aptDate = new Date(`${apt.date}T${apt.time}`);
      const now = new Date();
      const matchesFilter = filter === 'upcoming'
        ? aptDate >= now && !['cancelled', 'completed', 'no_show'].includes(apt.status)
        : aptDate < now || ['cancelled', 'completed', 'no_show'].includes(apt.status);
      if (!matchesFilter) return false;

      if (selectedDate) {
        const selected = selectedDate.toISOString().split('T')[0];
        if (apt.date !== selected) return false;
      }

      if (!query) return true;
      return (
        (apt.tenantName || '').toLowerCase().includes(query) ||
        (apt.serviceName || '').toLowerCase().includes(query) ||
        (apt.staffName || '').toLowerCase().includes(query)
      );
    });

    filtered.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime();
      }
      return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
    });

    return filtered;
  }, [appointments, filter, searchQuery, sortBy, selectedDate]);

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
              size={12}
              color={tenantStatus.text}
            />
            <Text style={[styles.tenantBadgeText, { color: tenantStatus.text }]}>
              {tenantStatus.label}
            </Text>
          </View>
        )}

        {/* Row 1: Tenant Name + Status Badge */}
        <View style={styles.tenantNameRow}>
          <View style={styles.tenantRowLeft}>
            <View style={styles.tenantIconContainer}>
              <Ionicons name="storefront" size={13} color="#059669" />
            </View>
            <Text style={[styles.tenantName, isInactiveTenant && styles.tenantNameInactive]} numberOfLines={1}>
              {item.tenantName || 'Bilinmiyor'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={12} color={status.text} />
            <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
          </View>
        </View>

        {/* Row 2: Date & Time */}
        <View style={styles.dateTimeSection}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            {relativeDay && (
              <View style={styles.relativeDayBadge}>
                <Text style={styles.relativeDayText}>{relativeDay}</Text>
              </View>
            )}
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={14} color="#059669" />
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
        </View>

        {/* Row 3: Service • Staff • Duration */}
        <View style={styles.serviceRow}>
          <Text style={styles.serviceText} numberOfLines={1}>
            <Text style={styles.serviceHighlight}>{item.serviceName}</Text>
            <Text style={styles.serviceDot}>  ·  </Text>
            <Text>{item.staffName}</Text>
            <Text style={styles.serviceDot}>  ·  </Text>
            <Text>{item.duration} dk</Text>
          </Text>
        </View>

        {/* Row 4: Price + Cancel */}
        <View style={styles.footerRow}>
          <Text style={styles.footerPrice}>{item.price} ₺</Text>
          {canCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelAppointment(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle-outline" size={14} color="#DC2626" />
              <Text style={styles.cancelButtonText}>İptal Et</Text>
            </TouchableOpacity>
          )}
        </View>
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

        {/* Search + Sort Row */}
        <View style={styles.searchSortRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={15} color="rgba(255,255,255,0.6)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Ara..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={14} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'date_desc' && styles.sortChipActive]}
            onPress={() => setSortBy(sortBy === 'date_asc' ? 'date_desc' : 'date_asc')}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-vertical-outline" size={13} color={sortBy === 'date_desc' ? '#fff' : 'rgba(255,255,255,0.6)'} />
            <Text style={[styles.sortChipText, sortBy === 'date_desc' && styles.sortChipTextActive]}>
              {sortBy === 'date_asc' ? '↑' : '↓'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortChip, selectedDate !== null && styles.sortChipActive]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={13} color={selectedDate ? '#fff' : 'rgba(255,255,255,0.6)'} />
            {selectedDate ? (
              <Text style={[styles.sortChipText, styles.sortChipTextActive]}>
                {formatSelectedDate(selectedDate)}
              </Text>
            ) : null}
          </TouchableOpacity>
          {selectedDate && (
            <TouchableOpacity onPress={clearDateFilter} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={selectedDate || new Date()}
              mode="date"
              display={IS_IOS ? 'compact' : 'default'}
              onChange={handleDateChange}
              locale="tr-TR"
              themeVariant="dark"
            />
            {IS_IOS && (
              <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.datePickerDone}>
                <Text style={styles.datePickerDoneText}>Tamam</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
              onRefresh={() => fetchAppointments(false, true)}
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
  searchSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
    padding: 0,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    gap: 3,
  },
  sortChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  sortChipTextActive: {
    color: '#fff',
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  datePickerDone: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  datePickerDoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
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
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
    gap: 4,
  },
  tenantBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tenantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tenantRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  tenantIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  tenantNameInactive: {
    color: '#9CA3AF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateTimeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  relativeDayBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  relativeDayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  serviceRow: {
    marginBottom: 6,
  },
  serviceText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  serviceHighlight: {
    color: '#1F2937',
    fontWeight: '600',
  },
  serviceDot: {
    color: '#D1D5DB',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  footerPrice: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '700',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    gap: 4,
  },
  cancelButtonText: {
    fontSize: 12,
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
