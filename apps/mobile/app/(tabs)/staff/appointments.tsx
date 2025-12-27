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
  TextInput,
  ScrollView,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/auth.store';
import { appointmentService } from '../../../src/services/appointment.service';
import { Appointment, AppointmentStatus } from '../../../src/types';
import DrawerMenu from '../../../src/components/DrawerMenu';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Status configurations
const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  all: { bg: '#F3F4F6', text: '#374151', label: 'Tümü', icon: 'list' },
  pending: { bg: '#FEF3C7', text: '#D97706', label: 'Beklemede', icon: 'time-outline' },
  scheduled: { bg: '#DBEAFE', text: '#2563EB', label: 'Planlandı', icon: 'calendar-outline' },
  confirmed: { bg: '#D1FAE5', text: '#059669', label: 'Onaylandı', icon: 'checkmark-circle-outline' },
  completed: { bg: '#DBEAFE', text: '#2563EB', label: 'Tamamlandı', icon: 'checkmark-done-outline' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'İptal', icon: 'close-circle-outline' },
  no_show: { bg: '#FFEDD5', text: '#EA580C', label: 'Gelmedi', icon: 'alert-circle-outline' },
};

const STATUS_OPTIONS: { status: AppointmentStatus; label: string; color: string; icon: string }[] = [
  { status: 'confirmed', label: 'Onayla', color: '#059669', icon: 'checkmark-circle' },
  { status: 'completed', label: 'Tamamlandı', color: '#2563EB', icon: 'checkmark-done' },
  { status: 'cancelled', label: 'İptal Et', color: '#DC2626', icon: 'close-circle' },
  { status: 'no_show', label: 'Gelmedi', color: '#EA580C', icon: 'alert-circle' },
];

const FILTER_TABS = ['all', 'pending', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];

