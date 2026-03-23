import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const STEPS = [
  { key: 'workingHours', title: 'Çalışma Saatleri', icon: 'time-outline' as const, description: 'İşletmenizin açık olduğu saatleri belirleyin' },
  { key: 'services', title: 'İlk Hizmetiniz', icon: 'cut-outline' as const, description: 'Sunduğunuz hizmetleri ekleyin' },
  { key: 'staff', title: 'İlk Personeliniz', icon: 'person-add-outline' as const, description: 'Çalışanlarınızı ekleyin' },
  { key: 'location', title: 'Konum Bilgisi', icon: 'location-outline' as const, description: 'İşletmenizin adresini girin' },
  { key: 'notifications', title: 'Bildirim Tercihleri', icon: 'notifications-outline' as const, description: 'Bildirim kanallarını ayarlayın' },
  { key: 'theme', title: 'Tema & Logo', icon: 'color-palette-outline' as const, description: 'İşletmenizin görünümünü özelleştirin' },
];

interface OnboardingWizardProps {
  visible: boolean;
  completedSteps: string[];
  onDismiss: () => void;
  onComplete: () => void;
}

const DAYS = ['Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi', 'Pazar'];
const DAY_LABELS: Record<string, string> = {
  Pazartesi: 'Pazartesi', Sali: 'Salı', Carsamba: 'Çarşamba',
  Persembe: 'Perşembe', Cuma: 'Cuma', Cumartesi: 'Cumartesi', Pazar: 'Pazar',
};

