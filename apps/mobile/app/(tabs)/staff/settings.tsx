import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  Platform,
  Linking,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../../../src/store/auth.store';
import api from '../../../src/services/api';
import DrawerMenu from '../../../src/components/DrawerMenu';
import Header from '../../../src/components/Header';

const THEME_COLOR = '#163974';

// HIG/Material Design compliant header values
const IS_IOS = Platform.OS === 'ios';
const HEADER_BTN_SIZE = IS_IOS ? 44 : 48;
const HEADER_BTN_RADIUS = IS_IOS ? 12 : 16;

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

interface BlockedDate {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  staffId?: string | null;
}

interface MessageTemplates {
  whatsappConfirmation: string;
  smsConfirmation: string;
  whatsappReminder: string;
  smsReminder: string;
  staffDailyReminder: string;
  ownerDailyReminder: string;
  whatsappSurvey: string;
  smsSurvey: string;
}

interface NotificationSettings {
  confirmationChannel: string;
  reminderChannel: string;
  staffDailyChannel: string;
  ownerDailyChannel: string;
  autoSendConfirmation?: boolean;
  surveyChannel?: string;
  autoSendSurvey?: boolean;
  surveyDelayMinutes?: number;
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
  messageTemplates: MessageTemplates | null;
  notificationSettings: NotificationSettings | null;
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

const CHANNEL_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
  { value: 'both', label: 'Her İkisi' },
  { value: 'off', label: 'Kapalı' },
];

const STAFF_CHANNEL_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
  { value: 'off', label: 'Kapalı' },
];

const DEFAULT_TEMPLATES: MessageTemplates = {
  whatsappConfirmation: `Merhaba {musteriAdi},

Randevunuz basariyla olusturuldu! 🎉

📅 *Tarih:* {tarih}
🕐 *Saat:* {saat}
👤 *Personel:* {personel}
💼 *Hizmet:* {hizmet}
💰 *Ucret:* {ucret}
📍 *Adres:* {isletmeAdres}

Gorusmek uzere! 😊

*{isletmeAdi}*
📞 {isletmeTelefon}`,

  smsConfirmation: `{isletmeAdi} randevunuz olusturuldu. Tarih: {tarih}, Saat: {saat}, Personel: {personel}, Hizmet: {hizmet}, Ucret: {ucret}. Gorusmek uzere! Tel: {isletmeTelefon}`,

  whatsappReminder: `Merhaba {musteriAdi},

⏰ *Randevunuza {hatirlatmaSuresi} kaldi!*

📅 *Tarih:* {tarih}
🕐 *Saat:* {saat}
👤 *Personel:* {personel}
💼 *Hizmet:* {hizmet}
📍 *Adres:* {isletmeAdres}

Sizi bekliyoruz! 😊

*{isletmeAdi}*
📞 {isletmeTelefon}`,

  smsReminder: `{isletmeAdi} randevunuz {hatirlatmaSuresi}. Tarih: {tarih}, Saat: {saat}, Hizmet: {hizmet}. Gorusmek uzere!`,

  staffDailyReminder: `🌅 Gunaydin {personelAdi}!

📅 *{gun}, {tarih}*

Bugun {randevuSayisi} randevunuz var:

{randevuListesi}

Iyi calismalar! 💪

_{isletmeAdi}_`,

  ownerDailyReminder: `🌙 Iyi aksamlar {sahipAdi}!

📊 *{gun}, {tarih} - Gunluk Ozet*

━━━━━━━━━━━━━━━━━━━━

👥 *Musteri Istatistikleri*
✅ Gelen Musteri: {gelenMusteri}
❌ Iptal: {iptalSayisi}
⚠️ Gelmedi: {gelmediler}
📋 Toplam Randevu: {toplamRandevu}

━━━━━━━━━━━━━━━━━━━━

💰 *Gelir Raporu*
💵 Nakit: {nakitGelir} TL
💳 Kredi Karti: {kartGelir} TL
🎁 Paket: {paketGelir} TL

━━━━━━━━━━━━━━━━━━━━

💎 *Toplam Gelir: {toplamGelir} TL*

_{isletmeAdi}_`,

  whatsappSurvey: `Merhaba {musteriAdi},

{isletmeAdi}'deki randevunuz tamamlandi! 🎉

Hizmetimizden memnun kaldiniz mi? Geri bildiriminiz bizim icin cok degerli.

📝 Degerlendirme yapmak icin: {anketLinki}

Tesekkurler! 🙏
*{isletmeAdi}*`,

  smsSurvey: `{isletmeAdi} randevunuz tamamlandi. Degerlendirme icin: {anketLinki} Tesekkurler!`,
};

const CUSTOMER_VARIABLES = [
  { key: '{musteriAdi}', label: 'Müşteri Adı' },
  { key: '{tarih}', label: 'Tarih' },
  { key: '{saat}', label: 'Saat' },
  { key: '{personel}', label: 'Personel' },
  { key: '{hizmet}', label: 'Hizmet' },
  { key: '{ucret}', label: 'Ücret' },
  { key: '{isletmeAdi}', label: 'İşletme Adı' },
  { key: '{isletmeTelefon}', label: 'İşletme Telefon' },
  { key: '{isletmeAdres}', label: 'İşletme Adres' },
  { key: '{hatirlatmaSuresi}', label: 'Hatırlatma Süresi' },
];

const STAFF_VARIABLES = [
  { key: '{personelAdi}', label: 'Personel Adı' },
  { key: '{gun}', label: 'Gün' },
  { key: '{tarih}', label: 'Tarih' },
  { key: '{randevuSayisi}', label: 'Randevu Sayısı' },
  { key: '{randevuListesi}', label: 'Randevu Listesi' },
  { key: '{isletmeAdi}', label: 'İşletme Adı' },
];

const OWNER_VARIABLES = [
  { key: '{sahipAdi}', label: 'Sahip Adı' },
  { key: '{gun}', label: 'Gün' },
  { key: '{tarih}', label: 'Tarih' },
  { key: '{gelenMusteri}', label: 'Gelen Müşteri' },
  { key: '{iptalSayisi}', label: 'İptal Sayısı' },
  { key: '{gelmediler}', label: 'Gelmediler' },
  { key: '{toplamRandevu}', label: 'Toplam Randevu' },
  { key: '{nakitGelir}', label: 'Nakit Gelir' },
  { key: '{kartGelir}', label: 'Kart Gelir' },
  { key: '{paketGelir}', label: 'Paket Gelir' },
  { key: '{toplamGelir}', label: 'Toplam Gelir' },
  { key: '{isletmeAdi}', label: 'İşletme Adı' },
];

const SURVEY_VARIABLES = [
  { key: '{musteriAdi}', label: 'Müşteri Adı' },
  { key: '{tarih}', label: 'Tarih' },
  { key: '{saat}', label: 'Saat' },
  { key: '{personel}', label: 'Personel' },
  { key: '{hizmet}', label: 'Hizmet' },
  { key: '{isletmeAdi}', label: 'İşletme Adı' },
  { key: '{anketLinki}', label: 'Anket Linki' },
];

