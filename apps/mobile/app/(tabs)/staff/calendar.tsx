import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
  Alert,
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
const DAY_WIDTH = (SCREEN_WIDTH - 32) / 7;

// Status configurations
const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706', label: 'Beklemede' },
  scheduled: { bg: '#DBEAFE', text: '#2563EB', label: 'Planlandı' },
  confirmed: { bg: '#D1FAE5', text: '#059669', label: 'Onaylandı' },
  completed: { bg: '#DBEAFE', text: '#2563EB', label: 'Tamamlandı' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'İptal' },
  no_show: { bg: '#FFEDD5', text: '#EA580C', label: 'Gelmedi' },
};

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

type ViewType = 'month' | 'week' | 'day';

export default function CalendarScreen() {
  const router = useRouter();
  const { selectedTenant } = useAuthStore();

  // State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch appointments
  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const response = await appointmentService.getStaffAppointments();
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [])
  );

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: string) => {
    return appointments.filter((apt) => apt.date === date);
  };

  // Navigate dates
  const navigateDate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get calendar days for month view
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];

    // Get the day of week for the first day (0 = Sunday, adjust for Monday start)
    let startPadding = firstDay.getDay() - 1;
    if (startPadding < 0) startPadding = 6;

    // Add padding for days before the month starts
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Get week days
  const getWeekDays = () => {
    const days: Date[] = [];
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Get time slots for day view
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  // Format date for comparison
  const formatDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Check if date is today
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return formatDateString(date) === formatDateString(today);
  };

  // Handle WhatsApp
  const handleSendWhatsApp = async (appointment: Appointment) => {
    try {
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
  };

  // Handle phone call
  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  // Render view type tabs
  const renderViewTabs = () => (
    <View style={styles.viewTabs}>
      {(['month', 'week', 'day'] as ViewType[]).map((type) => (
        <TouchableOpacity
          key={type}
          style={[styles.viewTab, viewType === type && styles.viewTabActive]}
          onPress={() => setViewType(type)}
        >
          <Text style={[styles.viewTabText, viewType === type && styles.viewTabTextActive]}>
            {type === 'month' ? 'Ay' : type === 'week' ? 'Hafta' : 'Gün'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render month view
  const renderMonthView = () => {
    const days = getMonthDays();

    return (
      <View style={styles.monthContainer}>
        {/* Weekday headers */}
        <View style={styles.weekdayHeader}>
          {WEEKDAYS.map((day) => (
            <View key={day} style={styles.weekdayCell}>
              <Text style={styles.weekdayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.monthGrid}>
          {days.map((day, index) => {
            if (!day) {
              return <View key={`empty-${index}`} style={styles.dayCell} />;
            }

            const dateStr = formatDateString(day);
            const dayAppointments = getAppointmentsForDate(dateStr);
            const todayStyle = isToday(day);

            return (
              <TouchableOpacity
                key={dateStr}
                style={[styles.dayCell, todayStyle && styles.dayCellToday]}
                onPress={() => {
                  setCurrentDate(day);
                  setViewType('day');
                }}
              >
                <Text style={[styles.dayNumber, todayStyle && styles.dayNumberToday]}>
                  {day.getDate()}
                </Text>
                {dayAppointments.length > 0 && (
                  <View style={styles.dayAppointmentsBadge}>
                    <Text style={styles.dayAppointmentsCount}>
                      {dayAppointments.length}
                    </Text>
                  </View>
                )}
                {dayAppointments.slice(0, 2).map((apt, i) => (
                  <View
                    key={apt.id}
                    style={[
                      styles.miniAppointment,
                      { backgroundColor: STATUS_CONFIG[apt.status]?.bg || '#E5E7EB' },
                    ]}
                  >
                    <Text style={styles.miniAppointmentTime} numberOfLines={1}>
                      {apt.time.substring(0, 5)}
                    </Text>
                  </View>
                ))}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const days = getWeekDays();

    return (
      <ScrollView style={styles.weekContainer} showsVerticalScrollIndicator={false}>
        {/* Weekday headers */}
        <View style={styles.weekHeader}>
          {days.map((day, index) => {
            const todayStyle = isToday(day);
            return (
              <View key={index} style={[styles.weekDayHeader, todayStyle && styles.weekDayHeaderToday]}>
                <Text style={[styles.weekDayName, todayStyle && styles.weekDayNameToday]}>
                  {WEEKDAYS[index]}
                </Text>
                <Text style={[styles.weekDayNum, todayStyle && styles.weekDayNumToday]}>
                  {day.getDate()}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Week grid */}
        <View style={styles.weekGrid}>
          {days.map((day, index) => {
            const dateStr = formatDateString(day);
            const dayAppointments = getAppointmentsForDate(dateStr);
            const todayStyle = isToday(day);

            return (
              <TouchableOpacity
                key={index}
                style={[styles.weekDayColumn, todayStyle && styles.weekDayColumnToday]}
                onPress={() => {
                  setCurrentDate(day);
                  setViewType('day');
                }}
              >
                {dayAppointments.length === 0 ? (
                  <Text style={styles.noAppointmentsText}>-</Text>
                ) : (
                  dayAppointments.slice(0, 5).map((apt) => (
                    <TouchableOpacity
                      key={apt.id}
                      style={[
                        styles.weekAppointment,
                        { backgroundColor: STATUS_CONFIG[apt.status]?.bg || '#E5E7EB' },
                      ]}
                      onPress={() => {
                        setSelectedAppointment(apt);
                        setShowDetailModal(true);
                      }}
                    >
                      <Text style={styles.weekAppointmentTime}>{apt.time.substring(0, 5)}</Text>
                      <Text style={styles.weekAppointmentName} numberOfLines={1}>
                        {apt.customerName}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
                {dayAppointments.length > 5 && (
                  <Text style={styles.moreText}>+{dayAppointments.length - 5}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  // Render day view
  const renderDayView = () => {
    const timeSlots = getTimeSlots();
    const dateStr = formatDateString(currentDate);
    const dayAppointments = getAppointmentsForDate(dateStr);

    return (
      <ScrollView style={styles.dayContainer} showsVerticalScrollIndicator={false}>
        {timeSlots.map((time) => {
          const hour = parseInt(time.split(':')[0]);
          const slotAppointments = dayAppointments.filter((apt) => {
            const aptHour = parseInt(apt.time.split(':')[0]);
            return aptHour === hour;
          });

          return (
            <View key={time} style={styles.timeSlot}>
              <View style={styles.timeLabel}>
                <Text style={styles.timeLabelText}>{time}</Text>
              </View>
              <View style={styles.slotContent}>
                {slotAppointments.length === 0 ? (
                  <View style={styles.emptySlot} />
                ) : (
                  slotAppointments.map((apt) => (
                    <TouchableOpacity
                      key={apt.id}
                      style={[
                        styles.dayAppointment,
                        { borderLeftColor: STATUS_CONFIG[apt.status]?.text || '#6B7280' },
                      ]}
                      onPress={() => {
                        setSelectedAppointment(apt);
                        setShowDetailModal(true);
                      }}
                    >
                      <View style={styles.dayAptHeader}>
                        <Text style={styles.dayAptTime}>
                          {apt.time.substring(0, 5)} - {apt.duration} dk
                        </Text>
                        <View
                          style={[
                            styles.dayAptStatus,
                            { backgroundColor: STATUS_CONFIG[apt.status]?.bg || '#E5E7EB' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayAptStatusText,
                              { color: STATUS_CONFIG[apt.status]?.text || '#6B7280' },
                            ]}
                          >
                            {STATUS_CONFIG[apt.status]?.label || apt.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.dayAptCustomer}>{apt.customerName}</Text>
                      <Text style={styles.dayAptService}>{apt.serviceName}</Text>
                      {apt.staffName && (
                        <Text style={styles.dayAptStaff}>
                          <Ionicons name="person-outline" size={12} color="#9CA3AF" />{' '}
                          {apt.staffName}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  // Render detail modal
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
                <Text style={[styles.statusBannerText, { color: status.text }]}>
                  {status.label}
                </Text>
              </View>

              {/* Date & Time */}
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="calendar" size={20} color="#3B82F6" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Tarih & Saat</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedAppointment.date).toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </Text>
                  <Text style={styles.detailSubValue}>
                    {selectedAppointment.time.substring(0, 5)} - {selectedAppointment.duration} dk
                  </Text>
                </View>
              </View>

              {/* Customer */}
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
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
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Service */}
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="cut" size={20} color="#3B82F6" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Hizmet</Text>
                  <Text style={styles.detailValue}>{selectedAppointment.serviceName}</Text>
                  <Text style={styles.priceValue}>
                    {selectedAppointment.price?.toLocaleString('tr-TR')} ₺
                  </Text>
                </View>
              </View>

              {/* Staff */}
              {selectedAppointment.staffName && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="people" size={20} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Personel</Text>
                    <Text style={styles.detailValue}>{selectedAppointment.staffName}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => {
                  setShowDetailModal(false);
                  router.push(`/appointment/edit?id=${selectedAppointment.id}`);
                }}
              >
                <Ionicons name="create-outline" size={20} color="#059669" />
                <Text style={styles.editBtnText}>Düzenle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Format header date
  const getHeaderTitle = () => {
    if (viewType === 'month') {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (viewType === 'week') {
      const weekDays = getWeekDays();
      const startMonth = MONTHS[weekDays[0].getMonth()];
      const endMonth = MONTHS[weekDays[6].getMonth()];
      if (startMonth === endMonth) {
        return `${weekDays[0].getDate()} - ${weekDays[6].getDate()} ${startMonth}`;
      }
      return `${weekDays[0].getDate()} ${startMonth} - ${weekDays[6].getDate()} ${endMonth}`;
    } else {
      return currentDate.toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setDrawerOpen(true)}>
            <Ionicons name="menu" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Takvim</Text>
            <Text style={styles.subtitle}>{selectedTenant?.businessName}</Text>
          </View>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/(tabs)/staff/appointments')}
          >
            <Ionicons name="list" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* View tabs */}
        {renderViewTabs()}

        {/* Date navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigateDate(-1)}>
            <Ionicons name="chevron-back" size={24} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateTitle} onPress={goToToday}>
            <Text style={styles.dateTitleText}>{getHeaderTitle()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigateDate(1)}>
            <Ionicons name="chevron-forward" size={24} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.todayBtn} onPress={goToToday}>
            <Text style={styles.todayBtnText}>Bugün</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : (
        <View style={styles.calendarContent}>
          {viewType === 'month' && renderMonthView()}
          {viewType === 'week' && renderWeekView()}
          {viewType === 'day' && renderDayView()}
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/appointment/new')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Detail Modal */}
      {renderDetailModal()}

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
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewTabs: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
  },
  viewTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  viewTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  viewTabTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTitle: {
    flex: 1,
    alignItems: 'center',
  },
  dateTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  todayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  todayBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
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
  calendarContent: {
    flex: 1,
  },

  // Month view
  monthContainer: {
    flex: 1,
    padding: 16,
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    width: DAY_WIDTH,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: DAY_WIDTH,
    minHeight: 70,
    padding: 4,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  dayCellToday: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 1,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  dayNumberToday: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  dayAppointmentsBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  dayAppointmentsCount: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  miniAppointment: {
    marginTop: 2,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  miniAppointmentTime: {
    fontSize: 9,
    fontWeight: '500',
    color: '#374151',
  },

  // Week view
  weekContainer: {
    flex: 1,
    padding: 16,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  weekDayHeaderToday: {
    backgroundColor: '#3B82F6',
  },
  weekDayName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  weekDayNameToday: {
    color: '#BFDBFE',
  },
  weekDayNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  weekDayNumToday: {
    color: '#fff',
  },
  weekGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  weekDayColumn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 6,
    minHeight: 200,
  },
  weekDayColumnToday: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  noAppointmentsText: {
    textAlign: 'center',
    color: '#D1D5DB',
    fontSize: 12,
    paddingVertical: 20,
  },
  weekAppointment: {
    padding: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  weekAppointmentTime: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  weekAppointmentName: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 1,
  },
  moreText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },

  // Day view
  dayContainer: {
    flex: 1,
    padding: 16,
  },
  timeSlot: {
    flexDirection: 'row',
    minHeight: 60,
    marginBottom: 8,
  },
  timeLabel: {
    width: 50,
    paddingTop: 4,
  },
  timeLabelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  slotContent: {
    flex: 1,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
    paddingLeft: 12,
    minHeight: 50,
  },
  emptySlot: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayAppointment: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dayAptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayAptTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  dayAptStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dayAptStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  dayAptCustomer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  dayAptService: {
    fontSize: 13,
    color: '#6B7280',
  },
  dayAptStaff: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
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
    fontSize: 18,
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
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 10,
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 14,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  detailSubValue: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginTop: 4,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    gap: 6,
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    gap: 8,
  },
  editBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
});