export default function StaffAppointmentsScreen() {
  const router = useRouter();
  const { selectedTenant, user } = useAuthStore();

  // State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(''); // Empty means all dates
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

    // Apply date filter
    if (selectedDate) {
      result = result.filter((apt) => apt.date === selectedDate);
    }

    // Apply status filter
    if (activeFilter !== 'all') {
      result = result.filter((apt) => apt.status === activeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (apt) =>
          apt.customerName?.toLowerCase().includes(query) ||
          apt.customerPhone?.includes(query) ||
          apt.serviceName?.toLowerCase().includes(query) ||
          apt.staffName?.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first) and time
    return result.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [appointments, selectedDate, activeFilter, searchQuery]);

  // Get appointment counts by status
  const statusCounts = useMemo(() => {
    let result = appointments || [];

    // Apply date filter for counts too
    if (selectedDate) {
      result = result.filter((apt) => apt.date === selectedDate);
    }

    return {
      all: result.length,
      pending: result.filter((apt) => apt.status === 'pending').length,
      scheduled: result.filter((apt) => apt.status === 'scheduled').length,
      confirmed: result.filter((apt) => apt.status === 'confirmed').length,
      completed: result.filter((apt) => apt.status === 'completed').length,
      cancelled: result.filter((apt) => apt.status === 'cancelled').length,
      no_show: result.filter((apt) => apt.status === 'no_show').length,
    };
  }, [appointments, selectedDate]);

  // Handle status change
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

  // Handle WhatsApp send
  const handleSendWhatsApp = async (appointment: Appointment) => {
    Alert.alert(
      'WhatsApp Gönder',
      `${appointment.customerName} müşterisine WhatsApp mesajı gönderilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Gönder',
          onPress: async () => {
            try {
              // Format message
              const message = `Merhaba ${appointment.customerName}, ${appointment.date} tarihinde saat ${appointment.time}'de ${appointment.serviceName} randevunuz bulunmaktadır. ${selectedTenant?.businessName}`;
              const phone = appointment.customerPhone.replace(/\D/g, '');
              const url = `whatsapp://send?phone=90${phone}&text=${encodeURIComponent(message)}`;

              const canOpen = await Linking.canOpenURL(url);
              if (canOpen) {
                await Linking.openURL(url);
              } else {
                Alert.alert('Hata', 'WhatsApp uygulaması bulunamadı');
              }
            } catch (error) {
              Alert.alert('Hata', 'WhatsApp açılamadı');
            }
          },
        },
      ]
    );
  };

  // Handle phone call
  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  // Handle delete
  const handleDelete = async (appointment: Appointment) => {
    Alert.alert(
      'Randevuyu Sil',
      `${appointment.customerName} müşterisinin randevusunu silmek istediğinize emin misiniz?`,
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

  // Set today's date
  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  };

  // Clear date filter
  const clearDateFilter = () => {
    setSelectedDate('');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Tüm Tarihler';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) return 'Bugün';
    if (dateString === tomorrow.toISOString().split('T')[0]) return 'Yarın';
    if (dateString === yesterday.toISOString().split('T')[0]) return 'Dün';

    return date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  // Format time
  const formatTime = (time: string) => time.substring(0, 5);

  // Render stats cards
  const renderStatsCards = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.statsContainer}
    >
      <View style={[styles.statCard, { backgroundColor: '#3B82F6' }]}>
        <View style={styles.statIconWrapper}>
          <Ionicons name="calendar" size={24} color="#fff" />
        </View>
        <Text style={[styles.statValue, { color: '#fff' }]}>{statusCounts.all}</Text>
        <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.8)' }]}>Toplam</Text>
      </View>
      <View style={styles.statCard}>
        <View style={[styles.statIconWrapper, { backgroundColor: '#D1FAE5' }]}>
          <Ionicons name="checkmark-circle" size={24} color="#059669" />
        </View>
        <Text style={styles.statValue}>{statusCounts.scheduled + statusCounts.confirmed}</Text>
        <Text style={styles.statLabel}>Planlandı</Text>
      </View>
      <View style={styles.statCard}>
        <View style={[styles.statIconWrapper, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="time" size={24} color="#D97706" />
        </View>
        <Text style={styles.statValue}>{statusCounts.pending}</Text>
        <Text style={styles.statLabel}>Beklemede</Text>
      </View>
      <View style={styles.statCard}>
        <View style={[styles.statIconWrapper, { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="close-circle" size={24} color="#DC2626" />
        </View>
        <Text style={styles.statValue}>{statusCounts.cancelled}</Text>
        <Text style={styles.statLabel}>İptal</Text>
      </View>
    </ScrollView>
  );

  // Render filter tabs
  const renderFilterTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterTabsContent}
    >
      {FILTER_TABS.map((filter) => {
        const config = STATUS_CONFIG[filter];
        const count = statusCounts[filter as keyof typeof statusCounts] || 0;
        const isActive = activeFilter === filter;

        return (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              isActive && { backgroundColor: config.bg, borderColor: config.text },
            ]}
            onPress={() => setActiveFilter(filter)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={config.icon as any}
              size={14}
              color={isActive ? config.text : '#9CA3AF'}
            />
            <Text
              style={[
                styles.filterTabText,
                isActive && { color: config.text, fontWeight: '600' },
              ]}
            >
              {config.label}
            </Text>
            <View
              style={[
                styles.filterTabBadge,
                isActive && { backgroundColor: config.text },
              ]}
            >
              <Text
                style={[
                  styles.filterTabBadgeText,
                  isActive && { color: '#fff' },
                ]}
              >
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // Render search bar
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputWrapper}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Müşteri, telefon veya hizmet ara..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Render appointment card
  const renderAppointment = ({ item }: { item: Appointment }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const isToday = item.date === new Date().toISOString().split('T')[0];
    const isPast = new Date(item.date) < new Date(new Date().toISOString().split('T')[0]);

    return (
      <TouchableOpacity
        style={[styles.appointmentCard, isPast && styles.appointmentCardPast]}
        onPress={() => {
          setSelectedAppointment(item);
          setShowDetailModal(true);
        }}
        activeOpacity={0.7}
      >
        {/* Time indicator */}
        <View style={[styles.timeIndicator, { backgroundColor: status.text }]} />

        <View style={styles.cardBody}>
          {/* Date badge for non-filtered view */}
          {!selectedDate && (
            <View style={styles.dateBadgeRow}>
              <View style={[styles.dateBadge, isToday && styles.dateBadgeToday]}>
                <Text style={[styles.dateBadgeText, isToday && styles.dateBadgeTextToday]}>
                  {formatDate(item.date)}
                </Text>
              </View>
            </View>
          )}

          {/* Header row */}
          <View style={styles.cardHeader}>
            <View style={styles.timeSection}>
              <Text style={styles.aptTime}>{formatTime(item.time)}</Text>
              <Text style={styles.aptDuration}>{item.duration} dk</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Ionicons name={status.icon as any} size={12} color={status.text} />
              <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
            </View>
          </View>

          {/* Customer info */}
          <View style={styles.customerSection}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                {item.customerName?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName} numberOfLines={1}>
                {item.customerName}
              </Text>
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={12} color="#6B7280" />
                <Text style={styles.customerPhone}>{item.customerPhone}</Text>
              </View>
            </View>
            {/* Quick actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => handleCall(item.customerPhone)}
              >
                <Ionicons name="call" size={18} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: '#D1FAE5' }]}
                onPress={() => handleSendWhatsApp(item)}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#059669" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Service info */}
          <View style={styles.serviceSection}>
            <View style={styles.serviceRow}>
              <Ionicons name="cut-outline" size={14} color="#6B7280" />
              <Text style={styles.serviceName} numberOfLines={1}>
                {item.serviceName}
              </Text>
            </View>
            <Text style={styles.priceText}>{item.price?.toLocaleString('tr-TR')} ₺</Text>
          </View>

          {/* Staff info */}
          {item.staffName && (
            <View style={styles.staffSection}>
              <Ionicons name="person-outline" size={12} color="#9CA3AF" />
              <Text style={styles.staffName}>{item.staffName}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>Randevu bulunamadı</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Farklı bir arama terimi deneyin'
          : selectedDate
          ? 'Bu tarihte randevu bulunmuyor'
          : 'Henüz randevu eklenmemiş'}
      </Text>
      {selectedDate && (
        <TouchableOpacity style={styles.clearFilterBtn} onPress={clearDateFilter}>
          <Text style={styles.clearFilterText}>Tüm Randevuları Göster</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render date picker modal
  const renderDatePickerModal = () => {
    const dates: string[] = [];
    const today = new Date();
    // 30 days before and 30 days after
    for (let i = -30; i <= 30; i++) {
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tarih Seçin</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.allDatesBtn}
              onPress={() => {
                clearDateFilter();
                setShowDatePicker(false);
              }}
            >
              <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
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
                    style={[
                      styles.datePickerItem,
                      isSelected && styles.datePickerItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedDate(item);
                      setShowDatePicker(false);
                    }}
                  >
                    <View>
                      <Text
                        style={[
                          styles.datePickerItemText,
                          isSelected && styles.datePickerItemTextSelected,
                        ]}
                      >
                        {new Date(item).toLocaleDateString('tr-TR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </Text>
                      {isToday && (
                        <Text style={styles.todayLabel}>Bugün</Text>
                      )}
                    </View>
                    {aptCount > 0 && (
                      <View style={[styles.datePickerBadge, isSelected && styles.datePickerBadgeSelected]}>
                        <Text style={[styles.datePickerBadgeText, isSelected && { color: '#fff' }]}>
                          {aptCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
              initialScrollIndex={30}
              getItemLayout={(data, index) => ({
                length: 60,
                offset: 60 * index,
                index,
              })}
            />
          </View>
        </View>
      </Modal>
    );
  };

  // Render appointment detail modal
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
          <View style={styles.detailModalContent}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Randevu Detayı</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetailModal(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Status banner */}
              <View style={[styles.statusBanner, { backgroundColor: status.bg }]}>
                <Ionicons name={status.icon as any} size={20} color={status.text} />
                <Text style={[styles.statusBannerText, { color: status.text }]}>
                  {status.label}
                </Text>
              </View>

              {/* Date & Time */}
              <View style={styles.detailSection}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconWrapper}>
                    <Ionicons name="calendar" size={20} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Tarih & Saat</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedAppointment.date).toLocaleDateString('tr-TR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.detailSubValue}>
                      {formatTime(selectedAppointment.time)} - {selectedAppointment.duration} dakika
                    </Text>
                  </View>
                </View>
              </View>

              {/* Customer */}
              <View style={styles.detailSection}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconWrapper}>
                    <Ionicons name="person" size={20} color="#3B82F6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Müşteri</Text>
                    <Text style={styles.detailValue}>{selectedAppointment.customerName}</Text>
                    <View style={styles.contactButtons}>
                      <TouchableOpacity
                        style={styles.contactBtn}
                        onPress={() => handleCall(selectedAppointment.customerPhone)}
                      >
                        <Ionicons name="call" size={16} color="#3B82F6" />
                        <Text style={styles.contactBtnText}>{selectedAppointment.customerPhone}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.contactBtn, { backgroundColor: '#D1FAE5' }]}
                        onPress={() => handleSendWhatsApp(selectedAppointment)}
                      >
                        <Ionicons name="logo-whatsapp" size={16} color="#059669" />
                        <Text style={[styles.contactBtnText, { color: '#059669' }]}>WhatsApp</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Service */}
              <View style={styles.detailSection}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconWrapper}>
                    <Ionicons name="cut" size={20} color="#3B82F6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Hizmet</Text>
                    <Text style={styles.detailValue}>{selectedAppointment.serviceName}</Text>
                    <Text style={styles.priceValue}>
                      {selectedAppointment.price?.toLocaleString('tr-TR')} ₺
                    </Text>
                  </View>
                </View>
              </View>

              {/* Staff */}
              <View style={styles.detailSection}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconWrapper}>
                    <Ionicons name="people" size={20} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Personel</Text>
                    <Text style={styles.detailValue}>{selectedAppointment.staffName}</Text>
                  </View>
                </View>
              </View>

              {/* Notes */}
              {selectedAppointment.notes && (
                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconWrapper}>
                      <Ionicons name="document-text" size={20} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Notlar</Text>
                      <Text style={styles.detailValue}>{selectedAppointment.notes}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Payment */}
              <View style={styles.detailSection}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconWrapper}>
                    <Ionicons name="card" size={20} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Ödeme Tipi</Text>
                    <Text style={styles.detailValue}>
                      {selectedAppointment.paymentType === 'cash'
                        ? 'Nakit'
                        : selectedAppointment.paymentType === 'card'
                        ? 'Kart'
                        : 'Havale'}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Action buttons */}
            <View style={styles.detailActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  setShowDetailModal(false);
                  router.push(`/appointment/edit?id=${selectedAppointment.id}`);
                }}
              >
                <Ionicons name="create-outline" size={20} color="#059669" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.changeStatusButton}
                onPress={() => {
                  setShowDetailModal(false);
                  setTimeout(() => setShowStatusModal(true), 300);
                }}
              >
                <Ionicons name="swap-horizontal" size={20} color="#3B82F6" />
                <Text style={styles.changeStatusButtonText}>Durum Değiştir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(selectedAppointment)}
              >
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render status change modal
  const renderStatusModal = () => (
    <Modal
      visible={showStatusModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowStatusModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.statusModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Durum Değiştir</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowStatusModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {selectedAppointment && (
            <View style={styles.modalInfo}>
              <View style={styles.modalInfoRow}>
                <Ionicons name="person" size={16} color="#6B7280" />
                <Text style={styles.modalCustomer}>{selectedAppointment.customerName}</Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Ionicons name="cut-outline" size={16} color="#6B7280" />
                <Text style={styles.modalService}>
                  {selectedAppointment.serviceName} • {formatTime(selectedAppointment.time)}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.statusOptions}>
            {STATUS_OPTIONS.map((option) => {
              const isCurrentStatus = selectedAppointment?.status === option.status;

              return (
                <TouchableOpacity
                  key={option.status}
                  style={[
                    styles.statusOption,
                    isCurrentStatus && styles.statusOptionActive,
                  ]}
                  onPress={() => handleStatusChange(option.status)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.statusDot, { backgroundColor: option.color }]}>
                    <Ionicons name={option.icon as any} size={16} color="#fff" />
                  </View>
                  <Text style={styles.statusOptionText}>{option.label}</Text>
                  {isCurrentStatus && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Mevcut</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setDrawerOpen(true)}
          >
            <Ionicons name="menu" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Randevular</Text>
            <Text style={styles.subtitle}>{selectedTenant?.businessName}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/(tabs)/staff/calendar')}
            >
              <Ionicons name="calendar" size={22} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, showSearch && styles.headerButtonActive]}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Ionicons
                name={showSearch ? 'close' : 'search'}
                size={22}
                color={showSearch ? '#3B82F6' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
        {showSearch && renderSearchBar()}

        {/* Date selector */}
        <View style={styles.dateSelector}>
          <TouchableOpacity
            style={styles.dateSelectorBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
            <Text style={styles.dateSelectorText}>{formatDate(selectedDate)}</Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>
          {!selectedDate ? (
            <TouchableOpacity style={styles.todayBtn} onPress={setToday}>
              <Text style={styles.todayBtnText}>Bugün</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.clearBtn} onPress={clearDateFilter}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats cards */}
      {renderStatsCards()}

      {/* Filter tabs */}
      <View style={styles.filterTabs}>{renderFilterTabs()}</View>

      {/* Appointments list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
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
              tintColor="#3B82F6"
              colors={['#3B82F6']}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* FAB - New Appointment */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/appointment/new')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modals */}
      {renderDatePickerModal()}
      {renderDetailModal()}
      {renderStatusModal()}

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

  // Header
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonActive: {
    backgroundColor: '#EFF6FF',
  },

  // Search
  searchContainer: {
    marginTop: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },

  // Date selector
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  dateSelectorBtn: {
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
  todayBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
  },
  todayBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  clearBtn: {
    padding: 8,
  },

  // Stats
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    width: (SCREEN_WIDTH - 48) / 4,
    minWidth: 85,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  // Filter tabs
  filterTabs: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  filterTabText: {
    fontSize: 12,
    color: '#6B7280',
  },
  filterTabBadge: {
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 9,
    backgroundColor: '#E5E7EB',
  },
  filterTabBadgeText: {
    fontSize: 10,
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

  // Appointment card
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  appointmentCardPast: {
    opacity: 0.7,
  },
  timeIndicator: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  dateBadgeRow: {
    marginBottom: 10,
  },
  dateBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  dateBadgeToday: {
    backgroundColor: '#DBEAFE',
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  dateBadgeTextToday: {
    color: '#3B82F6',
  },
  cardHeader: {
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
    fontSize: 18,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  customerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  customerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  customerPhone: {
    fontSize: 12,
    color: '#6B7280',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  serviceName: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  staffSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  staffName: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  clearFilterBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  // Date picker modal
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
    marginBottom: 16,
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
  datePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  datePickerItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  datePickerItemText: {
    fontSize: 15,
    color: '#1F2937',
  },
  datePickerItemTextSelected: {
    fontWeight: '600',
    color: '#3B82F6',
  },
  todayLabel: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  datePickerBadge: {
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
  },
  datePickerBadgeSelected: {
    backgroundColor: '#3B82F6',
  },
  datePickerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },

  // Detail modal
  detailModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  statusBannerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  detailSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  detailSubValue: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginTop: 4,
  },
  detailActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  editButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeStatusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    gap: 8,
  },
  changeStatusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  deleteButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Status modal
  statusModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalInfo: {
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalService: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusOptions: {
    paddingHorizontal: 20,
    gap: 8,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 12,
  },
  statusOptionActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  statusDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
});
