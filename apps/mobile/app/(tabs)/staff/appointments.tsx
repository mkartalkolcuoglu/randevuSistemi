import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../../src/store/auth.store';
import { appointmentService } from '../../../src/services/appointment.service';
import { Appointment, AppointmentStatus } from '../../../src/types';
import DrawerMenu from '../../../src/components/DrawerMenu';
import Header from '../../../src/components/Header';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// HIG/Material Design compliant values
const IS_IOS = Platform.OS === 'ios';

// Status configurations with modern colors
const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: string; gradient: string[] }> = {
  all: { bg: '#F3F4F6', text: '#374151', label: 'Tümü', icon: 'apps', gradient: ['#6B7280', '#4B5563'] },
  pending: { bg: '#FEF3C7', text: '#D97706', label: 'Beklemede', icon: 'time', gradient: ['#F59E0B', '#D97706'] },
  scheduled: { bg: '#DBEAFE', text: '#2563EB', label: 'Planlandı', icon: 'calendar', gradient: ['#3B82F6', '#2563EB'] },
  confirmed: { bg: '#D1FAE5', text: '#059669', label: 'Onaylandı', icon: 'checkmark-circle', gradient: ['#10B981', '#059669'] },
  completed: { bg: '#E0E7FF', text: '#4F46E5', label: 'Tamamlandı', icon: 'checkmark-done', gradient: ['#6366F1', '#4F46E5'] },
  cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'İptal', icon: 'close-circle', gradient: ['#EF4444', '#DC2626'] },
  no_show: { bg: '#FFEDD5', text: '#EA580C', label: 'Gelmedi', icon: 'alert-circle', gradient: ['#F97316', '#EA580C'] },
};

const STATUS_OPTIONS: { status: AppointmentStatus; label: string; color: string; icon: string }[] = [
  { status: 'confirmed', label: 'Onayla', color: '#059669', icon: 'checkmark-circle' },
  { status: 'completed', label: 'Tamamlandı', color: '#4F46E5', icon: 'checkmark-done' },
  { status: 'cancelled', label: 'İptal Et', color: '#DC2626', icon: 'close-circle' },
  { status: 'no_show', label: 'Gelmedi', color: '#EA580C', icon: 'alert-circle' },
];

const FILTER_TABS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