export default function OnboardingWizard({ visible, completedSteps: initialCompleted, onDismiss, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>(initialCompleted);
  const [saving, setSaving] = useState(false);

  // Form states
  // Working hours
  const [hours, setHours] = useState<Record<string, { start: string; end: string; closed: boolean }>>(() => {
    const h: Record<string, { start: string; end: string; closed: boolean }> = {};
    DAYS.forEach(d => {
      h[d] = d === 'Pazar'
        ? { start: '09:00', end: '17:00', closed: true }
        : { start: '09:00', end: '18:00', closed: false };
    });
    return h;
  });

  // Service
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState('30');
  const [servicePrice, setServicePrice] = useState('');

  // Staff
  const [staffFirstName, setStaffFirstName] = useState('');
  const [staffLastName, setStaffLastName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');

  // Location
  const [address, setAddress] = useState('');

  // Notifications
  const [confirmationChannel, setConfirmationChannel] = useState('whatsapp');
  const [reminderChannel, setReminderChannel] = useState('whatsapp');

  // Theme
  const [primaryColor, setPrimaryColor] = useState('#163974');

  useEffect(() => {
    const firstIncomplete = STEPS.findIndex(s => !initialCompleted.includes(s.key));
    if (firstIncomplete >= 0) setCurrentStep(firstIncomplete);
  }, [initialCompleted]);

  const markComplete = useCallback((key: string) => {
    setCompletedSteps(prev => {
      const updated = prev.includes(key) ? prev : [...prev, key];
      if (updated.length === STEPS.length) {
        setTimeout(onComplete, 300);
      }
      return updated;
    });
  }, [onComplete]);

  const goNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(prev => prev + 1);
    else onDismiss();
  };

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const saveWorkingHours = async () => {
    setSaving(true);
    try {
      await api.put('/api/mobile/settings', { workingHours: hours });
      markComplete('workingHours');
      goNext();
    } catch {
      Alert.alert('Hata', 'Çalışma saatleri kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const saveService = async () => {
    if (!serviceName.trim() || !servicePrice.trim()) {
      Alert.alert('Uyarı', 'Hizmet adı ve fiyat gerekli');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/mobile/services', {
        name: serviceName.trim(),
        duration: parseInt(serviceDuration),
        price: parseFloat(servicePrice),
        status: 'active',
        category: 'Genel',
      });
      markComplete('services');
      goNext();
    } catch {
      Alert.alert('Hata', 'Hizmet eklenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const saveStaff = async () => {
    if (!staffFirstName.trim() || !staffLastName.trim()) {
      Alert.alert('Uyarı', 'Ad ve soyad gerekli');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/mobile/staff', {
        firstName: staffFirstName.trim(),
        lastName: staffLastName.trim(),
        phone: staffPhone.trim(),
        position: 'Personel',
        status: 'active',
        canLogin: false,
        role: 'staff',
      });
      markComplete('staff');
      goNext();
    } catch {
      Alert.alert('Hata', 'Personel eklenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const saveLocation = async () => {
    if (!address.trim()) {
      Alert.alert('Uyarı', 'Adres gerekli');
      return;
    }
    setSaving(true);
    try {
      await api.put('/api/mobile/settings', { businessAddress: address.trim() });
      markComplete('location');
      goNext();
    } catch {
      Alert.alert('Hata', 'Konum kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    setSaving(true);
    try {
      await api.put('/api/mobile/settings', {
        notificationSettings: {
          confirmationChannel,
          reminderChannel,
          sendConfirmation: true,
          sendReminder: true,
        },
      });
      markComplete('notifications');
      goNext();
    } catch {
      Alert.alert('Hata', 'Bildirim ayarları kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const saveTheme = async () => {
    setSaving(true);
    try {
      await api.put('/api/mobile/settings', {
        themeSettings: { primaryColor },
      });
      markComplete('theme');
      goNext();
    } catch {
      Alert.alert('Hata', 'Tema kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const progress = Math.round((completedSteps.length / STEPS.length) * 100);
  const step = STEPS[currentStep];

  const renderStepContent = () => {
    switch (step.key) {
      case 'workingHours':
        return (
          <View style={styles.formContainer}>
            {DAYS.map(day => (
              <View key={day} style={styles.dayRow}>
                <View style={styles.dayLabel}>
                  <Switch
                    value={!hours[day].closed}
                    onValueChange={v => setHours(prev => ({ ...prev, [day]: { ...prev[day], closed: !v } }))}
                    trackColor={{ true: '#3b82f6' }}
                  />
                  <Text style={[styles.dayText, hours[day].closed && styles.closedText]}>{DAY_LABELS[day]}</Text>
                </View>
                {!hours[day].closed ? (
                  <Text style={styles.timeText}>{hours[day].start} - {hours[day].end}</Text>
                ) : (
                  <Text style={styles.closedBadge}>Kapalı</Text>
                )}
              </View>
            ))}
            <SaveButton onPress={saveWorkingHours} saving={saving} />
          </View>
        );

      case 'services':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.hint}>Müşterilerinize sunduğunuz bir hizmet ekleyin.</Text>
            <TextInput style={styles.input} placeholder="Hizmet adı (Örn: Saç Kesimi)" value={serviceName} onChangeText={setServiceName} />
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Süre (dk)" keyboardType="numeric" value={serviceDuration} onChangeText={setServiceDuration} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Fiyat (TL)" keyboardType="numeric" value={servicePrice} onChangeText={setServicePrice} />
            </View>
            <SaveButton onPress={saveService} saving={saving} label="Hizmet Ekle ve Devam" />
          </View>
        );

      case 'staff':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.hint}>Randevularda görevlendirilecek bir personel ekleyin.</Text>
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Ad" value={staffFirstName} onChangeText={setStaffFirstName} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Soyad" value={staffLastName} onChangeText={setStaffLastName} />
            </View>
            <TextInput style={styles.input} placeholder="Telefon (opsiyonel)" keyboardType="phone-pad" value={staffPhone} onChangeText={setStaffPhone} />
            <SaveButton onPress={saveStaff} saving={saving} label="Personel Ekle ve Devam" />
          </View>
        );

      case 'location':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.hint}>Müşterilerinizin sizi bulabilmesi için adres girin.</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="İşletme adresi" multiline value={address} onChangeText={setAddress} />
            <SaveButton onPress={saveLocation} saving={saving} />
          </View>
        );

      case 'notifications':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.hint}>Bildirim kanallarını seçin.</Text>
            <ChannelPicker label="Randevu Onayı" value={confirmationChannel} onChange={setConfirmationChannel} />
            <ChannelPicker label="Randevu Hatırlatma" value={reminderChannel} onChange={setReminderChannel} />
            <SaveButton onPress={saveNotifications} saving={saving} />
          </View>
        );

      case 'theme':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.hint}>İşletmenizin renk temasını seçin.</Text>
            <View style={styles.colorGrid}>
              {['#163974', '#065F46', '#7C3AED', '#DC2626', '#D97706', '#111827'].map(color => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setPrimaryColor(color)}
                  style={[styles.colorOption, { backgroundColor: color }, primaryColor === color && styles.colorSelected]}
                />
              ))}
            </View>
            <View style={[styles.previewBox, { backgroundColor: primaryColor }]}>
              <Text style={styles.previewText}>Tema Önizleme</Text>
            </View>
            <SaveButton onPress={saveTheme} saving={saving} />
          </View>
        );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>İşletme Kurulumu</Text>
            <Text style={styles.subtitle}>Adım {currentStep + 1} / {STEPS.length}</Text>
          </View>
          <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {/* Step indicators */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepIndicators}>
          {STEPS.map((s, i) => {
            const isCompleted = completedSteps.includes(s.key);
            const isCurrent = i === currentStep;
            return (
              <TouchableOpacity key={s.key} onPress={() => setCurrentStep(i)} style={styles.stepDot}>
                <View style={[
                  styles.dot,
                  isCompleted && styles.dotCompleted,
                  isCurrent && styles.dotCurrent,
                ]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : (
                    <Ionicons name={s.icon} size={14} color={isCurrent ? '#fff' : '#9ca3af'} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Step header */}
        <View style={styles.stepHeader}>
          <View style={styles.stepIconBox}>
            <Ionicons name={step.icon} size={20} color="#3b82f6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDesc}>{step.description}</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {renderStepContent()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={goPrev} disabled={currentStep === 0} style={styles.prevBtn}>
            <Ionicons name="chevron-back" size={18} color={currentStep === 0 ? '#d1d5db' : '#6b7280'} />
            <Text style={[styles.prevText, currentStep === 0 && { color: '#d1d5db' }]}>Önceki</Text>
          </TouchableOpacity>

          <View style={styles.footerRight}>
            <TouchableOpacity onPress={onDismiss} style={styles.skipBtn}>
              <Text style={styles.skipText}>Sonra Tamamla</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goNext} style={styles.nextBtn}>
              <Text style={styles.nextText}>{currentStep === STEPS.length - 1 ? 'Bitir' : 'Sonraki'}</Text>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SaveButton({ onPress, saving, label = 'Kaydet ve Devam' }: { onPress: () => void; saving: boolean; label?: string }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.5 }]}>
      {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{label}</Text>}
    </TouchableOpacity>
  );
}

function ChannelPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const options = [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'sms', label: 'SMS' },
    { value: 'smart', label: 'Akıllı' },
  ];
  return (
    <View style={styles.channelRow}>
      <Text style={styles.channelLabel}>{label}</Text>
      <View style={styles.channelBtns}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.channelBtn, value === opt.value && styles.channelBtnActive]}
          >
            <Text style={[styles.channelBtnText, value === opt.value && styles.channelBtnTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 56 : 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  closeBtn: { padding: 8 },
  progressBg: { height: 4, backgroundColor: '#e5e7eb', marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: '#3b82f6' },
  stepIndicators: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12 },
  stepDot: { alignItems: 'center', marginHorizontal: 8 },
  dot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  dotCompleted: { backgroundColor: '#22c55e' },
  dotCurrent: { backgroundColor: '#3b82f6' },
  stepHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  stepIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  stepDesc: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  formContainer: { gap: 12 },
  hint: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, backgroundColor: '#f9fafb' },
  row: { flexDirection: 'row' },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 4 },
  dayLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  closedText: { color: '#9ca3af', textDecorationLine: 'line-through' },
  timeText: { fontSize: 13, color: '#6b7280' },
  closedBadge: { fontSize: 12, color: '#9ca3af' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginVertical: 8 },
  colorOption: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: 'transparent' },
  colorSelected: { borderColor: '#3b82f6', transform: [{ scale: 1.1 }] },
  previewBox: { padding: 16, borderRadius: 12, marginTop: 8 },
  previewText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  saveBtn: { backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  channelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  channelLabel: { fontSize: 14, fontWeight: '500', color: '#374151' },
  channelBtns: { flexDirection: 'row', gap: 6 },
  channelBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f3f4f6' },
  channelBtnActive: { backgroundColor: '#3b82f6' },
  channelBtnText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  channelBtnTextActive: { color: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingBottom: Platform.OS === 'ios' ? 32 : 12 },
  prevBtn: { flexDirection: 'row', alignItems: 'center' },
  prevText: { fontSize: 14, color: '#6b7280' },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skipBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  skipText: { fontSize: 13, color: '#9ca3af' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  nextText: { color: '#fff', fontWeight: '600', fontSize: 14, marginRight: 4 },
});
