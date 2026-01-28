import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Platform, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../../src/store/auth.store';
import { appointmentService } from '../../../src/services/appointment.service';
import api from '../../../src/services/api';

// Web URLs for privacy and support pages
const PRIVACY_URL = 'https://netrandevu.com/gizlilik';
const SUPPORT_URL = 'https://netrandevu.com/destek';
const SUPPORT_EMAIL = 'destek@netrandevu.com';

const IS_IOS = Platform.OS === 'ios';

interface ProfileStats {
  totalAppointments: number;
  totalPackages: number;
  totalSessions: number;
}

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<ProfileStats>({
    totalAppointments: 0,
    totalPackages: 0,
    totalSessions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Fetch appointments
      const appointmentsResponse = await appointmentService.getMyAppointments();
      const appointments = appointmentsResponse.data || [];

      // Fetch packages
      const packagesResponse = await api.get('/api/mobile/customer/all-packages');
      const packages = packagesResponse.data.data?.packages || [];

      // Calculate total sessions from packages
      const totalSessions = packages.reduce((total: number, pkg: any) => {
        return total + (pkg.items?.reduce((sum: number, item: any) => sum + item.remainingQuantity, 0) || 0);
      }, 0);

      setStats({
        totalAppointments: appointments.length,
        totalPackages: packages.length,
        totalSessions: totalSessions,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

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

  const handleOpenPrivacy = async () => {
    try {
      const canOpen = await Linking.canOpenURL(PRIVACY_URL);
      if (canOpen) {
        await Linking.openURL(PRIVACY_URL);
      } else {
        Alert.alert('Hata', 'Gizlilik sayfası açılamadı');
      }
    } catch (error) {
      Alert.alert('Hata', 'Gizlilik sayfası açılamadı');
    }
  };

  const handleOpenSupport = () => {
    Alert.alert(
      'Yardım & Destek',
      'Size nasıl yardımcı olabiliriz?',
      [
        {
          text: 'E-posta Gönder',
          onPress: async () => {
            const mailUrl = `mailto:${SUPPORT_EMAIL}?subject=Net Randevu Destek Talebi`;
            try {
              await Linking.openURL(mailUrl);
            } catch (error) {
              Alert.alert('Hata', 'E-posta uygulaması açılamadı');
            }
          },
        },
        {
          text: 'Destek Sayfası',
          onPress: async () => {
            try {
              const canOpen = await Linking.canOpenURL(SUPPORT_URL);
              if (canOpen) {
                await Linking.openURL(SUPPORT_URL);
              } else {
                Alert.alert('Hata', 'Destek sayfası açılamadı');
              }
            } catch (error) {
              Alert.alert('Hata', 'Destek sayfası açılamadı');
            }
          },
        },
        { text: 'İptal', style: 'cancel' },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'person-outline' as const,
      label: 'Kişisel Bilgiler',
      description: 'Ad, soyad ve iletişim bilgileri',
      onPress: () => router.push('/profile/edit'),
      color: '#059669',
    },
    {
      icon: 'notifications-outline' as const,
      label: 'Bildirimler',
      description: 'Bildirim tercihlerinizi yönetin',
      onPress: () => Alert.alert('Bildirimler', 'Bildirim ayarları yakında eklenecek'),
      color: '#F59E0B',
    },
    {
      icon: 'shield-checkmark-outline' as const,
      label: 'Gizlilik',
      description: 'Gizlilik politikası ve KVKK',
      onPress: handleOpenPrivacy,
      color: '#3B82F6',
    },
    {
      icon: 'help-circle-outline' as const,
      label: 'Yardım & Destek',
      description: 'SSS ve iletişim',
      onPress: handleOpenSupport,
      color: '#8B5CF6',
    },
  ];

  const formatPhone = (phone: string | undefined) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+90 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      return `+90 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
    return phone;
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#059669', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + (IS_IOS ? 16 : 12) }]}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Profil</Text>
          </View>

          {/* User Card */}
          <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.charAt(0)?.toUpperCase() || user?.phone?.charAt(0) || 'K'}
                </Text>
              </View>
              <View style={styles.avatarBadge}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : 'Kullanıcı'}
              </Text>
              <View style={styles.phoneRow}>
                <Ionicons name="call" size={14} color="#6B7280" />
                <Text style={styles.userPhone}>{formatPhone(user?.phone)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/profile/edit')}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={16} color="#059669" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          {isLoading ? (
            <View style={styles.statsLoading}>
              <ActivityIndicator size="small" color="#059669" />
            </View>
          ) : (
            <>
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="calendar" size={20} color="#059669" />
                </View>
                <Text style={styles.statValue}>{stats.totalAppointments}</Text>
                <Text style={styles.statLabel}>Randevu</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="gift" size={20} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>{stats.totalPackages}</Text>
                <Text style={styles.statLabel}>Paket</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="time" size={20} color="#6366F1" />
                </View>
                <Text style={styles.statValue}>{stats.totalSessions}</Text>
                <Text style={styles.statLabel}>Kalan Seans</Text>
              </View>
            </>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayarlar</Text>
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && styles.menuItemBorder,
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <View style={styles.logoutIconContainer}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <Text style={styles.logoutText}>Çıkış Yap</Text>
            <Ionicons name="chevron-forward" size={20} color="#FCA5A5" />
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <View style={styles.footerLogoContainer}>
            <Ionicons name="calendar" size={20} color="#059669" />
          </View>
          <Text style={styles.appName}>Net Randevu</Text>
          <Text style={styles.version}>Versiyon 1.0.0</Text>
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
  header: {
    paddingBottom: 140,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 104,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 110,
  },
  statsLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#E5E7EB',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 14,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  menuDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 14,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 100,
  },
  footerLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  version: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
