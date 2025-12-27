import { useState, useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../../src/store/auth.store';
import { appointmentService } from '../../../src/services/appointment.service';
import { Appointment } from '../../../src/types';
import DrawerMenu from '../../../src/components/DrawerMenu';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - 48) / 7;

// Status configurations with gradients
const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; gradient: [string, string] }> = {
  pending: { bg: '#FEF3C7', text: '#D97706', label: 'Beklemede', gradient: ['#FCD34D', '#F59E0B'] },
  scheduled: { bg: '#DBEAFE', text: '#2563EB', label: 'Planlandı', gradient: ['#60A5FA', '#3B82F6'] },
  confirmed: { bg: '#D1FAE5', text: '#059669', label: 'Onaylandı', gradient: ['#34D399', '#10B981'] },
  completed: { bg: '#DBEAFE', text: '#2563EB', label: 'Tamamlandı', gradient: ['#60A5FA', '#3B82F6'] },
  cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'İptal', gradient: ['#F87171', '#EF4444'] },
  no_show: { bg: '#FFEDD5', text: '#EA580C', label: 'Gelmedi', gradient: ['#FB923C', '#F97316'] },
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

    let startPadding = firstDay.getDay() - 1;
    if (startPadding < 0) startPadding = 6;

    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

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
    <View style={styles.viewTabsContainer}>
      <View style={styles.viewTabs}>
        {(['month', 'week', 'day'] as ViewType[]).map((type) => {
          const isActive = viewType === type;
          const icons = { month: 'calendar', week: 'calendar-outline', day: 'today' };
          return (
            <TouchableOpacity
              key={type}
              style={[styles.viewTab, isActive && styles.viewTabActive]}
              onPress={() => setViewType(type)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={icons[type] as any}
                size={16}
                color={isActive ? '#fff' : '#6B7280'}
              />
              <Text style={[styles.viewTabText, isActive && styles.viewTabTextActive]}>
                {type === 'month' ? 'Ay' : type === 'week' ? 'Hafta' : 'Gün'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // Render month view
  const renderMonthView = () => {
    const days = getMonthDays();

    return (
      <View style={styles.monthContainer}>
        {/* Weekday headers */}
        <View style={styles.weekdayHeader}>
          {WEEKDAYS.map((day, index) => (
            <View key={day} style={styles.weekdayCell}>
              <Text style={[
                styles.weekdayText,
                (index === 5 || index === 6) && styles.weekdayTextWeekend
              ]}>{day}</Text>
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
            const todayCheck = isToday(day);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.dayCell,
                  todayCheck && styles.dayCellToday,
                  isWeekend && styles.dayCellWeekend,
                ]}
                onPress={() => {
                  setCurrentDate(day);
                  setViewType('day');
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.dayNumberContainer, todayCheck && styles.dayNumberContainerToday]}>
                  <Text style={[
                    styles.dayNumber,
                    todayCheck && styles.dayNumberToday,
                    isWeekend && !todayCheck && styles.dayNumberWeekend,
                  ]}>
                    {day.getDate()}
                  </Text>
                </View>
                {dayAppointments.length > 0 && (
                  <View style={styles.appointmentDots}>
                    {dayAppointments.slice(0, 3).map((apt, i) => (
                      <View
                        key={apt.id}
                        style={[
                          styles.appointmentDot,
                          { backgroundColor: STATUS_CONFIG[apt.status]?.text || '#6B7280' },
                        ]}
                      />
                    ))}
                    {dayAppointments.length > 3 && (
                      <Text style={styles.moreDotsText}>+{dayAppointments.length - 3}</Text>
                    )}
                  </View>
                )}
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
      <View style={styles.weekContainer}>
        {/* Weekday headers */}
        <View style={styles.weekHeader}>
          {days.map((day, index) => {
            const todayCheck = isToday(day);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.weekDayHeader, todayCheck && styles.weekDayHeaderToday]}
                onPress={() => {
                  setCurrentDate(day);
                  setViewType('day');
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.weekDayName, todayCheck && styles.weekDayNameToday]}>
                  {WEEKDAYS[index]}
                </Text>
                <Text style={[styles.weekDayNum, todayCheck && styles.weekDayNumToday]}>
                  {day.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Week grid */}
        <ScrollView style={styles.weekScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.weekGrid}>
            {days.map((day, index) => {
              const dateStr = formatDateString(day);
              const dayAppointments = getAppointmentsForDate(dateStr);
              const todayCheck = isToday(day);

              return (
                <View
                  key={index}
                  style={[styles.weekDayColumn, todayCheck && styles.weekDayColumnToday]}
                >
                  {dayAppointments.length === 0 ? (
                    <View style={styles.emptyDayColumn}>
                      <Ionicons name="remove-outline" size={16} color="#D1D5DB" />
                    </View>
                  ) : (
                    dayAppointments.slice(0, 6).map((apt) => {
                      const status = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
                      return (
                        <TouchableOpacity
                          key={apt.id}
                          style={styles.weekAppointment}
                          onPress={() => {
                            setSelectedAppointment(apt);
                            setShowDetailModal(true);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.weekAptAccent, { backgroundColor: status.text }]} />
                          <View style={styles.weekAptContent}>
                            <Text style={styles.weekAppointmentTime}>{apt.time.substring(0, 5)}</Text>
                            <Text style={styles.weekAppointmentName} numberOfLines={1}>
                              {apt.customerName.split(' ')[0]}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                  {dayAppointments.length > 6 && (
                    <Text style={styles.moreText}>+{dayAppointments.length - 6}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render day view
  const renderDayView = () => {
    const timeSlots = getTimeSlots();
    const dateStr = formatDateString(currentDate);
    const dayAppointments = getAppointmentsForDate(dateStr);

    return (
      <ScrollView style={styles.dayContainer} showsVerticalScrollIndicator={false}>
        {/* Day summary */}
        <View style={styles.daySummary}>
          <View style={styles.daySummaryItem}>
            <Text style={styles.daySummaryNumber}>{dayAppointments.length}</Text>
            <Text style={styles.daySummaryLabel}>Randevu</Text>
          </View>
          <View style={styles.daySummaryDivider} />
          <View style={styles.daySummaryItem}>
            <Text style={styles.daySummaryNumber}>
              {dayAppointments.reduce((sum, apt) => sum + (apt.price || 0), 0).toLocaleString('tr-TR')} ₺
            </Text>
            <Text style={styles.daySummaryLabel}>Toplam</Text>
          </View>
        </View>

        {/* Time slots */}
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
                  slotAppointments.map((apt) => {
                    const status = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
                    return (
                      <TouchableOpacity
                        key={apt.id}
                        style={styles.dayAppointment}
                        onPress={() => {
                          setSelectedAppointment(apt);
                          setShowDetailModal(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={status.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.dayAptAccentBar}
                        />
                        <View style={styles.dayAptBody}>
                          <View style={styles.dayAptHeader}>
                            <Text style={styles.dayAptTime}>
                              {apt.time.substring(0, 5)}
                            </Text>
                            <View style={[styles.dayAptStatus, { backgroundColor: status.bg }]}>
                              <Text style={[styles.dayAptStatusText, { color: status.text }]}>
                                {status.label}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.dayAptCustomer}>{apt.customerName}</Text>
                          <View style={styles.dayAptFooter}>
                            <Text style={styles.dayAptService}>{apt.serviceName}</Text>
                            <Text style={styles.dayAptPrice}>{apt.price?.toLocaleString('tr-TR')} ₺</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
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
            <View style={styles.modalHandle} />

            {/* Header with gradient */}
            <LinearGradient
              colors={status.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalGradientHeader}
            >
              <View style={styles.modalHeaderContent}>
                <View>
                  <Text style={styles.modalStatusLabel}>{status.label}</Text>
                  <Text style={styles.modalHeaderTime}>
                    {selectedAppointment.time.substring(0, 5)} • {selectedAppointment.duration} dk
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowDetailModal(false)}
                >
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              {/* Date */}
              <View style={styles.detailCard}>
                <View style={styles.detailCardIcon}>
                  <Ionicons name="calendar" size={20} color="#3B82F6" />
                </View>
                <View style={styles.detailCardContent}>
                  <Text style={styles.detailCardLabel}>Tarih</Text>
                  <Text style={styles.detailCardValue}>
                    {new Date(selectedAppointment.date).toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </Text>
                </View>
              </View>

              {/* Customer */}
              <View style={styles.detailCard}>
                <View style={[styles.detailCardIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="person" size={20} color="#D97706" />
                </View>
                <View style={styles.detailCardContent}>
                  <Text style={styles.detailCardLabel}>Müşteri</Text>
                  <Text style={styles.detailCardValue}>{selectedAppointment.customerName}</Text>
                  <View style={styles.contactRow}>
                    <TouchableOpacity
                      style={styles.contactChip}
                      onPress={() => handleCall(selectedAppointment.customerPhone)}
                    >
                      <Ionicons name="call" size={14} color="#3B82F6" />
                      <Text style={styles.contactChipText}>{selectedAppointment.customerPhone}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.contactChip, styles.whatsappChip]}
                      onPress={() => handleSendWhatsApp(selectedAppointment)}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Service */}
              <View style={styles.detailCard}>
                <View style={[styles.detailCardIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="cut" size={20} color="#059669" />
                </View>
                <View style={styles.detailCardContent}>
                  <Text style={styles.detailCardLabel}>Hizmet</Text>
                  <Text style={styles.detailCardValue}>{selectedAppointment.serviceName}</Text>
                  <Text style={styles.priceText}>
                    {selectedAppointment.price?.toLocaleString('tr-TR')} ₺
                  </Text>
                </View>
              </View>

              {/* Staff */}
              {selectedAppointment.staffName && (
                <View style={styles.detailCard}>
                  <View style={[styles.detailCardIcon, { backgroundColor: '#E0E7FF' }]}>
                    <Ionicons name="people" size={20} color="#4F46E5" />
                  </View>
                  <View style={styles.detailCardContent}>
                    <Text style={styles.detailCardLabel}>Personel</Text>
                    <Text style={styles.detailCardValue}>{selectedAppointment.staffName}</Text>
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
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
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
      {/* Premium Header */}
      <LinearGradient
        colors={['#1E3A8A', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setDrawerOpen(true)}>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Takvim</Text>
            <Text style={styles.subtitle}>{selectedTenant?.businessName}</Text>
          </View>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/(tabs)/staff/appointments')}
          >
            <Ionicons name="list" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Date navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigateDate(-1)}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateTitle} onPress={goToToday}>
            <Text style={styles.dateTitleText}>{getHeaderTitle()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigateDate(1)}>
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.todayBtn} onPress={goToToday}>
            <Text style={styles.todayBtnText}>Bugün</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* View tabs */}
      {renderViewTabs()}

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
        <LinearGradient
          colors={['#3B82F6', '#1D4ED8']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    color: '#fff',
  },
  todayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
  },
  todayBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  viewTabsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  viewTabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  viewTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  viewTabActive: {
    backgroundColor: '#3B82F6',
  },
  viewTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  viewTabTextActive: {
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
  weekdayTextWeekend: {
    color: '#DC2626',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: DAY_WIDTH,
    height: 56,
    alignItems: 'center',
    paddingTop: 6,
    borderRadius: 8,
    marginBottom: 4,
  },
  dayCellToday: {
    backgroundColor: '#EFF6FF',
  },
  dayCellWeekend: {
    backgroundColor: '#FEF2F2',
  },
  dayNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberContainerToday: {
    backgroundColor: '#3B82F6',
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  dayNumberToday: {
    color: '#fff',
    fontWeight: '700',
  },
  dayNumberWeekend: {
    color: '#DC2626',
  },
  appointmentDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  appointmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreDotsText: {
    fontSize: 8,
    color: '#6B7280',
    marginLeft: 2,
  },

  // Week view
  weekContainer: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    marginHorizontal: 2,
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
  weekScrollView: {
    flex: 1,
  },
  weekGrid: {
    flexDirection: 'row',
    padding: 8,
    gap: 6,
  },
  weekDayColumn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 6,
    minHeight: 280,
  },
  weekDayColumnToday: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  emptyDayColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekAppointment: {
    flexDirection: 'row',
    marginBottom: 6,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  weekAptAccent: {
    width: 3,
  },
  weekAptContent: {
    flex: 1,
    padding: 6,
  },
  weekAppointmentTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
  },
  weekAppointmentName: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  moreText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },

  // Day view
  dayContainer: {
    flex: 1,
    padding: 16,
  },
  daySummary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  daySummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  daySummaryNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  daySummaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  daySummaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  timeSlot: {
    flexDirection: 'row',
    minHeight: 70,
    marginBottom: 4,
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
    minHeight: 60,
  },
  emptySlot: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayAppointment: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  dayAptAccentBar: {
    width: 4,
  },
  dayAptBody: {
    flex: 1,
    padding: 12,
  },
  dayAptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayAptTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  dayAptStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dayAptStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  dayAptCustomer: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  dayAptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayAptService: {
    fontSize: 13,
    color: '#6B7280',
  },
  dayAptPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    maxHeight: '80%',
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
  modalGradientHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalStatusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  modalHeaderTime: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
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
    marginBottom: 2,
  },
  detailCardValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginTop: 4,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    gap: 6,
  },
  contactChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  whatsappChip: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
  },
  modalActions: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    gap: 8,
  },
  editBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
