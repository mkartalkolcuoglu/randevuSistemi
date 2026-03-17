import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth.store';
import { appointmentService } from '../../src/services/appointment.service';
import { Service, Staff, Appointment } from '../../src/types';

const STATUS_OPTIONS = [
  { key: 'pending', label: 'Beklemede', icon: 'time', color: '#D97706', bg: '#FEF3C7' },
  { key: 'confirmed', label: 'Onaylandı', icon: 'checkmark-circle', color: '#2563EB', bg: '#DBEAFE' },
  { key: 'completed', label: 'Tamamlandı', icon: 'checkmark-done-circle', color: '#059669', bg: '#D1FAE5' },
  { key: 'no_show', label: 'Gelmedi ve Bilgi Vermedi', icon: 'close-circle', color: '#EA580C', bg: '#FFEDD5' },
  { key: 'cancelled', label: 'İptal Edildi', icon: 'ban', color: '#DC2626', bg: '#FEE2E2' },
] as const;

export default function EditAppointmentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedTenant } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [extraCharge, setExtraCharge] = useState('0');
  const [extraChargeNote, setExtraChargeNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pending');

  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!selectedTenant?.id || !id) return;
    setIsLoading(true);
    try {
      const [servicesRes, staffRes, appointmentRes] = await Promise.all([
        appointmentService.getServices(selectedTenant.id, true),
        appointmentService.getAvailableStaff(selectedTenant.id),
        appointmentService.getAppointment(id),
      ]);

      const serviceList = servicesRes.data || [];
      setStaffList(staffRes.data || []);

      if (appointmentRes.data) {
        const apt = appointmentRes.data;
        setAppointment(apt);
        setCustomerName(apt.customerName || '');
        setCustomerPhone(apt.customerPhone || '');
        setNotes(apt.notes || '');
        setExtraCharge(String(apt.extraCharge || 0));
        setExtraChargeNote(apt.extraChargeNote || '');
        setSelectedDate(new Date(apt.date));
        setSelectedTime(apt.time?.substring(0, 5) || '');
        setSelectedStatus(apt.status || 'pending');

        // Set service — find by ID, or fallback from appointment's denormalized data
        let service = serviceList.find((s: Service) => s.id === apt.serviceId);
        if (!service && apt.serviceId) {
          service = {
            id: apt.serviceId,
            name: apt.serviceName || 'Bilinmeyen Hizmet',
            price: apt.price || 0,
            duration: apt.duration || 30,
            tenantId: selectedTenant.id,
          } as Service;
          serviceList.push(service);
        }
        if (service) setSelectedService(service);
        setServices(serviceList);

        // Set staff
        const staff = staffRes.data?.find((s: Staff) => s.id === apt.staffId);
        if (staff) setSelectedStaff(staff);
      } else {
        setServices(serviceList);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Hata', 'Randevu bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 21; hour++) {
      for (let min = 0; min < 60; min += 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  };

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = -7; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const handleSave = async () => {
    if (!selectedService || !selectedStaff || !selectedTime || !customerName || !customerPhone) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (!id) return;

    setIsSaving(true);
    try {
      const response = await appointmentService.updateAppointment(id, {
        serviceId: selectedService.id,
        staffId: selectedStaff.id,
        date: `${selectedDate.getFullYear()}-${(selectedDate.getMonth()+1).toString().padStart(2,'0')}-${selectedDate.getDate().toString().padStart(2,'0')}`,
        time: selectedTime,
        customerName,
        customerPhone,
        notes,
        extraCharge: parseFloat(extraCharge) || 0,
        extraChargeNote: extraChargeNote || null,
      });

      // Update status if changed
      if (appointment && selectedStatus !== appointment.status) {
        await appointmentService.updateAppointmentStatus(id, selectedStatus);
      }

      if (response.success) {
        Alert.alert('Başarılı', 'Randevu güncellendi', [
          { text: 'Tamam', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Hata', response.error || 'Randevu güncellenemedi');
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Randevu yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Randevu Düzenle</Text>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Section */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => setActiveSection(activeSection === 'customer' ? null : 'customer')}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="person" size={20} color="#3B82F6" />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionLabel}>Müşteri</Text>
              <Text style={styles.sectionValue}>{customerName || 'Seçilmedi'}</Text>
            </View>
            <Ionicons
              name={activeSection === 'customer' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#6B7280"
            />
          </View>
        </TouchableOpacity>

        {activeSection === 'customer' && (
          <View style={styles.expandedSection}>
            <Text style={styles.inputLabel}>Ad Soyad</Text>
            <TextInput
              style={styles.input}
              placeholder="Müşteri adı"
              value={customerName}
              onChangeText={setCustomerName}
            />
            <Text style={styles.inputLabel}>Telefon</Text>
            <TextInput
              style={styles.input}
              placeholder="5XX XXX XXXX"
              keyboardType="phone-pad"
              value={customerPhone}
              onChangeText={setCustomerPhone}
            />
          </View>
        )}

        {/* Service Section */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => setActiveSection(activeSection === 'service' ? null : 'service')}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="cut" size={20} color="#D97706" />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionLabel}>Hizmet</Text>
              <Text style={styles.sectionValue}>
                {selectedService?.name || 'Seçilmedi'}
                {selectedService && ` - ${selectedService.price} ₺`}
              </Text>
            </View>
            <Ionicons
              name={activeSection === 'service' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#6B7280"
            />
          </View>
        </TouchableOpacity>

        {activeSection === 'service' && (
          <View style={styles.expandedSection}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.optionCard,
                  selectedService?.id === service.id && styles.optionCardSelected,
                ]}
                onPress={() => {
                  setSelectedService(service);
                  setActiveSection(null);
                }}
              >
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>{service.name}</Text>
                  <Text style={styles.optionSubtitle}>
                    {service.duration} dk - {service.price} ₺
                  </Text>
                </View>
                {selectedService?.id === service.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Staff Section */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => setActiveSection(activeSection === 'staff' ? null : 'staff')}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="people" size={20} color="#059669" />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionLabel}>Personel</Text>
              <Text style={styles.sectionValue}>
                {selectedStaff ? `${selectedStaff.firstName} ${selectedStaff.lastName}` : 'Seçilmedi'}
              </Text>
            </View>
            <Ionicons
              name={activeSection === 'staff' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#6B7280"
            />
          </View>
        </TouchableOpacity>

        {activeSection === 'staff' && (
          <View style={styles.expandedSection}>
            {staffList.map((staff) => (
              <TouchableOpacity
                key={staff.id}
                style={[
                  styles.optionCard,
                  selectedStaff?.id === staff.id && styles.optionCardSelected,
                ]}
                onPress={() => {
                  setSelectedStaff(staff);
                  setActiveSection(null);
                }}
              >
                <View style={styles.staffAvatar}>
                  <Text style={styles.staffInitial}>
                    {staff.firstName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>
                    {staff.firstName} {staff.lastName}
                  </Text>
                  {staff.position && (
                    <Text style={styles.optionSubtitle}>{staff.position}</Text>
                  )}
                </View>
                {selectedStaff?.id === staff.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Date & Time Section */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => setActiveSection(activeSection === 'datetime' ? null : 'datetime')}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="calendar" size={20} color="#DC2626" />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionLabel}>Tarih ve Saat</Text>
              <Text style={styles.sectionValue}>
                {selectedDate.toLocaleDateString('tr-TR')} - {selectedTime || 'Seçilmedi'}
              </Text>
            </View>
            <Ionicons
              name={activeSection === 'datetime' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#6B7280"
            />
          </View>
        </TouchableOpacity>

        {activeSection === 'datetime' && (
          <View style={styles.expandedSection}>
            <Text style={styles.inputLabel}>Tarih</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {generateDates().map((date) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
                      {date.toLocaleDateString('tr-TR', { weekday: 'short' })}
                    </Text>
                    <Text style={[styles.dateNum, isSelected && styles.dateNumSelected]}>
                      {date.getDate()}
                    </Text>
                    {isToday && <View style={styles.todayDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Saat</Text>
            <View style={styles.timeGrid}>
              {generateTimeSlots().map((time) => {
                const isSelected = time === selectedTime;
                return (
                  <TouchableOpacity
                    key={time}
                    style={[styles.timeSlot, isSelected && styles.timeSlotSelected]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Status Section */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => setActiveSection(activeSection === 'status' ? null : 'status')}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, {
              backgroundColor: STATUS_OPTIONS.find(s => s.key === selectedStatus)?.bg || '#F3F4F6',
            }]}>
              <Ionicons
                name={(STATUS_OPTIONS.find(s => s.key === selectedStatus)?.icon || 'ellipse') as any}
                size={20}
                color={STATUS_OPTIONS.find(s => s.key === selectedStatus)?.color || '#6B7280'}
              />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionLabel}>Durum</Text>
              <Text style={[styles.sectionValue, {
                color: STATUS_OPTIONS.find(s => s.key === selectedStatus)?.color || '#6B7280',
              }]}>
                {STATUS_OPTIONS.find(s => s.key === selectedStatus)?.label || 'Beklemede'}
              </Text>
            </View>
            <Ionicons
              name={activeSection === 'status' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#6B7280"
            />
          </View>
        </TouchableOpacity>

        {activeSection === 'status' && (
          <View style={styles.expandedSection}>
            {STATUS_OPTIONS.map((status) => (
              <TouchableOpacity
                key={status.key}
                style={[
                  styles.optionCard,
                  selectedStatus === status.key && styles.optionCardSelected,
                ]}
                onPress={() => {
                  setSelectedStatus(status.key);
                  setActiveSection(null);
                }}
              >
                <View style={[styles.statusIcon, { backgroundColor: status.bg }]}>
                  <Ionicons name={status.icon as any} size={22} color={status.color} />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>{status.label}</Text>
                </View>
                {selectedStatus === status.key && (
                  <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Extra Charge Section */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => setActiveSection(activeSection === 'extraCharge' ? null : 'extraCharge')}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="add-circle" size={20} color="#D97706" />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionLabel}>Ek Ucret</Text>
              <Text style={styles.sectionValue}>
                {parseFloat(extraCharge) > 0 ? `${extraCharge} TL` : 'Ek ucret yok'}
                {extraChargeNote ? ` - ${extraChargeNote}` : ''}
              </Text>
            </View>
            <Ionicons
              name={activeSection === 'extraCharge' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#6B7280"
            />
          </View>
        </TouchableOpacity>

        {activeSection === 'extraCharge' && (
          <View style={styles.expandedSection}>
            <Text style={styles.inputLabel}>Ek Ucret (TL)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={extraCharge}
              onChangeText={setExtraCharge}
            />
            <Text style={styles.inputLabel}>Ek Ucret Notu</Text>
            <TextInput
              style={styles.input}
              placeholder="Ek ucret aciklamasi (orn: ek malzeme, uzatma)"
              value={extraChargeNote}
              onChangeText={setExtraChargeNote}
            />
          </View>
        )}

        {/* Notes Section */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => setActiveSection(activeSection === 'notes' ? null : 'notes')}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#E5E7EB' }]}>
              <Ionicons name="document-text" size={20} color="#6B7280" />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionLabel}>Notlar</Text>
              <Text style={styles.sectionValue} numberOfLines={1}>
                {notes || 'Not eklenmemiş'}
              </Text>
            </View>
            <Ionicons
              name={activeSection === 'notes' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#6B7280"
            />
          </View>
        </TouchableOpacity>

        {activeSection === 'notes' && (
          <View style={styles.expandedSection}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Randevu notları..."
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </KeyboardAwareScrollView>

      {/* Bottom Save Button */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>İptal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveBtnText}>
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
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
  content: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    flexGrow: 1,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionInfo: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  sectionValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  expandedSection: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  staffAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  staffInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  dateScroll: {
    marginBottom: 8,
  },
  dateCard: {
    width: 56,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateCardSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  dateDay: {
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  dateDaySelected: {
    color: '#BFDBFE',
  },
  dateNum: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  dateNumSelected: {
    color: '#fff',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DC2626',
    marginTop: 4,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeSlotSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  timeText: {
    fontSize: 14,
    color: '#4B5563',
  },
  timeTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  bottomButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  saveBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
});
