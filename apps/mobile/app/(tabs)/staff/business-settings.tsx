import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Switch,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../../src/services/api';

const THEME_COLOR = '#163974';

interface WorkingDay {
  start: string;
  end: string;
  closed: boolean;
}

interface WorkingHours {
  monday: WorkingDay;
  tuesday: WorkingDay;
  wednesday: WorkingDay;
  thursday: WorkingDay;
  friday: WorkingDay;
  saturday: WorkingDay;
  sunday: WorkingDay;
}

interface Theme {
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  headerImage: string;
}

interface Location {
  latitude: string;
  longitude: string;
  address: string;
}

interface Documents {
  identityDocument: string | null;
  taxDocument: string | null;
  iban: string;
  signatureDocument: string | null;
}

interface SettingsData {
  businessName: string;
  businessType: string;
  businessDescription: string;
  address: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  username: string;
  theme: Theme;
  location: Location;
  documents: Documents;
  workingHours: WorkingHours;
  appointmentTimeInterval: number;
  blacklistThreshold: number;
  reminderMinutes: number;
  cardPaymentEnabled: boolean;
  plan: string;
  status: string;
}

const DAYS = [
  { key: 'monday', label: 'Pazartesi' },
  { key: 'tuesday', label: 'Salı' },
  { key: 'wednesday', label: 'Çarşamba' },
  { key: 'thursday', label: 'Perşembe' },
  { key: 'friday', label: 'Cuma' },
  { key: 'saturday', label: 'Cumartesi' },
  { key: 'sunday', label: 'Pazar' },
];

const TIME_INTERVALS = [
  { value: 5, label: '5 dakika' },
  { value: 10, label: '10 dakika' },
  { value: 15, label: '15 dakika' },
  { value: 20, label: '20 dakika' },
  { value: 30, label: '30 dakika' },
  { value: 45, label: '45 dakika' },
  { value: 60, label: '60 dakika' },
];

const REMINDER_OPTIONS = [
  { value: 10, label: '10 dakika önce' },
  { value: 30, label: '30 dakika önce' },
  { value: 60, label: '1 saat önce' },
  { value: 120, label: '2 saat önce' },
  { value: 180, label: '3 saat önce' },
  { value: 240, label: '4 saat önce' },
  { value: 360, label: '6 saat önce' },
  { value: 720, label: '12 saat önce' },
  { value: 1440, label: '1 gün önce' },
];

const BUSINESS_TYPES = [
  { value: 'salon', label: 'Güzellik Salonu' },
  { value: 'barbershop', label: 'Berber' },
  { value: 'spa', label: 'SPA' },
  { value: 'clinic', label: 'Klinik' },
  { value: 'dental', label: 'Diş Kliniği' },
  { value: 'other', label: 'Diğer' },
];

