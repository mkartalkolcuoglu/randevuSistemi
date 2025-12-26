import { useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/auth.store';
import { appointmentService } from '../../../src/services/appointment.service';
import { Appointment, AppointmentStatus } from '../../../src/types';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706', label: 'Bekliyor' },
  confirmed: { bg: '#DBEAFE', text: '#2563EB', label: 'Onaylandı' },
  completed: { bg: '#D1FAE5', text: '#059669', label: 'Tamamlandı' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'İptal' },
  no_show: { bg: '#F3F4F6', text: '#6B7280', label: 'Gelmedi' },
};

const STATUS_OPTIONS: { status: AppointmentStatus; label: string; color: string }[] = [
  { status: 'confirmed', label: 'Onayla', color: '#2563EB' },
  { status: 'completed', label: 'Tamamlandı', color: '#059669' },
  { status: 'cancelled', label: 'İptal Et', color: '#DC2626' },
  { status: 'no_show', label: 'Gelmedi', color: '#6B7280' },
];

export default function StaffAppointmentsScreen() {
  const { selectedTenant } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const getWeekDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    // Start from 3 days ago
    for (let i = -3; i <= 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const fetchAppointments = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await appointmentService.getStaffAppointments();
      setAppointments(data);
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

  const filteredAppointments = appointments
    .filter((apt) => apt.date === selectedDate.toISOString().split('T')[0])
    .sort((a, b) => a.time.localeCompare(b.time));

  const handleStatusChange = async (status: AppointmentStatus) => {
    if (!selectedAppointment) return;

    try {
      await appointmentService.updateAppointmentStatus(selectedAppointment.id, status);
      setShowStatusModal(false);
      setSelectedAppointment(null);
      fetchAppointments();
      Alert.alert('Başarılı', 'Randevu durumu güncellendi');
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.message || 'Durum güncellenemedi');
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Bugün';
    if (date.toDateString() === tomorrow.toDateString()) return 'Yarın';
    return date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const renderDatePicker = () => (
    <FlatList
      horizontal
      data={weekDates}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.datePickerContent}
      renderItem={({ item: date }) => {
        const isSelected = date.toDateString() === selectedDate.toDateString();
        const isToday = date.toDateString() === new Date().toDateString();
        const aptCount = appointments.filter(
          (apt) => apt.date === date.toISOString().split('T')[0]
        ).length;

        return (
          <TouchableOpacity
            style={[
              styles.dateItem,
              isSelected && styles.dateItemSelected,
              isToday && !isSelected && styles.dateItemToday,
            ]}
            onPress={() => setSelectedDate(date)}
          >
            <Text
              style={[
                styles.dateWeekday,
                isSelected && styles.dateWeekdaySelected,
              ]}
            >
              {date.toLocaleDateString('tr-TR', { weekday: 'short' })}
            </Text>
            <Text
              style={[
                styles.dateNumber,
                isSelected && styles.dateNumberSelected,
              ]}
            >
              {date.getDate()}
            </Text>
            {aptCount > 0 && (
              <View
                style={[
                  styles.dateBadge,
                  isSelected && styles.dateBadgeSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dateBadgeText,
                    isSelected && styles.dateBadgeTextSelected,
                  ]}
                >
                  {aptCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      }}
      keyExtractor={(item) => item.toISOString()}
    />
  );

  const renderAppointment = ({ item }: { item: Appointment }) => {
    const status = STATUS_COLORS[item.status] || STATUS_COLORS.pending;

    return (
      <TouchableOpacity
        style={styles.appointmentCard}
        onPress={() => {
          setSelectedAppointment(item);
          setShowStatusModal(true);
        }}
      >
        <View style={styles.timeColumn}>
          <Text style={styles.aptTime}>{item.time.substring(0, 5)}</Text>
          <Text style={styles.aptDuration}>{item.duration} dk</Text>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
            </View>
          </View>

          <Text style={styles.serviceName}>{item.serviceName}</Text>

          <View style={styles.cardFooter}>
            <View style={styles.infoItem}>
              <Ionicons name="call-outline" size={14} color="#6B7280" />
              <Text style={styles.infoText}>{item.customerPhone}</Text>
            </View>
            <Text style={styles.priceText}>{item.price} ₺</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Bu tarihte randevu yok</Text>
      <Text style={styles.emptySubtitle}>Başka bir tarih seçebilirsiniz</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Randevular</Text>
        <Text style={styles.subtitle}>{formatDate(selectedDate)}</Text>
      </View>

      <View style={styles.datePicker}>{renderDatePicker()}</View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
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
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Status Change Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Randevu Durumu</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedAppointment && (
              <View style={styles.modalInfo}>
                <Text style={styles.modalCustomer}>{selectedAppointment.customerName}</Text>
                <Text style={styles.modalService}>
                  {selectedAppointment.serviceName} • {selectedAppointment.time.substring(0, 5)}
                </Text>
              </View>
            )}

            <View style={styles.statusOptions}>
              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.status}
                  style={[
                    styles.statusOption,
                    selectedAppointment?.status === option.status && styles.statusOptionActive,
                  ]}
                  onPress={() => handleStatusChange(option.status)}
                >
                  <View
                    style={[styles.statusDot, { backgroundColor: option.color }]}
                  />
                  <Text style={styles.statusOptionText}>{option.label}</Text>
                  {selectedAppointment?.status === option.status && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  datePicker: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateItem: {
    width: 56,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  dateItemSelected: {
    backgroundColor: '#3B82F6',
  },
  dateItemToday: {
    backgroundColor: '#EFF6FF',
  },
  dateWeekday: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  dateWeekdaySelected: {
    color: '#BFDBFE',
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  dateNumberSelected: {
    color: '#fff',
  },
  dateBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  dateBadgeSelected: {
    backgroundColor: '#fff',
  },
  dateBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  dateBadgeTextSelected: {
    color: '#3B82F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  timeColumn: {
    width: 70,
    padding: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
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
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  serviceName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalInfo: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalCustomer: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalService: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusOptions: {
    gap: 8,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  statusOptionActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
});
