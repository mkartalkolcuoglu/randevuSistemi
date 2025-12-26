import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/auth.store';
import { appointmentService } from '../../../src/services/appointment.service';
import api from '../../../src/services/api';
import { Service, Staff, TimeSlot } from '../../../src/types';

type Step = 'service' | 'staff' | 'date' | 'time' | 'confirm';

export default function NewAppointmentScreen() {
  const router = useRouter();
  const { selectedTenant } = useAuthStore();
  const [step, setStep] = useState<Step>('service');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Generate next 14 days
  const getAvailableDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedService) {
      fetchStaff();
    }
  }, [selectedService]);

  useEffect(() => {
    if (selectedService && selectedStaff && selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedService, selectedStaff, selectedDate]);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/mobile/services');
      setServices(response.data.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/mobile/staff?serviceId=${selectedService?.id}`);
      setStaff(response.data.data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    if (!selectedDate || !selectedStaff || !selectedService) return;

    setIsLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await api.get(
        `/api/mobile/availability?staffId=${selectedStaff.id}&date=${dateStr}&serviceId=${selectedService.id}`
      );
      setTimeSlots(response.data.data || []);
    } catch (error) {
      console.error('Error fetching time slots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    const steps: Step[] = ['service', 'staff', 'date', 'time', 'confirm'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: Step[] = ['service', 'staff', 'date', 'time', 'confirm'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    try {
      await appointmentService.createAppointment({
        serviceId: selectedService.id,
        staffId: selectedStaff.id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
      });
      Alert.alert('Başarılı', 'Randevunuz oluşturuldu!', [
        { text: 'Tamam', onPress: () => router.replace('/(tabs)/customer') },
      ]);
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.message || 'Randevu oluşturulamadı');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const renderStepIndicator = () => {
    const steps: { key: Step; label: string }[] = [
      { key: 'service', label: 'Hizmet' },
      { key: 'staff', label: 'Personel' },
      { key: 'date', label: 'Tarih' },
      { key: 'time', label: 'Saat' },
      { key: 'confirm', label: 'Onay' },
    ];

    return (
      <View style={styles.stepIndicator}>
        {steps.map((s, index) => {
          const isActive = steps.findIndex((st) => st.key === step) >= index;
          const isCurrent = s.key === step;
          return (
            <View key={s.key} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  isActive && styles.stepDotActive,
                  isCurrent && styles.stepDotCurrent,
                ]}
              >
                {isActive && !isCurrent && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
              {index < steps.length - 1 && (
                <View style={[styles.stepLine, isActive && styles.stepLineActive]} />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderServiceStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Hizmet Seçin</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
      ) : (
        services.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[
              styles.optionCard,
              selectedService?.id === service.id && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedService(service)}
          >
            <View style={styles.optionInfo}>
              <Text style={styles.optionName}>{service.name}</Text>
              {service.description && (
                <Text style={styles.optionDesc}>{service.description}</Text>
              )}
              <View style={styles.optionMeta}>
                <Text style={styles.optionDuration}>{service.duration} dk</Text>
                <Text style={styles.optionPrice}>{service.price} ₺</Text>
              </View>
            </View>
            {selectedService?.id === service.id && (
              <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
            )}
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderStaffStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personel Seçin</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
      ) : (
        staff.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[
              styles.optionCard,
              selectedStaff?.id === s.id && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedStaff(s)}
          >
            <View style={styles.staffAvatar}>
              <Text style={styles.staffInitial}>
                {s.firstName.charAt(0)}
                {s.lastName.charAt(0)}
              </Text>
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionName}>
                {s.firstName} {s.lastName}
              </Text>
              {s.position && <Text style={styles.optionDesc}>{s.position}</Text>}
            </View>
            {selectedStaff?.id === s.id && (
              <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
            )}
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderDateStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Tarih Seçin</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.dateGrid}>
          {availableDates.map((date) => {
            const isSelected =
              selectedDate?.toDateString() === date.toDateString();
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
                <Text style={[styles.dateMonth, isSelected && styles.dateMonthSelected]}>
                  {date.toLocaleDateString('tr-TR', { month: 'short' })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  const renderTimeStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Saat Seçin</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
      ) : timeSlots.length === 0 ? (
        <View style={styles.noSlots}>
          <Ionicons name="time-outline" size={48} color="#D1D5DB" />
          <Text style={styles.noSlotsText}>Bu tarihte müsait saat yok</Text>
        </View>
      ) : (
        <View style={styles.timeGrid}>
          {timeSlots.map((slot) => (
            <TouchableOpacity
              key={slot.time}
              style={[
                styles.timeSlot,
                !slot.available && styles.timeSlotDisabled,
                selectedTime === slot.time && styles.timeSlotSelected,
              ]}
              onPress={() => slot.available && setSelectedTime(slot.time)}
              disabled={!slot.available}
            >
              <Text
                style={[
                  styles.timeText,
                  !slot.available && styles.timeTextDisabled,
                  selectedTime === slot.time && styles.timeTextSelected,
                ]}
              >
                {slot.time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderConfirmStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Randevu Özeti</Text>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Ionicons name="business" size={20} color="#6B7280" />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Salon</Text>
            <Text style={styles.summaryValue}>{selectedTenant?.businessName}</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="cut" size={20} color="#6B7280" />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Hizmet</Text>
            <Text style={styles.summaryValue}>{selectedService?.name}</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="person" size={20} color="#6B7280" />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Personel</Text>
            <Text style={styles.summaryValue}>
              {selectedStaff?.firstName} {selectedStaff?.lastName}
            </Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="calendar" size={20} color="#6B7280" />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Tarih</Text>
            <Text style={styles.summaryValue}>
              {selectedDate?.toLocaleDateString('tr-TR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="time" size={20} color="#6B7280" />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Saat</Text>
            <Text style={styles.summaryValue}>{selectedTime}</Text>
          </View>
        </View>
        <View style={[styles.summaryRow, styles.summaryRowLast]}>
          <Ionicons name="cash" size={20} color="#6B7280" />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Ücret</Text>
            <Text style={styles.summaryPrice}>{selectedService?.price} ₺</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const canProceed = () => {
    switch (step) {
      case 'service':
        return selectedService !== null;
      case 'staff':
        return selectedStaff !== null;
      case 'date':
        return selectedDate !== null;
      case 'time':
        return selectedTime !== null;
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} disabled={step === 'service'}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={step === 'service' ? '#D1D5DB' : '#1F2937'}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Randevu</Text>
        <View style={{ width: 24 }} />
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 'service' && renderServiceStep()}
        {step === 'staff' && renderStaffStep()}
        {step === 'date' && renderDateStep()}
        {step === 'time' && renderTimeStep()}
        {step === 'confirm' && renderConfirmStep()}
      </ScrollView>

      <View style={styles.footer}>
        {step === 'confirm' ? (
          <TouchableOpacity
            style={[styles.nextButton, isSubmitting && styles.nextButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextButtonText}>Randevuyu Onayla</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={styles.nextButtonText}>Devam Et</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#3B82F6',
  },
  stepDotCurrent: {
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#BFDBFE',
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
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  loader: {
    marginTop: 40,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
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
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  optionDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  optionMeta: {
    flexDirection: 'row',
    marginTop: 8,
  },
  optionDuration: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 16,
  },
  optionPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  staffInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  dateGrid: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  dateCard: {
    width: 70,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    marginRight: 10,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginVertical: 4,
  },
  dateNumSelected: {
    color: '#fff',
  },
  dateMonth: {
    fontSize: 12,
    color: '#6B7280',
  },
  dateMonthSelected: {
    color: '#BFDBFE',
  },
  noSlots: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSlotsText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  timeSlot: {
    width: '30%',
    margin: '1.66%',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  timeSlotDisabled: {
    backgroundColor: '#F3F4F6',
  },
  timeSlotSelected: {
    backgroundColor: '#3B82F6',
  },
  timeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  timeTextDisabled: {
    color: '#D1D5DB',
  },
  timeTextSelected: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginTop: 2,
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
});