export default function BusinessSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<SettingsData | null>(null);
  const [activeTab, setActiveTab] = useState<'business' | 'hours' | 'appointments' | 'theme'>('business');
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<SettingsData>>({});

  // Modal states
  const [showTimeIntervalPicker, setShowTimeIntervalPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showBusinessTypePicker, setShowBusinessTypePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<{ day: string; field: 'start' | 'end' } | null>(null);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/mobile/settings');
      if (response.data.success) {
        setData(response.data.data);
        setFormData(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error?.response?.data || error.message);
      Alert.alert('Hata', 'Ayarlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSettings();
  }, []);

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateNestedFormData = (parent: string, key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev as any)[parent],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const updateWorkingHours = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...(prev.workingHours as WorkingHours),
        [day]: {
          ...((prev.workingHours as WorkingHours)?.[day as keyof WorkingHours] || {}),
          [field]: value,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setSaving(true);
    try {
      const response = await api.put('/api/mobile/settings', formData);
      if (response.data.success) {
        Alert.alert('Başarılı', 'Ayarlar kaydedildi');
        setHasChanges(false);
        fetchSettings();
      } else {
        Alert.alert('Hata', response.data.message || 'Ayarlar kaydedilemedi');
      }
    } catch (error: any) {
      console.error('Save error:', error?.response?.data || error.message);
      Alert.alert('Hata', 'Ayarlar kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async (type: 'logo' | 'headerImage') => {
    // TODO: expo-image-picker kurulduktan sonra aktif edilecek
    Alert.alert(
      'Bilgi',
      'Logo değiştirme özelliği web panelinden yapılabilir.',
      [{ text: 'Tamam' }]
    );
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        options.push(time);
      }
    }
    return options;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Ayarlar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
          <Text style={styles.loadingText}>Ayarlar yüklenemedi</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSettings}>
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>İşletme Ayarları</Text>
            <Text style={styles.subtitle}>{data.businessName}</Text>
          </View>
          {hasChanges && (
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="checkmark" size={22} color="#fff" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {[
              { id: 'business', label: 'İşletme', icon: 'business-outline' },
              { id: 'hours', label: 'Çalışma Saatleri', icon: 'time-outline' },
              { id: 'appointments', label: 'Randevu', icon: 'calendar-outline' },
              { id: 'theme', label: 'Tema', icon: 'color-palette-outline' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as any)}
                style={styles.tabWrapper}
              >
                {activeTab === tab.id ? (
                  <LinearGradient
                    colors={[THEME_COLOR, '#1e4a8f']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tabActive}
                  >
                    <Ionicons name={tab.icon as any} size={16} color="#fff" />
                    <Text style={styles.tabTextActive}>{tab.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.tabInactive}>
                    <Ionicons name={tab.icon as any} size={16} color="#6B7280" />
                    <Text style={styles.tabTextInactive}>{tab.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME_COLOR]} />}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Business Tab */}
          {activeTab === 'business' && (
            <View style={styles.section}>
              {/* Business Info Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>İşletme Bilgileri</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>İşletme Adı</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.businessName}
                    onChangeText={(text) => updateFormData('businessName', text)}
                    placeholder="İşletme adını girin"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>İşletme Türü</Text>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowBusinessTypePicker(true)}
                  >
                    <Text style={styles.selectText}>
                      {BUSINESS_TYPES.find(t => t.value === formData.businessType)?.label || 'Seçin'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Açıklama</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.businessDescription}
                    onChangeText={(text) => updateFormData('businessDescription', text)}
                    placeholder="İşletme açıklaması"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Adres</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.address}
                    onChangeText={(text) => updateFormData('address', text)}
                    placeholder="İşletme adresi"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>

              {/* Owner Info Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Yönetici Bilgileri</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Ad Soyad</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.ownerName}
                    onChangeText={(text) => updateFormData('ownerName', text)}
                    placeholder="Yönetici adı"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>E-posta</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.ownerEmail}
                    onChangeText={(text) => updateFormData('ownerEmail', text)}
                    placeholder="E-posta adresi"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Telefon</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(text) => updateFormData('phone', text)}
                    placeholder="Telefon numarası"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Payment Settings */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Ödeme Ayarları</Text>

                <View style={styles.switchRow}>
                  <View style={styles.switchInfo}>
                    <Ionicons name="card-outline" size={22} color={THEME_COLOR} />
                    <View style={styles.switchText}>
                      <Text style={styles.switchLabel}>Kredi Kartı Ödemesi</Text>
                      <Text style={styles.switchDescription}>Müşteriler kredi kartı ile ödeme yapabilir</Text>
                    </View>
                  </View>
                  <Switch
                    value={formData.cardPaymentEnabled}
                    onValueChange={(value) => updateFormData('cardPaymentEnabled', value)}
                    trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                    thumbColor={formData.cardPaymentEnabled ? THEME_COLOR : '#fff'}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Working Hours Tab */}
          {activeTab === 'hours' && (
            <View style={styles.section}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Çalışma Saatleri</Text>
                <Text style={styles.cardDescription}>Her gün için açılış ve kapanış saatlerini belirleyin</Text>

                {DAYS.map((day) => {
                  const dayData = (formData.workingHours as WorkingHours)?.[day.key as keyof WorkingHours];
                  const isClosed = dayData?.closed || false;

                  return (
                    <View key={day.key} style={styles.dayRow}>
                      <View style={styles.dayHeader}>
                        <Text style={[styles.dayLabel, isClosed && styles.dayLabelClosed]}>
                          {day.label}
                        </Text>
                        <View style={styles.closedSwitch}>
                          <Text style={styles.closedLabel}>Kapalı</Text>
                          <Switch
                            value={isClosed}
                            onValueChange={(value) => updateWorkingHours(day.key, 'closed', value)}
                            trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
                            thumbColor={isClosed ? '#EF4444' : '#fff'}
                          />
                        </View>
                      </View>

                      {!isClosed && (
                        <View style={styles.timeRow}>
                          <TouchableOpacity
                            style={styles.timeButton}
                            onPress={() => setShowTimePicker({ day: day.key, field: 'start' })}
                          >
                            <Ionicons name="time-outline" size={16} color="#6B7280" />
                            <Text style={styles.timeText}>{dayData?.start || '09:00'}</Text>
                          </TouchableOpacity>
                          <Text style={styles.timeSeparator}>-</Text>
                          <TouchableOpacity
                            style={styles.timeButton}
                            onPress={() => setShowTimePicker({ day: day.key, field: 'end' })}
                          >
                            <Ionicons name="time-outline" size={16} color="#6B7280" />
                            <Text style={styles.timeText}>{dayData?.end || '18:00'}</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <View style={styles.section}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Randevu Ayarları</Text>

                {/* Time Interval */}
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={[styles.settingIcon, { backgroundColor: '#DBEAFE' }]}>
                      <Ionicons name="grid-outline" size={20} color="#3B82F6" />
                    </View>
                    <View>
                      <Text style={styles.settingLabel}>Zaman Aralığı</Text>
                      <Text style={styles.settingDescription}>Takvimde gösterilecek slot süresi</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.settingButton}
                    onPress={() => setShowTimeIntervalPicker(true)}
                  >
                    <Text style={styles.settingValue}>
                      {TIME_INTERVALS.find(t => t.value === formData.appointmentTimeInterval)?.label || '30 dk'}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {/* Blacklist Threshold */}
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={[styles.settingIcon, { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons name="ban-outline" size={20} color="#EF4444" />
                    </View>
                    <View>
                      <Text style={styles.settingLabel}>Kara Liste Eşiği</Text>
                      <Text style={styles.settingDescription}>Otomatik kara listeye almak için gelmeme sayısı</Text>
                    </View>
                  </View>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => {
                        const current = formData.blacklistThreshold || 3;
                        if (current > 1) updateFormData('blacklistThreshold', current - 1);
                      }}
                    >
                      <Ionicons name="remove" size={18} color={THEME_COLOR} />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{formData.blacklistThreshold || 3}</Text>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => {
                        const current = formData.blacklistThreshold || 3;
                        if (current < 10) updateFormData('blacklistThreshold', current + 1);
                      }}
                    >
                      <Ionicons name="add" size={18} color={THEME_COLOR} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Reminder Time */}
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={[styles.settingIcon, { backgroundColor: '#D1FAE5' }]}>
                      <Ionicons name="notifications-outline" size={20} color="#059669" />
                    </View>
                    <View>
                      <Text style={styles.settingLabel}>Hatırlatma Süresi</Text>
                      <Text style={styles.settingDescription}>WhatsApp hatırlatma zamanı</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.settingButton}
                    onPress={() => setShowReminderPicker(true)}
                  >
                    <Text style={styles.settingValue}>
                      {REMINDER_OPTIONS.find(r => r.value === formData.reminderMinutes)?.label || '2 saat önce'}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Theme Tab */}
          {activeTab === 'theme' && (
            <View style={styles.section}>
              {/* Logo Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Logo</Text>
                <Text style={styles.cardDescription}>İşletmenizin logosu</Text>

                <TouchableOpacity style={styles.imagePickerContainer} onPress={() => pickImage('logo')}>
                  {formData.theme?.logo ? (
                    <Image source={{ uri: formData.theme.logo }} style={styles.logoPreview} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                      <Text style={styles.imagePlaceholderText}>Logo Seç</Text>
                    </View>
                  )}
                  <View style={styles.imageOverlay}>
                    <Ionicons name="camera" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Colors Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Renkler</Text>
                <Text style={styles.cardDescription}>Marka renkleri</Text>

                <View style={styles.colorRow}>
                  <Text style={styles.colorLabel}>Ana Renk</Text>
                  <View style={styles.colorPreviewContainer}>
                    <View
                      style={[styles.colorPreview, { backgroundColor: formData.theme?.primaryColor || THEME_COLOR }]}
                    />
                    <TextInput
                      style={styles.colorInput}
                      value={formData.theme?.primaryColor || THEME_COLOR}
                      onChangeText={(text) => updateNestedFormData('theme', 'primaryColor', text)}
                      placeholder="#163974"
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <View style={styles.colorRow}>
                  <Text style={styles.colorLabel}>İkincil Renk</Text>
                  <View style={styles.colorPreviewContainer}>
                    <View
                      style={[styles.colorPreview, { backgroundColor: formData.theme?.secondaryColor || '#0F2A52' }]}
                    />
                    <TextInput
                      style={styles.colorInput}
                      value={formData.theme?.secondaryColor || '#0F2A52'}
                      onChangeText={(text) => updateNestedFormData('theme', 'secondaryColor', text)}
                      placeholder="#0F2A52"
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              </View>

              {/* Subscription Info */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Abonelik</Text>
                <View style={styles.subscriptionInfo}>
                  <View style={styles.subscriptionRow}>
                    <Text style={styles.subscriptionLabel}>Plan</Text>
                    <View style={styles.planBadge}>
                      <Text style={styles.planText}>{data.plan}</Text>
                    </View>
                  </View>
                  <View style={styles.subscriptionRow}>
                    <Text style={styles.subscriptionLabel}>Durum</Text>
                    <View style={[styles.statusBadge, data.status === 'active' && styles.statusActive]}>
                      <Text style={[styles.statusText, data.status === 'active' && styles.statusTextActive]}>
                        {data.status === 'active' ? 'Aktif' : data.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Time Interval Picker Modal */}
      <Modal visible={showTimeIntervalPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Zaman Aralığı</Text>
              <TouchableOpacity onPress={() => setShowTimeIntervalPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {TIME_INTERVALS.map((interval) => (
                <TouchableOpacity
                  key={interval.value}
                  style={[
                    styles.modalOption,
                    formData.appointmentTimeInterval === interval.value && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    updateFormData('appointmentTimeInterval', interval.value);
                    setShowTimeIntervalPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      formData.appointmentTimeInterval === interval.value && styles.modalOptionTextSelected,
                    ]}
                  >
                    {interval.label}
                  </Text>
                  {formData.appointmentTimeInterval === interval.value && (
                    <Ionicons name="checkmark" size={20} color={THEME_COLOR} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reminder Picker Modal */}
      <Modal visible={showReminderPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hatırlatma Süresi</Text>
              <TouchableOpacity onPress={() => setShowReminderPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {REMINDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalOption,
                    formData.reminderMinutes === option.value && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    updateFormData('reminderMinutes', option.value);
                    setShowReminderPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      formData.reminderMinutes === option.value && styles.modalOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {formData.reminderMinutes === option.value && (
                    <Ionicons name="checkmark" size={20} color={THEME_COLOR} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Business Type Picker Modal */}
      <Modal visible={showBusinessTypePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>İşletme Türü</Text>
              <TouchableOpacity onPress={() => setShowBusinessTypePicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {BUSINESS_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.modalOption,
                    formData.businessType === type.value && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    updateFormData('businessType', type.value);
                    setShowBusinessTypePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      formData.businessType === type.value && styles.modalOptionTextSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                  {formData.businessType === type.value && (
                    <Ionicons name="checkmark" size={20} color={THEME_COLOR} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal visible={!!showTimePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showTimePicker?.field === 'start' ? 'Açılış Saati' : 'Kapanış Saati'}
              </Text>
              <TouchableOpacity onPress={() => setShowTimePicker(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {generateTimeOptions().map((time) => {
                const currentValue = showTimePicker
                  ? (formData.workingHours as WorkingHours)?.[showTimePicker.day as keyof WorkingHours]?.[showTimePicker.field]
                  : null;

                return (
                  <TouchableOpacity
                    key={time}
                    style={[styles.modalOption, currentValue === time && styles.modalOptionSelected]}
                    onPress={() => {
                      if (showTimePicker) {
                        updateWorkingHours(showTimePicker.day, showTimePicker.field, time);
                        setShowTimePicker(null);
                      }
                    }}
                  >
                    <Text style={[styles.modalOptionText, currentValue === time && styles.modalOptionTextSelected]}>
                      {time}
                    </Text>
                    {currentValue === time && <Ionicons name="checkmark" size={20} color={THEME_COLOR} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: THEME_COLOR,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },

  // Tabs
  tabContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabWrapper: {
    marginRight: 8,
  },
  tabActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tabInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  tabTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  tabTextInactive: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },

  scrollContent: {
    padding: 16,
  },

  // Section
  section: {
    gap: 16,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 16,
  },

  // Input
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Select
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectText: {
    fontSize: 15,
    color: '#1F2937',
  },

  // Switch Row
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  switchText: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  switchDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Working Hours
  dayRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  dayLabelClosed: {
    color: '#9CA3AF',
  },
  closedSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closedLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  timeSeparator: {
    fontSize: 16,
    color: '#9CA3AF',
  },

  // Settings Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValue: {
    fontSize: 13,
    fontWeight: '500',
    color: THEME_COLOR,
  },

  // Counter
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 24,
    textAlign: 'center',
  },

  // Image Picker
  imagePickerContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginTop: 8,
  },
  logoPreview: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Colors
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  colorPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  colorInput: {
    width: 100,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Subscription
  subscriptionInfo: {
    gap: 12,
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  planBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME_COLOR,
  },
  statusBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusTextActive: {
    color: '#059669',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalOptionSelected: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  modalOptionText: {
    fontSize: 15,
    color: '#4B5563',
  },
  modalOptionTextSelected: {
    color: THEME_COLOR,
    fontWeight: '600',
  },
});
