import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { appointmentService } from '../../src/services/appointment.service';
import { Appointment, AppointmentStatus } from '../../src/types';
import api from '../../src/services/api';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706', label: 'Beklemede' },
  confirmed: { bg: '#DBEAFE', text: '#2563EB', label: 'Onaylandı' },
  completed: { bg: '#D1FAE5', text: '#059669', label: 'Tamamlandı' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'İptal Edildi' },
  no_show: { bg: '#F3F4F6', text: '#6B7280', label: 'Gelmedi ve Bilgi Vermedi' },
};

const STATUS_OPTIONS: { status: AppointmentStatus; label: string; color: string }[] = [
  { status: 'confirmed', label: 'Onayla', color: '#2563EB' },
  { status: 'completed', label: 'Tamamlandı', color: '#059669' },
  { status: 'cancelled', label: 'İptal Et', color: '#DC2626' },
  { status: 'no_show', label: 'Gelmedi ve Bilgi Vermedi', color: '#6B7280' },
];

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  const fetchAppointment = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await appointmentService.getAppointment(id);
      if (response.success && response.data) {
        setAppointment(response.data);
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    if (appointment?.customerPhone) {
      Linking.openURL(`tel:${appointment.customerPhone}`);
    }
  };

  const handleWhatsApp = () => {
    if (appointment?.customerPhone) {
      const phone = appointment.customerPhone.replace(/\D/g, '');
      Linking.openURL(`whatsapp://send?phone=90${phone}`);
    }
  };

  const handleStatusChange = async (status: AppointmentStatus) => {
    if (!appointment) return;

    Alert.alert(
      'Durum Degistir',
      `Randevu durumunu "${STATUS_OPTIONS.find(s => s.status === status)?.label}" olarak degistirmek istiyor musunuz?`,
      [
        { text: 'Iptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            try {
              await appointmentService.updateAppointmentStatus(appointment.id, status);
              fetchAppointment();
              Alert.alert('Basarili', 'Randevu durumu guncellendi');
            } catch (error) {
              Alert.alert('Hata', 'Durum guncellenemedi');
            }
          },
        },
      ]
    );
  };

  const [sendingConfirmation, setSendingConfirmation] = useState(false);
  const [sendingSurvey, setSendingSurvey] = useState(false);

  const handleSendConfirmation = async () => {
    if (!appointment) return;
    setSendingConfirmation(true);
    try {
      const response = await api.post('/api/whatsapp/send-confirmation', { appointmentId: appointment.id });
      if (response.data.success) {
        Alert.alert('Başarılı', response.data.message || 'Onay mesajı gönderildi');
        setAppointment(prev => prev ? { ...prev, whatsappSent: true } : null);
      } else {
        Alert.alert('Hata', response.data.message || 'Mesaj gönderilemedi');
      }
    } catch (error: any) {
      Alert.alert('Hata', error?.response?.data?.message || 'Mesaj gönderilemedi');
    } finally {
      setSendingConfirmation(false);
    }
  };

  const handleSendSurvey = async () => {
    if (!appointment) return;
    setSendingSurvey(true);
    try {
      const response = await api.post('/api/whatsapp/send-survey', { appointmentId: appointment.id });
      if (response.data.success) {
        Alert.alert('Başarılı', response.data.message || 'Anket gönderildi');
        setAppointment(prev => prev ? { ...prev, feedbackSent: true } : null);
      } else {
        Alert.alert('Hata', response.data.message || 'Anket gönderilemedi');
      }
    } catch (error: any) {
      Alert.alert('Hata', error?.response?.data?.message || 'Anket gönderilemedi');
    } finally {
      setSendingSurvey(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Randevu Detayi</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Randevu bulunamadi</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = STATUS_COLORS[appointment.status] || STATUS_COLORS.pending;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Randevu Detayi</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeItem}>
              <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
              <Text style={styles.dateTimeText}>
                {new Date(appointment.date).toLocaleDateString('tr-TR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Ionicons name="time-outline" size={24} color="#3B82F6" />
              <Text style={styles.dateTimeText}>
                {appointment.time.substring(0, 5)} ({appointment.duration} dk)
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Musteri Bilgileri</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <Text style={styles.cardText}>{appointment.customerName}</Text>
            </View>
            {appointment.customerPhone && (
              <View style={styles.cardRow}>
                <Ionicons name="call-outline" size={20} color="#6B7280" />
                <Text style={styles.cardText}>{appointment.customerPhone}</Text>
              </View>
            )}
            {appointment.customerEmail && (
              <View style={styles.cardRow}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <Text style={styles.cardText}>{appointment.customerEmail}</Text>
              </View>
            )}

            {/* Contact Buttons */}
            <View style={styles.contactButtons}>
              <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.contactButtonText}>Ara</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactButton, styles.whatsappButton]}
                onPress={handleWhatsApp}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                <Text style={styles.contactButtonText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Service Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hizmet Bilgileri</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Ionicons name="cut-outline" size={20} color="#6B7280" />
              <Text style={styles.cardText}>{appointment.serviceName}</Text>
            </View>
            <View style={styles.cardRow}>
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <Text style={styles.cardText}>{appointment.staffName}</Text>
            </View>
            <View style={styles.cardRow}>
              <Ionicons name="cash-outline" size={20} color="#6B7280" />
              <Text style={styles.cardTextBold}>
                {((appointment.price || 0) + (appointment.extraCharge || 0)).toFixed(0)} TL
                {(appointment.extraCharge || 0) > 0 && (
                  ` (Hizmet: ${appointment.price} + Ek: ${appointment.extraCharge})`
                )}
              </Text>
            </View>
            {appointment.extraChargeNote && (
              <View style={styles.cardRow}>
                <Ionicons name="information-circle-outline" size={20} color="#F59E0B" />
                <Text style={[styles.cardText, { color: '#D97706' }]}>Ek ücret: {appointment.extraChargeNote}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes */}
        {appointment.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notlar</Text>
            <View style={styles.card}>
              <Text style={styles.notes}>{appointment.notes}</Text>
            </View>
          </View>
        )}

        {/* Status Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Durum Degistir</Text>
          <View style={styles.statusActions}>
            {STATUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.status}
                style={[
                  styles.statusButton,
                  appointment.status === option.status && styles.statusButtonActive,
                  { borderColor: option.color },
                ]}
                onPress={() => handleStatusChange(option.status)}
                disabled={appointment.status === option.status}
              >
                <View style={[styles.statusDot, { backgroundColor: option.color }]} />
                <Text
                  style={[
                    styles.statusButtonText,
                    appointment.status === option.status && { color: option.color },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mesaj Gönder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mesaj Gönder</Text>
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              style={[styles.messageButton, { backgroundColor: '#059669' }, ((appointment as any).whatsappSent || sendingConfirmation) && { opacity: 0.5 }]}
              onPress={handleSendConfirmation}
              disabled={(appointment as any).whatsappSent || sendingConfirmation}
            >
              {sendingConfirmation ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              )}
              <Text style={styles.messageButtonText}>
                {(appointment as any).whatsappSent ? 'Onay Mesajı Gönderildi' : 'Onay Mesajı Gönder'}
              </Text>
            </TouchableOpacity>

            {appointment.status === 'completed' && (
              <TouchableOpacity
                style={[styles.messageButton, { backgroundColor: '#D97706' }, ((appointment as any).feedbackSent || sendingSurvey) && { opacity: 0.5 }]}
                onPress={handleSendSurvey}
                disabled={(appointment as any).feedbackSent || sendingSurvey}
              >
                {sendingSurvey ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="star-outline" size={20} color="#fff" />
                )}
                <Text style={styles.messageButtonText}>
                  {(appointment as any).feedbackSent ? 'Anket Gönderildi' : 'Memnuniyet Anketi Gönder'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
  },
  statusBanner: {
    padding: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  dateTimeContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 15,
    color: '#1F2937',
    marginLeft: 12,
  },
  cardTextBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 12,
  },
  contactButtons: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  notes: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  statusButtonActive: {
    backgroundColor: '#F3F4F6',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusButtonText: {
    fontSize: 14,
    color: '#4B5563',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