const SURVEY_DELAY_OPTIONS = [
  { value: 0, label: 'Hemen' },
  { value: 60, label: '1 saat sonra' },
  { value: 120, label: '2 saat sonra' },
  { value: 1440, label: '1 gün sonra' },
];

type TemplateKey = keyof MessageTemplates;

// Tab sıralaması web ile aynı
const TABS = [
  { id: 'theme', label: 'Tema', icon: 'color-palette-outline' },
  { id: 'business', label: 'İşletme', icon: 'business-outline' },
  { id: 'owner', label: 'Yönetici', icon: 'person-outline' },
  { id: 'login', label: 'Giriş', icon: 'key-outline' },
  { id: 'location', label: 'Konum', icon: 'location-outline' },
  { id: 'working', label: 'Çalışma', icon: 'time-outline' },
  { id: 'documents', label: 'Belgeler', icon: 'document-outline' },
  { id: 'holidays', label: 'Tatiller', icon: 'calendar-outline' },
  { id: 'messages', label: 'Mesajlar', icon: 'chatbubble-outline' },
];

type TabId = 'theme' | 'business' | 'owner' | 'login' | 'location' | 'working' | 'documents' | 'holidays' | 'messages';

export default function StaffSettingsScreen() {
  const router = useRouter();
  const { user, selectedTenant, logout, availableTenants } = useAuthStore();

  // Check if user is owner (only owners can access settings)
  const isOwner = user?.userType === 'owner';

  // Settings state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<SettingsData | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('theme');
  const [hasChanges, setHasChanges] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState<Partial<SettingsData>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Modal states
  const [showTimeIntervalPicker, setShowTimeIntervalPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showBusinessTypePicker, setShowBusinessTypePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<{ day: string; field: 'start' | 'end' } | null>(null);
  const [showChannelPicker, setShowChannelPicker] = useState<{ key: string; options: typeof CHANNEL_OPTIONS } | null>(null);
  const [activeTemplateField, setActiveTemplateField] = useState<TemplateKey | null>(null);
  const [templateCursorPos, setTemplateCursorPos] = useState<number>(0);

  // Holidays state
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [blockedDatesLoading, setBlockedDatesLoading] = useState(false);
  const [blockedDateSaving, setBlockedDateSaving] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState({ title: '', startDate: '', endDate: '' });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/mobile/settings');
      if (response.data.success) {
        setData(response.data.data);
        setFormData(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error?.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [isOwner]);

  // Lazy load blocked dates when holidays tab is selected
  useEffect(() => {
    if (activeTab === 'holidays' && isOwner && blockedDates.length === 0 && !blockedDatesLoading) {
      fetchBlockedDates();
    }
  }, [activeTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSettings();
    if (activeTab === 'holidays') {
      fetchBlockedDates();
    }
  }, [activeTab]);

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
    if (!hasChanges && !newPassword) return;

    setSaving(true);
    try {
      const saveData = { ...formData };
      if (newPassword.trim()) {
        (saveData as any).password = newPassword;
      }

      const response = await api.put('/api/mobile/settings', saveData);
      if (response.data.success) {
        Alert.alert('Başarılı', 'Ayarlar kaydedildi');
        setHasChanges(false);
        setNewPassword('');
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

  const handleLogout = async () => {
    Alert.alert('Çıkış Yap', 'Oturumu kapatmak istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleSwitchTenant = () => {
    if (availableTenants.length > 1) {
      router.push('/(auth)/select-tenant');
    }
  };

  const pickImage = async (type: 'logo' | 'headerImage') => {
    Alert.alert(
      'Bilgi',
      'Görsel değiştirme özelliği web panelinden yapılabilir.',
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

  const formatIBAN = (text: string) => {
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return cleaned.slice(0, 26);
  };

  const getMessageTemplate = (key: TemplateKey): string => {
    const templates = (formData as any).messageTemplates as MessageTemplates | null;
    return templates?.[key] || DEFAULT_TEMPLATES[key];
  };

  const updateMessageTemplate = (key: TemplateKey, value: string) => {
    const current = ((formData as any).messageTemplates as MessageTemplates | null) || { ...DEFAULT_TEMPLATES };
    setFormData(prev => ({
      ...prev,
      messageTemplates: { ...current, [key]: value },
    }));
    setHasChanges(true);
  };

  const resetTemplate = (key: TemplateKey) => {
    updateMessageTemplate(key, DEFAULT_TEMPLATES[key]);
  };

  const getNotificationSetting = (key: keyof NotificationSettings): string => {
    const settings = (formData as any).notificationSettings as NotificationSettings | null;
    const defaults: Record<string, string> = {
      confirmationChannel: 'whatsapp',
      reminderChannel: 'both',
      staffDailyChannel: 'whatsapp',
      ownerDailyChannel: 'whatsapp',
    };
    return settings?.[key] || defaults[key] || 'whatsapp';
  };

  const updateNotificationSetting = (key: keyof NotificationSettings, value: string) => {
    const current = ((formData as any).notificationSettings as NotificationSettings | null) || {
      confirmationChannel: 'whatsapp',
      reminderChannel: 'both',
      staffDailyChannel: 'whatsapp',
      ownerDailyChannel: 'whatsapp',
    };
    setFormData(prev => ({
      ...prev,
      notificationSettings: { ...current, [key]: value },
    }));
    setHasChanges(true);
  };

  const getAutoSendConfirmation = (): boolean => {
    const settings = (formData as any).notificationSettings as NotificationSettings | null;
    return settings?.autoSendConfirmation || false;
  };

  const toggleAutoSendConfirmation = (value: boolean) => {
    const current = ((formData as any).notificationSettings as NotificationSettings | null) || {
      confirmationChannel: 'whatsapp',
      reminderChannel: 'both',
      staffDailyChannel: 'whatsapp',
      ownerDailyChannel: 'whatsapp',
    };
    setFormData(prev => ({
      ...prev,
      notificationSettings: { ...current, autoSendConfirmation: value },
    }));
    setHasChanges(true);
  };

  const getAutoSendSurvey = (): boolean => {
    const settings = (formData as any).notificationSettings as NotificationSettings | null;
    return settings?.autoSendSurvey || false;
  };

  const toggleAutoSendSurvey = (value: boolean) => {
    const current = ((formData as any).notificationSettings as NotificationSettings | null) || {};
    setFormData(prev => ({
      ...prev,
      notificationSettings: { ...current, autoSendSurvey: value },
    }));
    setHasChanges(true);
  };

  const getSurveyDelayMinutes = (): number => {
    const settings = (formData as any).notificationSettings as NotificationSettings | null;
    return settings?.surveyDelayMinutes || 0;
  };

  const setSurveyDelayMinutes = (value: number) => {
    const current = ((formData as any).notificationSettings as NotificationSettings | null) || {};
    setFormData(prev => ({
      ...prev,
      notificationSettings: { ...current, surveyDelayMinutes: value },
    }));
    setHasChanges(true);
  };

  const insertVariable = (templateKey: TemplateKey, variable: string) => {
    const currentText = getMessageTemplate(templateKey);
    const pos = (activeTemplateField === templateKey && templateCursorPos) ? templateCursorPos : currentText.length;
    const newText = currentText.slice(0, pos) + variable + currentText.slice(pos);
    updateMessageTemplate(templateKey, newText);
  };

  const getChannelLabel = (value: string): string => {
    const all = [...CHANNEL_OPTIONS, ...STAFF_CHANNEL_OPTIONS];
    return all.find(o => o.value === value)?.label || value;
  };

  // Blocked dates functions
  const fetchBlockedDates = async () => {
    setBlockedDatesLoading(true);
    try {
      const response = await api.get('/api/mobile/blocked-dates');
      if (response.data.success) {
        const sorted = (response.data.data || []).sort((a: BlockedDate, b: BlockedDate) =>
          a.startDate.localeCompare(b.startDate)
        );
        setBlockedDates(sorted);
      }
    } catch (error: any) {
      console.error('Error fetching blocked dates:', error?.response?.data || error.message);
    } finally {
      setBlockedDatesLoading(false);
    }
  };

  const handleAddBlockedDate = async () => {
    if (!newBlockedDate.title.trim()) {
      Alert.alert('Hata', 'Tatil başlığı giriniz');
      return;
    }
    if (!newBlockedDate.startDate || !newBlockedDate.endDate) {
      Alert.alert('Hata', 'Başlangıç ve bitiş tarihi seçiniz');
      return;
    }
    if (newBlockedDate.startDate > newBlockedDate.endDate) {
      Alert.alert('Hata', 'Başlangıç tarihi bitiş tarihinden sonra olamaz');
      return;
    }

    setBlockedDateSaving(true);
    try {
      const response = await api.post('/api/mobile/blocked-dates', {
        title: newBlockedDate.title.trim(),
        startDate: newBlockedDate.startDate,
        endDate: newBlockedDate.endDate,
      });
      if (response.data.success) {
        const created = response.data.data;
        setBlockedDates(prev =>
          [...prev, created].sort((a, b) => a.startDate.localeCompare(b.startDate))
        );
        setNewBlockedDate({ title: '', startDate: '', endDate: '' });
        Alert.alert('Başarılı', 'Tatil günü eklendi');
      } else {
        Alert.alert('Hata', response.data.error || 'Tatil eklenemedi');
      }
    } catch (error: any) {
      console.error('Error adding blocked date:', error?.response?.data || error.message);
      Alert.alert('Hata', 'Tatil eklenirken bir hata oluştu');
    } finally {
      setBlockedDateSaving(false);
    }
  };

  const handleDeleteBlockedDate = (bd: BlockedDate) => {
    Alert.alert('Tatil Sil', `"${bd.title}" tatilini silmek istediğinize emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await api.delete(`/api/mobile/blocked-dates?id=${bd.id}`);
            if (response.data.success) {
              setBlockedDates(prev => prev.filter(d => d.id !== bd.id));
            } else {
              Alert.alert('Hata', response.data.error || 'Silinemedi');
            }
          } catch (error: any) {
            console.error('Error deleting blocked date:', error?.response?.data || error.message);
            Alert.alert('Hata', 'Tatil silinirken bir hata oluştu');
          }
        },
      },
    ]);
  };

  const formatDateTR = (dateStr: string): string => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Ayarlar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show access denied message for non-owners
  if (!isOwner) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <Header
          title="Ayarlar"
          subtitle="İşletme Ayarları"
          onMenuPress={() => setDrawerOpen(true)}
          gradientColors={['#163974', '#1e4a8f']}
        />
        <View style={styles.accessDeniedContainer}>
          <View style={styles.accessDeniedIcon}>
            <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
          </View>
          <Text style={styles.accessDeniedTitle}>Erişim Yetkisi Yok</Text>
          <Text style={styles.accessDeniedText}>
            Bu sayfayı sadece işletme sahipleri görüntüleyebilir.
          </Text>
          <TouchableOpacity
            style={styles.accessDeniedButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.accessDeniedButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
        <DrawerMenu isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <Header
        title="Ayarlar"
        subtitle={data?.businessName || selectedTenant?.businessName || 'İşletme Ayarları'}
        onMenuPress={() => setDrawerOpen(true)}
        gradientColors={['#163974', '#1e4a8f']}
        rightIcon={(hasChanges || newPassword) ? (saving ? undefined : "checkmark") : undefined}
        onRightPress={(hasChanges || newPassword) ? handleSave : undefined}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as TabId)}
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
          {/* 1. TEMA TAB */}
          {activeTab === 'theme' && (
            <View style={styles.section}>
              {/* Ana Renk */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="color-palette" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>Ana Renk</Text>
                    <Text style={styles.cardDescription}>İşletmenizin ana rengi</Text>
                  </View>
                </View>
                <View style={styles.colorRow}>
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

              {/* İkincil Renk */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#E0E7FF' }]}>
                    <Ionicons name="color-fill" size={20} color="#6366F1" />
                  </View>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>İkincil Renk</Text>
                    <Text style={styles.cardDescription}>İkinci derecede kullanılan renk</Text>
                  </View>
                </View>
                <View style={styles.colorRow}>
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

              {/* Logo */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="image" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>Logo</Text>
                    <Text style={styles.cardDescription}>İşletmenizin logosu</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.imagePickerContainer} onPress={() => pickImage('logo')}>
                  {formData.theme?.logo ? (
                    <Image source={{ uri: formData.theme.logo }} style={styles.logoPreview} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                      <Text style={styles.imagePlaceholderText}>Logo Seç</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Header Görseli */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="albums" size={20} color="#059669" />
                  </View>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>Header Görseli</Text>
                    <Text style={styles.cardDescription}>Üst kısımda görünecek görsel</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.headerImageContainer} onPress={() => pickImage('headerImage')}>
                  {formData.theme?.headerImage ? (
                    <Image source={{ uri: formData.theme.headerImage }} style={styles.headerImagePreview} />
                  ) : (
                    <View style={styles.headerImagePlaceholder}>
                      <Ionicons name="image-outline" size={28} color="#9CA3AF" />
                      <Text style={styles.imagePlaceholderText}>Header Görseli Seç</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 2. İŞLETME TAB */}
          {activeTab === 'business' && (
            <View style={styles.section}>
              <View style={styles.card}>
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
                  <Text style={styles.inputLabel}>İşletme Açıklaması</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.businessDescription}
                    onChangeText={(text) => updateFormData('businessDescription', text)}
                    placeholder="İşletmeniz hakkında kısa açıklama"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroupLast}>
                  <Text style={styles.inputLabel}>İşletme Adresi</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.address}
                    onChangeText={(text) => updateFormData('address', text)}
                    placeholder="Tam adres bilgisi"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>
            </View>
          )}

          {/* 3. YÖNETİCİ TAB */}
          {activeTab === 'owner' && (
            <View style={styles.section}>
              <View style={styles.card}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Adı Soyadı</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.ownerName}
                    onChangeText={(text) => updateFormData('ownerName', text)}
                    placeholder="Yönetici adı soyadı"
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

                <View style={styles.inputGroupLast}>
                  <Text style={styles.inputLabel}>Telefon</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(text) => updateFormData('phone', text)}
                    placeholder="05XX XXX XX XX"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>
          )}

          {/* 4. GİRİŞ TAB */}
          {activeTab === 'login' && (
            <View style={styles.section}>
              <View style={styles.card}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Kullanıcı Adı</Text>
                  <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={formData.username}
                    editable={false}
                    placeholder="Kullanıcı adı"
                  />
                  <Text style={styles.inputHint}>Kullanıcı adı değiştirilemez</Text>
                </View>

                <View style={styles.inputGroupLast}>
                  <Text style={styles.inputLabel}>Yeni Şifre</Text>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Değiştirmek için yeni şifre girin"
                    secureTextEntry
                  />
                  <Text style={styles.inputHint}>Boş bırakırsanız şifre değişmez</Text>
                </View>
              </View>

              {/* Çıkış Yap */}
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                <Text style={styles.logoutText}>Çıkış Yap</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 5. KONUM TAB */}
          {activeTab === 'location' && (
            <View style={styles.section}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="location" size={20} color="#EF4444" />
                  </View>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>Harita Konumu</Text>
                    <Text style={styles.cardDescription}>İşletmenizin harita üzerindeki konumu</Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Enlem (Latitude)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.location?.latitude}
                    onChangeText={(text) => updateNestedFormData('location', 'latitude', text)}
                    placeholder="41.0082"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Boylam (Longitude)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.location?.longitude}
                    onChangeText={(text) => updateNestedFormData('location', 'longitude', text)}
                    placeholder="28.9784"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.inputGroupLast}>
                  <Text style={styles.inputLabel}>Harita Adresi</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.location?.address}
                    onChangeText={(text) => updateNestedFormData('location', 'address', text)}
                    placeholder="Haritada gösterilecek adres"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>
            </View>
          )}

          {/* 6. ÇALIŞMA TAB */}
          {activeTab === 'working' && (
            <View style={styles.section}>
              <View style={styles.card}>
                <Text style={styles.cardTitleStandalone}>Çalışma Saatleri</Text>
                {DAYS.map((day, index) => {
                  const dayData = (formData.workingHours as WorkingHours)?.[day.key as keyof WorkingHours];
                  const isClosed = dayData?.closed || false;

                  return (
                    <View
                      key={day.key}
                      style={[
                        styles.dayRow,
                        index === DAYS.length - 1 && styles.dayRowLast
                      ]}
                    >
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
                            <Ionicons name="time-outline" size={16} color={THEME_COLOR} />
                            <Text style={styles.timeText}>{dayData?.start || '09:00'}</Text>
                          </TouchableOpacity>
                          <Text style={styles.timeSeparator}>-</Text>
                          <TouchableOpacity
                            style={styles.timeButton}
                            onPress={() => setShowTimePicker({ day: day.key, field: 'end' })}
                          >
                            <Ionicons name="time-outline" size={16} color={THEME_COLOR} />
                            <Text style={styles.timeText}>{dayData?.end || '18:00'}</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Randevu Ayarları */}
              <View style={styles.card}>
                <Text style={styles.cardTitleStandalone}>Randevu Ayarları</Text>

                {/* Takvim Zaman Aralıkları */}
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={[styles.settingIcon, { backgroundColor: '#DBEAFE' }]}>
                      <Ionicons name="grid-outline" size={20} color="#3B82F6" />
                    </View>
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingLabel}>Zaman Aralıkları</Text>
                      <Text style={styles.settingDescription}>Takvimde gösterilecek slot</Text>
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

                {/* Kara Liste Eşiği */}
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={[styles.settingIcon, { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons name="ban-outline" size={20} color="#EF4444" />
                    </View>
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingLabel}>Kara Liste Eşiği</Text>
                      <Text style={styles.settingDescription}>Gelmezse kara liste</Text>
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

                {/* Randevu Hatırlatma Süresi */}
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={[styles.settingIcon, { backgroundColor: '#D1FAE5' }]}>
                      <Ionicons name="notifications-outline" size={20} color="#059669" />
                    </View>
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingLabel}>Hatırlatma</Text>
                      <Text style={styles.settingDescription}>WhatsApp hatırlatma</Text>
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

                {/* Kredi Kartı ile Ödeme */}
                <View style={[styles.settingRow, styles.settingRowLast]}>
                  <View style={styles.settingInfo}>
                    <View style={[styles.settingIcon, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="card-outline" size={20} color="#D97706" />
                    </View>
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingLabel}>Kart ile Ödeme</Text>
                      <Text style={styles.settingDescription}>Müşteri kart ödemesi</Text>
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

          {/* 7. BELGELER TAB */}
          {activeTab === 'documents' && (
            <View style={styles.section}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#E0E7FF' }]}>
                    <Ionicons name="document-text" size={20} color="#6366F1" />
                  </View>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>Ödeme Belgeleri</Text>
                    <Text style={styles.cardDescription}>Ödeme alabilmek için gerekli belgeler</Text>
                  </View>
                </View>

                {/* Kimlik Belgesi */}
                <View style={styles.documentRow}>
                  <View style={styles.documentInfo}>
                    <View style={[styles.documentIcon, { backgroundColor: '#DBEAFE' }]}>
                      <Ionicons name="card-outline" size={18} color="#3B82F6" />
                    </View>
                    <View>
                      <Text style={styles.documentLabel}>Kimlik Belgesi</Text>
                      <Text style={styles.documentDescription}>Kimlik kartı veya pasaport</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.documentButton,
                      formData.documents?.identityDocument && styles.documentButtonUploaded
                    ]}
                    onPress={() => Alert.alert('Bilgi', 'Belge yükleme web panelinden yapılabilir.')}
                  >
                    <Text style={[
                      styles.documentButtonText,
                      formData.documents?.identityDocument && styles.documentButtonTextUploaded
                    ]}>
                      {formData.documents?.identityDocument ? 'Yüklendi' : 'Yükle'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Vergi Levhası */}
                <View style={styles.documentRow}>
                  <View style={styles.documentInfo}>
                    <View style={[styles.documentIcon, { backgroundColor: '#D1FAE5' }]}>
                      <Ionicons name="document-text-outline" size={18} color="#059669" />
                    </View>
                    <View>
                      <Text style={styles.documentLabel}>Vergi Levhası</Text>
                      <Text style={styles.documentDescription}>Vergi levhası belgesi</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.documentButton,
                      formData.documents?.taxDocument && styles.documentButtonUploaded
                    ]}
                    onPress={() => Alert.alert('Bilgi', 'Belge yükleme web panelinden yapılabilir.')}
                  >
                    <Text style={[
                      styles.documentButtonText,
                      formData.documents?.taxDocument && styles.documentButtonTextUploaded
                    ]}>
                      {formData.documents?.taxDocument ? 'Yüklendi' : 'Yükle'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* IBAN */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>IBAN Bilgisi</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.documents?.iban || ''}
                    onChangeText={(text) => updateNestedFormData('documents', 'iban', formatIBAN(text))}
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    autoCapitalize="characters"
                    maxLength={26}
                  />
                  <Text style={styles.inputHint}>TR ile başlayan 26 haneli IBAN</Text>
                </View>

                {/* İmza Sirküleri */}
                <View style={[styles.documentRow, styles.documentRowLast]}>
                  <View style={styles.documentInfo}>
                    <View style={[styles.documentIcon, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="create-outline" size={18} color="#D97706" />
                    </View>
                    <View>
                      <Text style={styles.documentLabel}>İmza Sirküleri</Text>
                      <Text style={styles.documentDescription}>Noter onaylı imza belgesi</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.documentButton,
                      formData.documents?.signatureDocument && styles.documentButtonUploaded
                    ]}
                    onPress={() => Alert.alert('Bilgi', 'Belge yükleme web panelinden yapılabilir.')}
                  >
                    <Text style={[
                      styles.documentButtonText,
                      formData.documents?.signatureDocument && styles.documentButtonTextUploaded
                    ]}>
                      {formData.documents?.signatureDocument ? 'Yüklendi' : 'Yükle'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Abonelik Bilgisi */}
              <View style={styles.card}>
                <Text style={styles.cardTitleStandalone}>Abonelik Bilgisi</Text>
                <View style={styles.subscriptionRow}>
                  <View style={styles.subscriptionInfo}>
                    <View style={[styles.subscriptionIcon, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="ribbon-outline" size={20} color={THEME_COLOR} />
                    </View>
                    <Text style={styles.subscriptionLabel}>Plan</Text>
                  </View>
                  <View style={styles.planBadge}>
                    <Text style={styles.planText}>{data?.plan || 'Free'}</Text>
                  </View>
                </View>
                <View style={[styles.subscriptionRow, styles.subscriptionRowLast]}>
                  <View style={styles.subscriptionInfo}>
                    <View style={[styles.subscriptionIcon, { backgroundColor: '#D1FAE5' }]}>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#059669" />
                    </View>
                    <Text style={styles.subscriptionLabel}>Durum</Text>
                  </View>
                  <View style={[styles.statusBadge, data?.status === 'active' && styles.statusActive]}>
                    <Text style={[styles.statusText, data?.status === 'active' && styles.statusTextActive]}>
                      {data?.status === 'active' ? 'Aktif' : data?.status || 'Aktif'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* 8. TATİLLER TAB */}
          {activeTab === 'holidays' && (
            <View style={styles.section}>
              {/* Bilgi Notu */}
              <View style={styles.holidayInfoNote}>
                <Ionicons name="information-circle" size={20} color="#D97706" />
                <Text style={styles.holidayInfoNoteText}>
                  Tatil günlerinde müşteriler randevu oluşturamaz.
                </Text>
              </View>

              {/* Yeni Tatil Ekle */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="add-circle-outline" size={20} color="#DC2626" />
                  </View>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>Yeni Tatil Ekle</Text>
                    <Text style={styles.cardDescription}>İşletmeniz için tatil günü tanımlayın</Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tatil Başlığı</Text>
                  <TextInput
                    style={styles.input}
                    value={newBlockedDate.title}
                    onChangeText={(t) => setNewBlockedDate(prev => ({ ...prev, title: t }))}
                    placeholder="Örn: Yılbaşı Tatili"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Başlangıç Tarihi</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text style={[styles.pickerButtonText, !newBlockedDate.startDate && { color: '#9CA3AF' }]}>
                      {newBlockedDate.startDate ? formatDateTR(newBlockedDate.startDate) : 'Tarih seçiniz'}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bitiş Tarihi</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={[styles.pickerButtonText, !newBlockedDate.endDate && { color: '#9CA3AF' }]}>
                      {newBlockedDate.endDate ? formatDateTR(newBlockedDate.endDate) : 'Tarih seçiniz'}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.holidayAddButton, blockedDateSaving && styles.holidayAddButtonDisabled]}
                  onPress={handleAddBlockedDate}
                  disabled={blockedDateSaving}
                >
                  {blockedDateSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="add" size={20} color="#fff" />
                      <Text style={styles.holidayAddButtonText}>Tatil Ekle</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Mevcut Tatiller */}
              <View style={styles.card}>
                <Text style={styles.cardTitleStandalone}>Mevcut Tatiller</Text>
                {blockedDatesLoading ? (
                  <View style={styles.holidayEmptyState}>
                    <ActivityIndicator size="small" color={THEME_COLOR} />
                  </View>
                ) : blockedDates.length === 0 ? (
                  <View style={styles.holidayEmptyState}>
                    <Ionicons name="calendar-outline" size={36} color="#D1D5DB" />
                    <Text style={styles.holidayEmptyText}>Henüz tatil günü eklenmemiş</Text>
                  </View>
                ) : (
                  blockedDates.map((bd, index) => (
                    <View
                      key={bd.id}
                      style={[
                        styles.holidayRow,
                        index === blockedDates.length - 1 && styles.holidayRowLast,
                      ]}
                    >
                      <View style={styles.holidayInfo}>
                        <Text style={styles.holidayTitle}>{bd.title}</Text>
                        <Text style={styles.holidayDates}>
                          {formatDateTR(bd.startDate)}
                          {bd.startDate !== bd.endDate ? ` — ${formatDateTR(bd.endDate)}` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.holidayDeleteButton}
                        onPress={() => handleDeleteBlockedDate(bd)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* 9. MESAJLAR TAB */}
          {activeTab === 'messages' && (
            <View style={styles.section}>
              {/* Hatırlatma Süresi */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="alarm-outline" size={20} color="#D97706" />
                  </View>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>Hatırlatma Süresi</Text>
                    <Text style={styles.cardDescription}>Randevudan ne kadar önce hatırlatma gönderilsin</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowReminderPicker(true)}
                >
                  <Text style={styles.pickerButtonText}>
                    {REMINDER_OPTIONS.find(o => o.value === formData.reminderMinutes)?.label || '2 saat önce'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* 1. Randevu Onay Mesajı */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#059669" />
                  </View>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>Randevu Onay Mesajı</Text>
                    <Text style={styles.cardDescription}>Randevu oluşturulduğunda gönderilen mesaj</Text>
                  </View>
                </View>
                {/* Otomatik Bildirim Switch */}
                <View style={styles.autoSendRow}>
                  <View style={styles.autoSendInfo}>
                    <Text style={styles.autoSendLabel}>Otomatik bildirim gönder</Text>
                    <Text style={styles.autoSendDescription}>Randevu oluşturulduğunda müşteriye otomatik onay mesajı gönderilir</Text>
                  </View>
                  <Switch
                    value={getAutoSendConfirmation()}
                    onValueChange={toggleAutoSendConfirmation}
                    trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                    thumbColor={getAutoSendConfirmation() ? '#2563EB' : '#f4f3f4'}
                  />
                </View>
                <Text style={styles.msgLabel}>Gönderim Kanalı</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowChannelPicker({ key: 'confirmationChannel', options: CHANNEL_OPTIONS })}
                >
                  <Text style={styles.pickerButtonText}>{getChannelLabel(getNotificationSetting('confirmationChannel'))}</Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
                <Text style={[styles.msgLabel, { marginTop: 12 }]}>Mesaj Şablonu</Text>
                <TextInput
                  style={styles.templateInput}
                  multiline
                  value={getMessageTemplate('whatsappConfirmation')}
                  onChangeText={(t) => updateMessageTemplate('whatsappConfirmation', t)}
                  onFocus={() => setActiveTemplateField('whatsappConfirmation')}
                  onSelectionChange={(e) => setTemplateCursorPos(e.nativeEvent.selection.start)}
                />
                <View style={styles.variableRow}>
                  {CUSTOMER_VARIABLES.filter(v => v.key !== '{hatirlatmaSuresi}').map(v => (
                    <TouchableOpacity
                      key={v.key}
                      style={styles.variableTag}
                      onPress={() => insertVariable('whatsappConfirmation', v.key)}
                    >
                      <Text style={styles.variableTagText}>{v.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.resetButton} onPress={() => resetTemplate('whatsappConfirmation')}>
                  <Ionicons name="refresh-outline" size={14} color="#6B7280" />
                  <Text style={styles.resetButtonText}>Varsayılana Dön</Text>
                </TouchableOpacity>

                <Text style={[styles.msgLabel, { marginTop: 16 }]}>SMS Onay Şablonu</Text>
                <Text style={styles.autoSendDescription}>SMS ile gönderilecek onay mesajı (emoji kullanmayın)</Text>
                <TextInput
                  style={[styles.templateInput, { minHeight: 60 }]}
                  multiline
                  value={getMessageTemplate('smsConfirmation')}
                  onChangeText={(t) => updateMessageTemplate('smsConfirmation', t)}
                  onFocus={() => setActiveTemplateField('smsConfirmation')}
                  onSelectionChange={(e) => setTemplateCursorPos(e.nativeEvent.selection.start)}
                />
                <View style={styles.variableRow}>
                  {CUSTOMER_VARIABLES.filter(v => v.key !== '{hatirlatmaSuresi}').map(v => (
                    <TouchableOpacity
                      key={v.key}
                      style={styles.variableTag}
                      onPress={() => insertVariable('smsConfirmation', v.key)}
                    >
                      <Text style={styles.variableTagText}>{v.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.resetButton} onPress={() => resetTemplate('smsConfirmation')}>
                  <Ionicons name="refresh-outline" size={14} color="#6B7280" />
                  <Text style={styles.resetButtonText}>Varsayılana Dön</Text>
                </TouchableOpacity>
              </View>

              {/* 2. WhatsApp Hatırlatma */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="notifications-outline" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>Hatırlatma Mesajı</Text>
                    <Text style={styles.cardDescription}>Randevudan önce gönderilen hatırlatma</Text>
                  </View>
                </View>
                <Text style={styles.msgLabel}>Gönderim Kanalı</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowChannelPicker({ key: 'reminderChannel', options: CHANNEL_OPTIONS })}
                >
                  <Text style={styles.pickerButtonText}>{getChannelLabel(getNotificationSetting('reminderChannel'))}</Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
                <Text style={[styles.msgLabel, { marginTop: 12 }]}>WhatsApp Şablonu</Text>
                <TextInput
                  style={styles.templateInput}
                  multiline
                  value={getMessageTemplate('whatsappReminder')}
                  onChangeText={(t) => updateMessageTemplate('whatsappReminder', t)}
                  onFocus={() => setActiveTemplateField('whatsappReminder')}
                  onSelectionChange={(e) => setTemplateCursorPos(e.nativeEvent.selection.start)}
                />
                <View style={styles.variableRow}>
                  {CUSTOMER_VARIABLES.map(v => (
                    <TouchableOpacity
                      key={v.key}
                      style={styles.variableTag}
                      onPress={() => insertVariable('whatsappReminder', v.key)}
                    >
                      <Text style={styles.variableTagText}>{v.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.resetButton} onPress={() => resetTemplate('whatsappReminder')}>
                  <Ionicons name="refresh-outline" size={14} color="#6B7280" />
                  <Text style={styles.resetButtonText}>Varsayılana Dön</Text>
                </TouchableOpacity>

                <Text style={[styles.msgLabel, { marginTop: 16 }]}>SMS Şablonu</Text>
                <TextInput
                  style={styles.templateInput}
                  multiline
                  value={getMessageTemplate('smsReminder')}
                  onChangeText={(t) => updateMessageTemplate('smsReminder', t)}
                  onFocus={() => setActiveTemplateField('smsReminder')}
                  onSelectionChange={(e) => setTemplateCursorPos(e.nativeEvent.selection.start)}
                />
                <View style={styles.variableRow}>
                  {CUSTOMER_VARIABLES.map(v => (
                    <TouchableOpacity
                      key={v.key}
                      style={styles.variableTag}
                      onPress={() => insertVariable('smsReminder', v.key)}
                    >
                      <Text style={styles.variableTagText}>{v.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.resetButton} onPress={() => resetTemplate('smsReminder')}>
                  <Ionicons name="refresh-outline" size={14} color="#6B7280" />
                  <Text style={styles.resetButtonText}>Varsayılana Dön</Text>
                </TouchableOpacity>
              </View>

              {/* 3. Personel Günlük Hatırlatma */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#E0E7FF' }]}>
                    <Ionicons name="people-outline" size={20} color="#6366F1" />
                  </View>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>Personel Günlük Hatırlatma</Text>
                    <Text style={styles.cardDescription}>Her sabah personele gönderilen randevu listesi</Text>
                  </View>
                </View>
                <Text style={styles.msgLabel}>Gönderim Kanalı</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowChannelPicker({ key: 'staffDailyChannel', options: STAFF_CHANNEL_OPTIONS })}
                >
                  <Text style={styles.pickerButtonText}>{getChannelLabel(getNotificationSetting('staffDailyChannel'))}</Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
                <Text style={[styles.msgLabel, { marginTop: 12 }]}>Mesaj Şablonu</Text>
                <TextInput
                  style={styles.templateInput}
                  multiline
                  value={getMessageTemplate('staffDailyReminder')}
                  onChangeText={(t) => updateMessageTemplate('staffDailyReminder', t)}
                  onFocus={() => setActiveTemplateField('staffDailyReminder')}
                  onSelectionChange={(e) => setTemplateCursorPos(e.nativeEvent.selection.start)}
                />
                <View style={styles.variableRow}>
                  {STAFF_VARIABLES.map(v => (
                    <TouchableOpacity
                      key={v.key}
                      style={styles.variableTag}
                      onPress={() => insertVariable('staffDailyReminder', v.key)}
                    >
                      <Text style={styles.variableTagText}>{v.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.resetButton} onPress={() => resetTemplate('staffDailyReminder')}>
                  <Ionicons name="refresh-outline" size={14} color="#6B7280" />
                  <Text style={styles.resetButtonText}>Varsayılana Dön</Text>
                </TouchableOpacity>
              </View>

              {/* 4. Sahip Günlük Özet */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="bar-chart-outline" size={20} color="#DC2626" />
                  </View>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>Günlük Özet Raporu</Text>
                    <Text style={styles.cardDescription}>Her akşam işletme sahibine gönderilen özet</Text>
                  </View>
                </View>
                <Text style={styles.msgLabel}>Gönderim Kanalı</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowChannelPicker({ key: 'ownerDailyChannel', options: STAFF_CHANNEL_OPTIONS })}
                >
                  <Text style={styles.pickerButtonText}>{getChannelLabel(getNotificationSetting('ownerDailyChannel'))}</Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
                <Text style={[styles.msgLabel, { marginTop: 12 }]}>Mesaj Şablonu</Text>
                <TextInput
                  style={styles.templateInput}
                  multiline
                  value={getMessageTemplate('ownerDailyReminder')}
                  onChangeText={(t) => updateMessageTemplate('ownerDailyReminder', t)}
                  onFocus={() => setActiveTemplateField('ownerDailyReminder')}
                  onSelectionChange={(e) => setTemplateCursorPos(e.nativeEvent.selection.start)}
                />
                <View style={styles.variableRow}>
                  {OWNER_VARIABLES.map(v => (
                    <TouchableOpacity
                      key={v.key}
                      style={styles.variableTag}
                      onPress={() => insertVariable('ownerDailyReminder', v.key)}
                    >
                      <Text style={styles.variableTagText}>{v.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.resetButton} onPress={() => resetTemplate('ownerDailyReminder')}>
                  <Ionicons name="refresh-outline" size={14} color="#6B7280" />
                  <Text style={styles.resetButtonText}>Varsayılana Dön</Text>
                </TouchableOpacity>
              </View>

              {/* 5. Memnuniyet Anketi */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="star-outline" size={20} color="#D97706" />
                  </View>
                  <Text style={styles.cardTitle}>Memnuniyet Anketi</Text>
                </View>

                {/* Auto-send toggle */}
                <View style={styles.autoSendRow}>
                  <View style={styles.autoSendInfo}>
                    <Text style={styles.autoSendLabel}>Otomatik anket gönder</Text>
                    <Text style={styles.autoSendDescription}>Randevu tamamlandığında müşteriye otomatik anket gönderilir</Text>
                  </View>
                  <Switch
                    value={getAutoSendSurvey()}
                    onValueChange={toggleAutoSendSurvey}
                    trackColor={{ false: '#D1D5DB', true: '#FCD34D' }}
                    thumbColor={getAutoSendSurvey() ? '#D97706' : '#f4f3f4'}
                  />
                </View>

                {/* Delay selector */}
                <Text style={styles.msgLabel}>Gecikme Süresi</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowChannelPicker({
                    key: 'surveyDelay',
                    options: SURVEY_DELAY_OPTIONS.map(o => ({ value: String(o.value), label: o.label })),
                  })}
                >
                  <Text style={styles.pickerButtonText}>
                    {SURVEY_DELAY_OPTIONS.find(o => o.value === getSurveyDelayMinutes())?.label || 'Hemen'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>

                {/* Channel selector */}
                <Text style={[styles.msgLabel, { marginTop: 8 }]}>Gönderim Kanalı</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowChannelPicker({ key: 'surveyChannel', options: CHANNEL_OPTIONS })}
                >
                  <Text style={styles.pickerButtonText}>{getChannelLabel(getNotificationSetting('surveyChannel') || 'whatsapp')}</Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>

                {/* WhatsApp Survey Template */}
                <Text style={[styles.msgLabel, { marginTop: 12 }]}>WhatsApp Anket Mesajı</Text>
                <TextInput
                  style={styles.templateInput}
                  multiline
                  value={getMessageTemplate('whatsappSurvey')}
                  onChangeText={(t) => updateMessageTemplate('whatsappSurvey', t)}
                  onFocus={() => setActiveTemplateField('whatsappSurvey')}
                  onSelectionChange={(e) => setTemplateCursorPos(e.nativeEvent.selection.start)}
                />
                <View style={styles.variableRow}>
                  {SURVEY_VARIABLES.map(v => (
                    <TouchableOpacity
                      key={v.key}
                      style={styles.variableTag}
                      onPress={() => insertVariable('whatsappSurvey', v.key)}
                    >
                      <Text style={styles.variableTagText}>{v.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.resetButton} onPress={() => resetTemplate('whatsappSurvey')}>
                  <Ionicons name="refresh-outline" size={14} color="#6B7280" />
                  <Text style={styles.resetButtonText}>Varsayılana Dön</Text>
                </TouchableOpacity>

                {/* SMS Survey Template */}
                <Text style={[styles.msgLabel, { marginTop: 16 }]}>SMS Anket Mesajı</Text>
                <Text style={styles.autoSendDescription}>SMS ile gönderilecek kısa anket mesajı (emoji kullanmayın)</Text>
                <TextInput
                  style={[styles.templateInput, { minHeight: 60 }]}
                  multiline
                  value={getMessageTemplate('smsSurvey')}
                  onChangeText={(t) => updateMessageTemplate('smsSurvey', t)}
                  onFocus={() => setActiveTemplateField('smsSurvey')}
                  onSelectionChange={(e) => setTemplateCursorPos(e.nativeEvent.selection.start)}
                />
                <View style={styles.variableRow}>
                  {SURVEY_VARIABLES.map(v => (
                    <TouchableOpacity
                      key={v.key}
                      style={styles.variableTag}
                      onPress={() => insertVariable('smsSurvey', v.key)}
                    >
                      <Text style={styles.variableTagText}>{v.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.resetButton} onPress={() => resetTemplate('smsSurvey')}>
                  <Ionicons name="refresh-outline" size={14} color="#6B7280" />
                  <Text style={styles.resetButtonText}>Varsayılana Dön</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      {/* Time Interval Picker Modal */}
      <Modal visible={showTimeIntervalPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Takvim Zaman Aralıkları</Text>
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
              <Text style={styles.modalTitle}>Randevu Hatırlatma Süresi</Text>
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

      {/* Start Date Picker */}
      {showStartDatePicker && (
        Platform.OS === 'ios' ? (
          <Modal visible={showStartDatePicker} transparent animationType="fade" onRequestClose={() => setShowStartDatePicker(false)}>
            <View style={styles.datePickerModalOverlay}>
              <View style={styles.datePickerModalContent}>
                <View style={styles.datePickerModalHeader}>
                  <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                    <Text style={styles.datePickerCancelText}>İptal</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerModalTitle}>Başlangıç Tarihi</Text>
                  <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                    <Text style={styles.datePickerDoneText}>Tamam</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={newBlockedDate.startDate ? new Date(newBlockedDate.startDate) : new Date()}
                  mode="date"
                  display="spinner"
                  locale="tr-TR"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      const dateStr = selectedDate.toISOString().split('T')[0];
                      setNewBlockedDate(prev => ({
                        ...prev,
                        startDate: dateStr,
                        endDate: prev.endDate && prev.endDate < dateStr ? dateStr : prev.endDate,
                      }));
                    }
                  }}
                  style={styles.datePickerIOS}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={newBlockedDate.startDate ? new Date(newBlockedDate.startDate) : new Date()}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowStartDatePicker(false);
              if (event.type === 'set' && selectedDate) {
                const dateStr = selectedDate.toISOString().split('T')[0];
                setNewBlockedDate(prev => ({
                  ...prev,
                  startDate: dateStr,
                  endDate: prev.endDate && prev.endDate < dateStr ? dateStr : prev.endDate,
                }));
              }
            }}
          />
        )
      )}

      {/* End Date Picker */}
      {showEndDatePicker && (
        Platform.OS === 'ios' ? (
          <Modal visible={showEndDatePicker} transparent animationType="fade" onRequestClose={() => setShowEndDatePicker(false)}>
            <View style={styles.datePickerModalOverlay}>
              <View style={styles.datePickerModalContent}>
                <View style={styles.datePickerModalHeader}>
                  <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                    <Text style={styles.datePickerCancelText}>İptal</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerModalTitle}>Bitiş Tarihi</Text>
                  <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                    <Text style={styles.datePickerDoneText}>Tamam</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={newBlockedDate.endDate ? new Date(newBlockedDate.endDate) : (newBlockedDate.startDate ? new Date(newBlockedDate.startDate) : new Date())}
                  mode="date"
                  display="spinner"
                  locale="tr-TR"
                  minimumDate={newBlockedDate.startDate ? new Date(newBlockedDate.startDate) : new Date()}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setNewBlockedDate(prev => ({ ...prev, endDate: selectedDate.toISOString().split('T')[0] }));
                    }
                  }}
                  style={styles.datePickerIOS}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={newBlockedDate.endDate ? new Date(newBlockedDate.endDate) : (newBlockedDate.startDate ? new Date(newBlockedDate.startDate) : new Date())}
            mode="date"
            display="default"
            minimumDate={newBlockedDate.startDate ? new Date(newBlockedDate.startDate) : new Date()}
            onChange={(event, selectedDate) => {
              setShowEndDatePicker(false);
              if (event.type === 'set' && selectedDate) {
                setNewBlockedDate(prev => ({ ...prev, endDate: selectedDate.toISOString().split('T')[0] }));
              }
            }}
          />
        )
      )}

      {/* Channel Picker Modal */}
      <Modal visible={!!showChannelPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gönderim Kanalı</Text>
              <TouchableOpacity onPress={() => setShowChannelPicker(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {(showChannelPicker?.options || []).map((option) => {
                const currentVal = showChannelPicker?.key === 'surveyDelay'
                  ? String(getSurveyDelayMinutes())
                  : showChannelPicker ? getNotificationSetting(showChannelPicker.key as keyof NotificationSettings) : '';
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.modalOption, currentVal === option.value && styles.modalOptionSelected]}
                    onPress={() => {
                      if (showChannelPicker) {
                        if (showChannelPicker.key === 'surveyDelay') {
                          setSurveyDelayMinutes(parseInt(option.value));
                        } else {
                          updateNotificationSetting(showChannelPicker.key as keyof NotificationSettings, option.value);
                        }
                        setShowChannelPicker(null);
                      }
                    }}
                  >
                    <Text style={[styles.modalOptionText, currentVal === option.value && styles.modalOptionTextSelected]}>
                      {option.label}
                    </Text>
                    {currentVal === option.value && <Ionicons name="checkmark" size={20} color={THEME_COLOR} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  accessDeniedIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  accessDeniedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  accessDeniedButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Header - HIG/Material Design Compliant
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IS_IOS ? 20 : 16,
    paddingTop: IS_IOS ? 16 : 12,
    paddingBottom: IS_IOS ? 12 : 8,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: IS_IOS ? 28 : 24,
    fontWeight: IS_IOS ? '700' : '600',
    color: '#1F2937',
    letterSpacing: IS_IOS ? -0.5 : 0,
  },
  subtitle: {
    fontSize: IS_IOS ? 14 : 12,
    color: IS_IOS ? '#6B7280' : '#49454F',
    marginTop: 2,
  },
  saveButton: {
    marginLeft: IS_IOS ? 12 : 16,
  },
  saveButtonGradient: {
    width: HEADER_BTN_SIZE,
    height: HEADER_BTN_SIZE,
    borderRadius: HEADER_BTN_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tabs
  tabContainer: {
    marginTop: 8,
  },
  tabScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabWrapper: {
    marginRight: 8,
  },
  tabActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  tabInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    paddingTop: 16,
  },

  // Section
  section: {
    paddingHorizontal: 20,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  cardDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  cardTitleStandalone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },

  // Input
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupLast: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
  },

  // Select
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectText: {
    fontSize: 15,
    color: '#1F2937',
  },

  // Color
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorPreview: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  colorInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Image Picker
  imagePickerContainer: {
    alignSelf: 'center',
  },
  logoPreview: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
  },
  headerImageContainer: {
    marginTop: 4,
  },
  headerImagePreview: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  headerImagePlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },

  // Working Hours
  dayRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayRowLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    borderRadius: 12,
    paddingHorizontal: 14,
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
    fontWeight: '500',
  },

  // Settings Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
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
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTextContainer: {
    flex: 1,
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
    gap: 10,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
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

  // Documents
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  documentRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  documentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  documentDescription: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  documentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  documentButtonUploaded: {
    backgroundColor: '#D1FAE5',
  },
  documentButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  documentButtonTextUploaded: {
    color: '#059669',
  },

  // Subscription
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  subscriptionRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subscriptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  planBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  planText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME_COLOR,
  },
  statusBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 6,
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

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
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
  // Holiday styles
  holidayAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    marginTop: 8,
  },
  holidayAddButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  holidayAddButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  holidayEmptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  holidayEmptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  holidayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
  },
  holidayRowLast: {
    borderBottomWidth: 0,
  },
  holidayInfo: {
    flex: 1,
  },
  holidayTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#991B1B',
  },
  holidayDates: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 2,
  },
  holidayDeleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  holidayInfoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  holidayInfoNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  // Auto-send confirmation styles
  autoSendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  autoSendInfo: {
    flex: 1,
    marginRight: 12,
  },
  autoSendLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  autoSendDescription: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  // DateTimePicker modal styles
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  datePickerCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLOR,
  },
  datePickerIOS: {
    height: 200,
    width: '100%',
  },
  // Message styles
  msgLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 4,
  },
  templateInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#1F2937',
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  variableRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  variableTag: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  variableTagText: {
    fontSize: 11,
    color: THEME_COLOR,
    fontWeight: '500',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  resetButtonText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