export default function StaffAppointmentsScreen() {
  const router = useRouter();
  const { selectedTenant, user } = useAuthStore();

  // State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch appointments
  const fetchAppointments = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await appointmentService.getStaffAppointments();
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
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

  // Filter and search appointments
  const filteredAppointments = useMemo(() => {
    let result = appointments || [];

    if (selectedDate) {
      result = result.filter((apt) => apt.date === selectedDate);
    }

    if (activeFilter !== 'all') {
      result = result.filter((apt) => apt.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (apt) =>
          apt.customerName?.toLowerCase().includes(query) ||
          apt.customerPhone?.includes(query) ||
          apt.serviceName?.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [appointments, selectedDate, activeFilter, searchQuery]);

  // Get appointment counts
  const statusCounts = useMemo(() => {
    let result = appointments || [];
    if (selectedDate) {
      result = result.filter((apt) => apt.date === selectedDate);
    }
    return {
      all: result.length,
      pending: result.filter((apt) => apt.status === 'pending').length,
      confirmed: result.filter((apt) => apt.status === 'confirmed').length,
      completed: result.filter((apt) => apt.status === 'completed').length,
      cancelled: result.filter((apt) => apt.status === 'cancelled').length,
    };
  }, [appointments, selectedDate]);

  // Today's stats
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayApts = appointments.filter((apt) => apt.date === today);
    const revenue = todayApts
      .filter((apt) => apt.status === 'completed')
      .reduce((sum, apt) => sum + (apt.price || 0), 0);
    return {
      total: todayApts.length,
      completed: todayApts.filter((apt) => apt.status === 'completed').length,
      pending: todayApts.filter((apt) => apt.status === 'pending' || apt.status === 'confirmed').length,
      revenue,
    };
  }, [appointments]);

  const handleStatusChange = async (status: AppointmentStatus) => {
    if (!selectedAppointment) return;
    try {
      await appointmentService.updateAppointmentStatus(selectedAppointment.id, status);
      setShowStatusModal(false);
      setShowDetailModal(false);
      setSelectedAppointment(null);
      fetchAppointments();
      Alert.alert('Başarılı', 'Randevu durumu güncellendi');
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.message || 'Durum güncellenemedi');
    }
  };

  const handleSendWhatsApp = async (appointment: Appointment) => {
    const message = `Merhaba ${appointment.customerName}, ${appointment.date} tarihinde saat ${appointment.time}'de ${appointment.serviceName} randevunuz bulunmaktadır. ${selectedTenant?.businessName}`;
    const phone = appointment.customerPhone.replace(/\D/g, '');
    const url = `whatsapp://send?phone=90${phone}&text=${encodeURIComponent(message)}`;

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Hata', 'WhatsApp uygulaması bulunamadı');
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleDelete = async (appointment: Appointment) => {
    Alert.alert(
      'Randevuyu Sil',
      `${appointment.customerName} randevusunu silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await appointmentService.deleteAppointment(appointment.id);
              fetchAppointments();
              setShowDetailModal(false);
              Alert.alert('Başarılı', 'Randevu silindi');
            } catch (error: any) {
              Alert.alert('Hata', error.response?.data?.message || 'Randevu silinemedi');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Tüm Tarihler';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (dateString === today.toISOString().split('T')[0]) return 'Bugün';
    if (dateString === tomorrow.toISOString().split('T')[0]) return 'Yarın';

    return date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (time: string) => time.substring(0, 5);

  // Render Header
  const renderHeader = () => (
    <Header
      title="Randevular"
      subtitle={selectedTenant?.businessName}
      onMenuPress={() => setDrawerOpen(true)}
      showCalendar
      onCalendarPress={() => router.push('/(tabs)/staff/calendar')}
      showSearch
      searchActive={showSearch}
      onSearchPress={() => setShowSearch(!showSearch)}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Müşteri, telefon veya hizmet ara..."
      gradientColors={['#163974', '#1e4a8f']}
      stats={[
        {
          icon: 'calendar',
          iconColor: '#3B82F6',
          iconBg: '#EFF6FF',
          value: todayStats.total,
          label: 'Bugün',
        },
        {
          icon: 'checkmark',
          iconColor: '#059669',
          iconBg: '#D1FAE5',
          value: todayStats.completed,
          label: 'Tamam',
        },
        {
          icon: 'time',
          iconColor: '#D97706',
          iconBg: '#FEF3C7',
          value: todayStats.pending,
          label: 'Bekleyen',
        },
        {
          icon: 'cash',
          iconColor: '#4F46E5',
          iconBg: '#E0E7FF',
          value: todayStats.revenue,
          label: 'Kazanç ₺',
        },
      ]}
    />
  );

  // Render Date Selector
  const renderDateSelector = () => (
    <View style={styles.dateSelectorContainer}>
      <TouchableOpacity
        style={styles.dateSelector}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
        <Text style={styles.dateSelectorText}>{formatDate(selectedDate)}</Text>
        <Ionicons name="chevron-down" size={16} color="#6B7280" />
      </TouchableOpacity>
      {!selectedDate ? (
        <TouchableOpacity
          style={styles.todayChip}
          onPress={() => setSelectedDate(new Date().toISOString().split('T')[0])}
        >
          <Text style={styles.todayChipText}>Bugün</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.clearDateBtn}
          onPress={() => setSelectedDate('')}
        >
          <Ionicons name="close" size={18} color="#6B7280" />
        </TouchableOpacity>
      )}
    </View>
  );

  // Render Filter Pills
  const renderFilterPills = () => (
    <View style={styles.filterPillsWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterPillsContent}
      >
        {FILTER_TABS.map((filter, index) => {
          const config = STATUS_CONFIG[filter];
          const count = statusCounts[filter as keyof typeof statusCounts] || 0;
          const isActive = activeFilter === filter;

          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                isActive && { backgroundColor: config.bg, borderColor: config.text },
                index < FILTER_TABS.length - 1 && { marginRight: 8 },
              ]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={config.icon as any}
                size={14}
                color={isActive ? config.text : '#9CA3AF'}
              />
              <Text style={[styles.filterPillText, isActive && { color: config.text }]}>
                {config.label}
              </Text>
              <View style={[styles.filterPillBadge, isActive && { backgroundColor: config.text }]}>
                <Text style={[styles.filterPillBadgeText, isActive && { color: '#fff' }]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // Render Appointment Card - Compact Design
  const renderAppointment = ({ item }: { item: Appointment }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const isToday = item.date === new Date().toISOString().split('T')[0];

    return (
      <TouchableOpacity
        style={styles.appointmentCard}
        onPress={() => {
          setSelectedAppointment(item);
          setShowDetailModal(true);
        }}
        activeOpacity={0.7}
      >
        {/* Left accent bar */}
        <LinearGradient
          colors={status.gradient}
          style={styles.cardAccent}
        />

        <View style={styles.cardContent}>
          {/* Main Row - All info in one line */}
          <View style={styles.cardMainRow}>
            {/* Time */}
            <View style={styles.timeBox}>
              <Text style={styles.timeText}>{formatTime(item.time)}</Text>
            </View>

            {/* Customer & Service */}
            <View style={styles.cardMiddle}>
              <Text style={styles.customerName} numberOfLines={1}>{item.customerName}</Text>
              <Text style={styles.serviceName} numberOfLines={1}>{item.serviceName}</Text>
            </View>

            {/* Price & Status */}
            <View style={styles.cardRight}>
              <Text style={styles.priceTag}>{item.price?.toLocaleString('tr-TR')} ₺</Text>
              <View style={[styles.statusChip, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusChipText, { color: status.text }]}>{status.label}</Text>
              </View>
            </View>
          </View>

          {/* Bottom Row - Date badge & Quick Actions */}
          <View style={styles.cardBottomRow}>
            {!selectedDate ? (
              <View style={[styles.dateBadge, isToday && styles.dateBadgeToday]}>
                <Text style={[styles.dateBadgeText, isToday && styles.dateBadgeTextToday]}>
                  {formatDate(item.date)}
                </Text>
              </View>
            ) : (
              <Text style={styles.durationText}>{item.duration} dk</Text>
            )}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleCall(item.customerPhone)}
              >
                <Ionicons name="call" size={14} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.whatsappBtn]}
                onPress={() => handleSendWhatsApp(item)}
              >
                <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render Empty State
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['#EFF6FF', '#DBEAFE']}
        style={styles.emptyIconWrapper}
      >
        <Ionicons name="calendar-outline" size={48} color="#3B82F6" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>Randevu bulunamadı</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Farklı bir arama terimi deneyin' : 'Henüz randevu eklenmemiş'}
      </Text>
      <TouchableOpacity
        style={styles.emptyActionBtn}
        onPress={() => router.push('/appointment/new')}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.emptyActionText}>Yeni Randevu</Text>
      </TouchableOpacity>
    </View>
  );

  // Render Date Picker Modal
  const renderDatePickerModal = () => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = -14; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return (
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tarih Seçin</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.allDatesBtn}
              onPress={() => {
                setSelectedDate('');
                setShowDatePicker(false);
              }}
            >
              <Ionicons name="layers-outline" size={20} color="#3B82F6" />
              <Text style={styles.allDatesText}>Tüm Tarihleri Göster</Text>
            </TouchableOpacity>

            <FlatList
              data={dates}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = item === selectedDate;
                const isToday = item === today.toISOString().split('T')[0];
                const aptCount = appointments.filter((apt) => apt.date === item).length;

                return (
                  <TouchableOpacity
                    style={[styles.dateItem, isSelected && styles.dateItemSelected]}
                    onPress={() => {
                      setSelectedDate(item);
                      setShowDatePicker(false);
                    }}
                  >
                    <View>
                      <Text style={[styles.dateItemText, isSelected && styles.dateItemTextSelected]}>
                        {new Date(item).toLocaleDateString('tr-TR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </Text>
                      {isToday && <Text style={styles.todayTag}>Bugün</Text>}
                    </View>
                    {aptCount > 0 && (
                      <View style={[styles.dateItemBadge, isSelected && styles.dateItemBadgeSelected]}>
                        <Text style={[styles.dateItemBadgeText, isSelected && { color: '#fff' }]}>
                          {aptCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
              initialScrollIndex={14}
              getItemLayout={(_, index) => ({ length: 60, offset: 60 * index, index })}
            />
          </View>
        </View>
      </Modal>
    );
  };

  // Render Detail Modal
  const renderDetailModal = () => {
    if (!selectedAppointment) return null;
    const status = STATUS_CONFIG[selectedAppointment.status] || STATUS_CONFIG.pending;

    return (
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.modalHandle} />

            {/* Header */}
            <LinearGradient
              colors={status.gradient}
              style={styles.detailHeader}
            >
              <View style={styles.detailHeaderContent}>
                <View style={styles.detailStatusIcon}>
                  <Ionicons name={status.icon as any} size={24} color="#fff" />
                </View>
                <Text style={styles.detailStatusText}>{status.label}</Text>
              </View>
              <TouchableOpacity
                style={styles.detailCloseBtn}
                onPress={() => setShowDetailModal(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.detailContent}>
              {/* Date & Time */}
              <View style={styles.detailCard}>
                <View style={styles.detailCardIcon}>
                  <Ionicons name="calendar" size={20} color="#3B82F6" />
                </View>
                <View style={styles.detailCardContent}>
                  <Text style={styles.detailCardLabel}>Tarih & Saat</Text>
                  <Text style={styles.detailCardValue}>
                    {new Date(selectedAppointment.date).toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </Text>
                  <Text style={styles.detailCardSubValue}>
                    {formatTime(selectedAppointment.time)} • {selectedAppointment.duration} dakika
                  </Text>
                </View>
              </View>

              {/* Customer */}
              <View style={styles.detailCard}>
                <View style={[styles.detailCardIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="person" size={20} color="#059669" />
                </View>
                <View style={styles.detailCardContent}>
                  <Text style={styles.detailCardLabel}>Müşteri</Text>
                  <Text style={styles.detailCardValue}>{selectedAppointment.customerName}</Text>
                  <View style={styles.contactRow}>
                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => handleCall(selectedAppointment.customerPhone)}
                    >
                      <Ionicons name="call" size={14} color="#3B82F6" />
                      <Text style={styles.contactBtnText}>{selectedAppointment.customerPhone}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.contactBtn, { backgroundColor: '#D1FAE5' }]}
                      onPress={() => handleSendWhatsApp(selectedAppointment)}
                    >
                      <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                      <Text style={[styles.contactBtnText, { color: '#25D366' }]}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Service */}
              <View style={styles.detailCard}>
                <View style={[styles.detailCardIcon, { backgroundColor: '#E0E7FF' }]}>
                  <Ionicons name="cut" size={20} color="#4F46E5" />
                </View>
                <View style={styles.detailCardContent}>
                  <Text style={styles.detailCardLabel}>Hizmet</Text>
                  <Text style={styles.detailCardValue}>{selectedAppointment.serviceName}</Text>
                  <Text style={styles.priceValue}>{selectedAppointment.price?.toLocaleString('tr-TR')} ₺</Text>
                </View>
              </View>

              {/* Staff */}
              <View style={styles.detailCard}>
                <View style={[styles.detailCardIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="people" size={20} color="#D97706" />
                </View>
                <View style={styles.detailCardContent}>
                  <Text style={styles.detailCardLabel}>Personel</Text>
                  <Text style={styles.detailCardValue}>{selectedAppointment.staffName}</Text>
                </View>
              </View>

              {/* Notes */}
              {selectedAppointment.notes && (
                <View style={styles.detailCard}>
                  <View style={[styles.detailCardIcon, { backgroundColor: '#F3F4F6' }]}>
                    <Ionicons name="document-text" size={20} color="#6B7280" />
                  </View>
                  <View style={styles.detailCardContent}>
                    <Text style={styles.detailCardLabel}>Notlar</Text>
                    <Text style={styles.detailCardValue}>{selectedAppointment.notes}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View style={styles.detailActions}>
              <TouchableOpacity
                style={styles.detailActionBtn}
                onPress={() => {
                  setShowDetailModal(false);
                  router.push(`/appointment/edit?id=${selectedAppointment.id}`);
                }}
              >
                <Ionicons name="create-outline" size={22} color="#059669" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statusChangeBtn}
                onPress={() => {
                  setShowDetailModal(false);
                  setTimeout(() => setShowStatusModal(true), 300);
                }}
              >
                <Ionicons name="swap-horizontal" size={20} color="#fff" />
                <Text style={styles.statusChangeBtnText}>Durum Değiştir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.detailActionBtn, { backgroundColor: '#FEE2E2' }]}
                onPress={() => handleDelete(selectedAppointment)}
              >
                <Ionicons name="trash-outline" size={22} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render Status Modal
  const renderStatusModal = () => (
    <Modal
      visible={showStatusModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowStatusModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.statusModal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Durum Değiştir</Text>
            <TouchableOpacity onPress={() => setShowStatusModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {selectedAppointment && (
            <View style={styles.statusModalInfo}>
              <Text style={styles.statusModalCustomer}>{selectedAppointment.customerName}</Text>
              <Text style={styles.statusModalService}>
                {selectedAppointment.serviceName} • {formatTime(selectedAppointment.time)}
              </Text>
            </View>
          )}

          <View style={styles.statusOptions}>
            {STATUS_OPTIONS.map((option) => {
              const isCurrentStatus = selectedAppointment?.status === option.status;
              return (
                <TouchableOpacity
                  key={option.status}
                  style={[styles.statusOption, isCurrentStatus && styles.statusOptionCurrent]}
                  onPress={() => handleStatusChange(option.status)}
                >
                  <View style={[styles.statusOptionIcon, { backgroundColor: option.color }]}>
                    <Ionicons name={option.icon as any} size={18} color="#fff" />
                  </View>
                  <Text style={styles.statusOptionText}>{option.label}</Text>
                  {isCurrentStatus && (
                    <View style={styles.currentStatusBadge}>
                      <Text style={styles.currentStatusText}>Mevcut</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}

      <View style={styles.content}>
        {renderDateSelector()}
        {renderFilterPills()}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Yükleniyor...</Text>
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
                tintColor="#3B82F6"
                colors={['#3B82F6']}
              />
            }
            ListEmptyComponent={renderEmpty}
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/appointment/new')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#3B82F6', '#1E40AF']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {renderDatePickerModal()}
      {renderDetailModal()}
      {renderStatusModal()}

      <DrawerMenu isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Content
  content: {
    flex: 1,
  },

  // Date Selector
  dateSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  dateSelectorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  todayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
  },
  todayChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  clearDateBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter Pills
  filterPillsWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterPillsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    height: 36,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
  },
  filterPillBadge: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },

  // Loading
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

  // List
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Appointment Card - HIG/Material Design Compliant
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: IS_IOS ? 12 : 16, // iOS: 12pt, Android M3: 16dp
    marginBottom: IS_IOS ? 8 : 12,
    overflow: 'hidden',
    // Platform-specific shadows
    ...(IS_IOS ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
    } : {
      elevation: 2,
    }),
  },
  cardAccent: {
    width: IS_IOS ? 4 : 6,
  },
  cardContent: {
    flex: 1,
    paddingVertical: IS_IOS ? 10 : 12,
    paddingHorizontal: IS_IOS ? 12 : 16,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMiddle: {
    flex: 1,
    marginHorizontal: 10,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timeBox: {
    minWidth: 50,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  durationText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  dateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  dateBadgeToday: {
    backgroundColor: '#EFF6FF',
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  dateBadgeTextToday: {
    color: '#3B82F6',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappBtn: {
    backgroundColor: '#D1FAE5',
  },
  serviceName: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  priceTag: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  emptyActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // FAB - HIG/Material Design Compliant
  fab: {
    position: 'absolute',
    right: IS_IOS ? 20 : 16,
    bottom: IS_IOS ? 24 : 16,
    // Platform-specific shadows
    ...(IS_IOS ? {
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    } : {
      elevation: 8,
    }),
  },
  fabGradient: {
    width: IS_IOS ? 50 : 56, // iOS: 50pt, Android Material 3: 56dp
    height: IS_IOS ? 50 : 56,
    borderRadius: IS_IOS ? 25 : 16, // iOS: circular, Android M3: 16dp rounded
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },

  // Date Picker Modal
  datePickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  allDatesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    gap: 8,
  },
  allDatesText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dateItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  dateItemText: {
    fontSize: 15,
    color: '#1F2937',
  },
  dateItemTextSelected: {
    fontWeight: '600',
    color: '#3B82F6',
  },
  todayTag: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  dateItemBadge: {
    minWidth: 26,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 13,
  },
  dateItemBadgeSelected: {
    backgroundColor: '#3B82F6',
  },
  dateItemBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },

  // Detail Modal
  detailModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  detailHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailStatusIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailStatusText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  detailCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    padding: 20,
  },
  detailCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  detailCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCardContent: {
    flex: 1,
  },
  detailCardLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  detailCardValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  detailCardSubValue: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    gap: 6,
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3B82F6',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
    marginTop: 4,
  },
  detailActions: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailActionBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChangeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    gap: 8,
  },
  statusChangeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Status Modal
  statusModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  statusModalInfo: {
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  statusModalCustomer: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusModalService: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusOptions: {
    paddingHorizontal: 20,
    gap: 10,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    gap: 14,
  },
  statusOptionCurrent: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  statusOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  currentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  currentStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
});
