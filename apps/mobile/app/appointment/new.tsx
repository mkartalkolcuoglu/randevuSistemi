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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth.store';
import { appointmentService } from '../../src/services/appointment.service';
import { Service, Staff } from '../../src/types';

export default function NewAppointmentScreen() {
  const router = useRouter();
  const { selectedTenant } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [step, setStep] = useState(1); // 1: Service, 2: Staff, 3: DateTime, 4: Customer

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!selectedTenant?.id) return;
    setIsLoadingData(true);
    try {
      const [servicesRes, staffRes] = await Promise.all([
        appointmentService.getServices(selectedTenant.id),
        appointmentService.getAvailableStaff(selectedTenant.id),
      ]);
      setServices(servicesRes.data || []);
      setStaffList(staffRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoadingData(false);
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
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const handleCreateAppointment = async () => {
    if (!selectedService || !selectedStaff || !selectedTime || !customerName || !customerPhone) {
      Alert.alert('Hata', 'Lutfen tum alanlari doldurun');
      return;
    }

    setIsLoading(true);
    try {
      const response = await appointmentService.createAppointmentForCustomer({
        serviceId: selectedService.id,
        staffId: selectedStaff.id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        customerName,
        customerPhone,
        notes,
      });

      if (response.success) {
        Alert.alert('Basarili', 'Randevu olusturuldu', [
          { text: 'Tamam', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Hata', response.error || 'Randevu olusturulamadi');
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir hata olustu');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((s) => (
        <View key={s} style={styles.stepRow}>
          <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
            {step > s ? (
              <Ionicons name="checkmark" size={14} color="#fff" />
            ) : (
              <Text style={[styles.stepNumber, step >= s && styles.stepNumberActive]}>{s}</Text>
            )}
          </View>
          {s < 4 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  if (isLoadingData) {
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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Randevu</Text>
        <View style={styles.placeholder} />
      </View>

      {renderStepIndicator()}

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Step 1: Service Selection */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Hizmet Secin</Text>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.optionCard,
                  selectedService?.id === service.id && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedService(service)}
              >
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>{service.name}</Text>
                  <Text style={styles.optionSubtitle}>
                    {service.duration} dk - {service.price} TL
                  </Text>
                </View>
                {selectedService?.id === service.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 2: Staff Selection */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Personel Secin</Text>
            {staffList.map((staff) => (
              <TouchableOpacity
                key={staff.id}
                style={[
                  styles.optionCard,
                  selectedStaff?.id === staff.id && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedStaff(staff)}
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

        {/* Step 3: Date & Time */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Tarih ve Saat</Text>

            <Text style={styles.label}>Tarih</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {generateDates().map((date) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
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
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>Saat</Text>
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

        {/* Step 4: Customer Info */}
        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>Musteri Bilgileri</Text>

            <Text style={styles.label}>Ad Soyad *</Text>
            <TextInput
              style={styles.input}
              placeholder="Musteri adi"
              value={customerName}
              onChangeText={setCustomerName}
            />

            <Text style={styles.label}>Telefon *</Text>
            <TextInput
              style={styles.input}
              placeholder="5XX XXX XXXX"
              keyboardType="phone-pad"
              value={customerPhone}
              onChangeText={setCustomerPhone}
            />

            <Text style={styles.label}>Notlar</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Opsiyonel notlar"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />

            {/* Summary */}
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Randevu Ozeti</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Hizmet:</Text>
                <Text style={styles.summaryValue}>{selectedService?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Personel:</Text>
                <Text style={styles.summaryValue}>
                  {selectedStaff?.firstName} {selectedStaff?.lastName}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tarih:</Text>
                <Text style={styles.summaryValue}>
                  {selectedDate.toLocaleDateString('tr-TR')} - {selectedTime}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Ucret:</Text>
                <Text style={styles.summaryValueBold}>{selectedService?.price} TL</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        {step > 1 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
            <Text style={styles.backBtnText}>Geri</Text>
          </TouchableOpacity>
        )}
        {step < 4 ? (
          <TouchableOpacity
            style={[
              styles.nextBtn,
              step === 1 && !selectedService && styles.btnDisabled,
              step === 2 && !selectedStaff && styles.btnDisabled,
              step === 3 && !selectedTime && styles.btnDisabled,
            ]}
            onPress={() => setStep(step + 1)}
            disabled={
              (step === 1 && !selectedService) ||
              (step === 2 && !selectedStaff) ||
              (step === 3 && !selectedTime)
            }
          >
            <Text style={styles.nextBtnText}>Devam</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, isLoading && styles.btnDisabled]}
            onPress={handleCreateAppointment}
            disabled={isLoading}
          >
            <Text style={styles.nextBtnText}>
              {isLoading ? 'Olusturuluyor...' : 'Randevu Olustur'}
            </Text>
          </TouchableOpacity>
        )}
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
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#3B82F6',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  stepLineActive: {
    backgroundColor: '#3B82F6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  staffInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
    marginTop: 16,
  },
  dateScroll: {
    marginBottom: 8,
  },
  dateCard: {
    width: 60,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dateCardSelected: {
    backgroundColor: '#3B82F6',
  },
  dateDay: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  dateDaySelected: {
    color: '#BFDBFE',
  },
  dateNum: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  dateNumSelected: {
    color: '#fff',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  timeSlotSelected: {
    backgroundColor: '#3B82F6',
  },
  timeText: {
    fontSize: 14,
    color: '#4B5563',
  },
  timeTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  summaryValueBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  bottomButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  backBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  nextBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  btnDisabled: {
    backgroundColor: '#9CA3AF',
  },
});
