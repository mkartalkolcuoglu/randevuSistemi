import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../../src/services/api';

const THEME_GREEN = '#059669';

interface NotificationPreferences {
  whatsappNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

const CHANNELS = [
  {
    key: 'whatsappNotifications' as const,
    title: 'WhatsApp Bildirimleri',
    description: 'Randevu onay ve hatırlatma mesajları WhatsApp üzerinden',
    icon: 'logo-whatsapp' as const,
    color: '#25D366',
    bg: '#ECFDF5',
  },
  {
    key: 'smsNotifications' as const,
    title: 'SMS Bildirimleri',
    description: 'Randevu onay ve hatırlatma mesajları SMS olarak',
    icon: 'chatbubble-ellipses' as const,
    color: '#3B82F6',
    bg: '#DBEAFE',
  },
  {
    key: 'pushNotifications' as const,
    title: 'Push Bildirimleri',
    description: 'Uygulama içi bildirimler ve anlık uyarılar',
    icon: 'notifications' as const,
    color: '#8B5CF6',
    bg: '#EDE9FE',
  },
];

export default function CustomerNotificationsScreen() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    whatsappNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await api.get('/api/mobile/customer/notification-preferences');
      if (res.data.success) {
        setPreferences(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = useCallback(async (key: keyof NotificationPreferences) => {
    const newValue = !preferences[key];
    const prevPreferences = { ...preferences };

    // Optimistic update
    setPreferences(prev => ({ ...prev, [key]: newValue }));
    setSaving(key);

    try {
      await api.put('/api/mobile/customer/notification-preferences', {
        [key]: newValue,
      });
    } catch (error) {
      // Rollback on error
      setPreferences(prevPreferences);
      Alert.alert('Hata', 'Bildirim tercihi güncellenirken bir hata oluştu');
    } finally {
      setSaving(null);
    }
  }, [preferences]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_GREEN} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <LinearGradient
        colors={['#059669', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color={THEME_GREEN} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Bildirim Ayarları</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoBannerText}>
            Hangi kanallardan bildirim almak istediğinizi seçin
          </Text>
        </View>

        {/* Notification Channels */}
        {CHANNELS.map((channel) => (
          <View key={channel.key} style={styles.channelCard}>
            <View style={[styles.channelIcon, { backgroundColor: channel.bg }]}>
              <Ionicons name={channel.icon} size={24} color={channel.color} />
            </View>
            <View style={styles.channelInfo}>
              <Text style={styles.channelTitle}>{channel.title}</Text>
              <Text style={styles.channelDescription}>{channel.description}</Text>
            </View>
            <View style={styles.switchContainer}>
              {saving === channel.key ? (
                <ActivityIndicator size="small" color={THEME_GREEN} />
              ) : (
                <Switch
                  value={preferences[channel.key]}
                  onValueChange={() => togglePreference(channel.key)}
                  trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
                  thumbColor={preferences[channel.key] ? THEME_GREEN : '#9CA3AF'}
                  ios_backgroundColor="#D1D5DB"
                />
              )}
            </View>
          </View>
        ))}

        {/* Note */}
        <View style={styles.noteSection}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#9CA3AF" />
          <Text style={styles.noteText}>
            Bildirim tercihleriniz tüm işletmelerdeki hesaplarınız için geçerlidir.
            Önemli güvenlik bildirimleri her zaman gönderilir.
          </Text>
        </View>
      </ScrollView>
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
  },

  // Header
  headerGradient: {
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Info
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 10,
    marginBottom: 20,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },

  // Channel cards
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  channelIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 12,
  },
  channelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  channelDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  switchContainer: {
    width: 52,
    alignItems: 'center',
  },

  // Note
  noteSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    gap: 10,
    paddingHorizontal: 4,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
});
