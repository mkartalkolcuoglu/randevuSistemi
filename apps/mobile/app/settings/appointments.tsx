import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export default function AppointmentSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    allowOnlineBooking: true,
    requireConfirmation: true,
    sendReminders: true,
    reminderMinutes: 120,
    timeSlotInterval: 30,
    minAdvanceBooking: 60,
    maxAdvanceBookingDays: 30,
    allowCancellation: true,
    cancellationHours: 6,
  });

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Randevu Ayarları</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Genel Ayarlar</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Online Randevu</Text>
              <Text style={styles.settingDescription}>Müşteriler online randevu alabilir</Text>
            </View>
            <Switch
              value={settings.allowOnlineBooking}
              onValueChange={(v) => updateSetting('allowOnlineBooking', v)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.allowOnlineBooking ? '#3B82F6' : '#F3F4F6'}
            />
          </View>

          <View style={[styles.settingItem, styles.settingBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Onay Gerektir</Text>
              <Text style={styles.settingDescription}>Randevular manuel onay bekler</Text>
            </View>
            <Switch
              value={settings.requireConfirmation}
              onValueChange={(v) => updateSetting('requireConfirmation', v)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.requireConfirmation ? '#3B82F6' : '#F3F4F6'}
            />
          </View>

          <View style={[styles.settingItem, styles.settingBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Hatırlatma Gönder</Text>
              <Text style={styles.settingDescription}>SMS/WhatsApp hatırlatma</Text>
            </View>
            <Switch
              value={settings.sendReminders}
              onValueChange={(v) => updateSetting('sendReminders', v)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.sendReminders ? '#3B82F6' : '#F3F4F6'}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Zaman Ayarları</Text>

        <View style={styles.settingCard}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Hatırlatma Süresi</Text>
              <Text style={styles.settingDescription}>Randevudan kaç dakika önce</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>{settings.reminderMinutes} dk</Text>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, styles.settingBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Randevu Aralığı</Text>
              <Text style={styles.settingDescription}>Saat slotları arasındaki süre</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>{settings.timeSlotInterval} dk</Text>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, styles.settingBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Minimum Süre</Text>
              <Text style={styles.settingDescription}>En erken kaç dakika öncesinden</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>{settings.minAdvanceBooking} dk</Text>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, styles.settingBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Maksimum Süre</Text>
              <Text style={styles.settingDescription}>En fazla kaç gün ilerisine</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>{settings.maxAdvanceBookingDays} gün</Text>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>İptal Ayarları</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>İptal İzni</Text>
              <Text style={styles.settingDescription}>Müşteriler randevu iptal edebilir</Text>
            </View>
            <Switch
              value={settings.allowCancellation}
              onValueChange={(v) => updateSetting('allowCancellation', v)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.allowCancellation ? '#3B82F6' : '#F3F4F6'}
            />
          </View>

          <TouchableOpacity style={[styles.settingItem, styles.settingBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>İptal Süresi</Text>
              <Text style={styles.settingDescription}>Randevudan kaç saat öncesine kadar</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>{settings.cancellationHours} saat</Text>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Kaydet</Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },
  settingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueText: {
    fontSize: 15,
    color: '#3B82F6',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
