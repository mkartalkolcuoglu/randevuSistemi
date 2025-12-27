import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/auth.store';

// Menu item type
interface MenuItem {
  icon: string;
  label: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  iconColor?: string;
  iconBg?: string;
  onPress: () => void;
}

export default function StaffSettingsScreen() {
  const router = useRouter();
  const { user, selectedTenant, logout, availableTenants } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

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

  // Quick actions for owners
  const quickActions = [
    {
      icon: 'settings-outline',
      label: 'İşletme',
      color: '#163974',
      bg: '#E0E7FF',
      onPress: () => router.push('/(tabs)/staff/business-settings'),
    },
    {
      icon: 'cash-outline',
      label: 'Kasa',
      color: '#059669',
      bg: '#D1FAE5',
      onPress: () => router.push('/(tabs)/staff/cashier'),
    },
    {
      icon: 'bar-chart-outline',
      label: 'Raporlar',
      color: '#3B82F6',
      bg: '#DBEAFE',
      onPress: () => router.push('/(tabs)/staff/reports'),
    },
    {
      icon: 'star-outline',
      label: 'Performans',
      color: '#F59E0B',
      bg: '#FEF3C7',
      onPress: () => router.push('/(tabs)/staff/performance'),
    },
    {
      icon: 'gift-outline',
      label: 'Paketler',
      color: '#8B5CF6',
      bg: '#EDE9FE',
      onPress: () => router.push('/(tabs)/staff/packages'),
    },
    {
      icon: 'cube-outline',
      label: 'Stok',
      color: '#EC4899',
      bg: '#FCE7F3',
      onPress: () => router.push('/(tabs)/staff/stock'),
    },
  ];

  // Business settings menu items
  const businessSettings: MenuItem[] = [
    {
      icon: 'time-outline',
      label: 'Çalışma Saatleri',
      subtitle: 'Salon açılış-kapanış saatleri',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
      onPress: () => router.push('/settings/working-hours'),
    },
    {
      icon: 'cut-outline',
      label: 'Hizmetler',
      subtitle: 'Hizmet ve fiyat yönetimi',
      iconColor: '#8B5CF6',
      iconBg: '#F3E8FF',
      onPress: () => router.push('/settings/services'),
    },
    {
      icon: 'people-outline',
      label: 'Personel',
      subtitle: 'Personel listesi ve yetkileri',
      iconColor: '#EC4899',
      iconBg: '#FCE7F3',
      onPress: () => router.push('/settings/staff'),
    },
    {
      icon: 'calendar-outline',
      label: 'Randevu Ayarları',
      subtitle: 'Randevu kuralları ve süreler',
      iconColor: '#F59E0B',
      iconBg: '#FEF3C7',
      onPress: () => router.push('/settings/appointments'),
    },
    {
      icon: 'card-outline',
      label: 'Ödeme Yöntemleri',
      subtitle: 'Nakit, kredi kartı, havale',
      iconColor: '#059669',
      iconBg: '#D1FAE5',
      onPress: () => Alert.alert('Ödeme Yöntemleri', 'Bu özellik yakında eklenecek'),
    },
  ];

  // Account settings menu items
  const accountSettings: MenuItem[] = [
    {
      icon: 'person-outline',
      label: 'Profil Bilgileri',
      subtitle: 'Ad, soyad, telefon',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
      onPress: () => router.push('/profile/edit'),
    },
    {
      icon: 'lock-closed-outline',
      label: 'Güvenlik',
      subtitle: 'Şifre ve giriş ayarları',
      iconColor: '#EF4444',
      iconBg: '#FEE2E2',
      onPress: () => router.push('/settings/security'),
    },
  ];

  // Notification settings
  const notificationSettings = [
    {
      icon: 'notifications-outline',
      label: 'Push Bildirimleri',
      subtitle: 'Uygulama bildirimleri',
      value: notificationsEnabled,
      onValueChange: setNotificationsEnabled,
    },
    {
      icon: 'chatbubble-outline',
      label: 'SMS Bildirimleri',
      subtitle: 'Randevu hatırlatmaları',
      value: smsEnabled,
      onValueChange: setSmsEnabled,
    },
    {
      icon: 'logo-whatsapp',
      label: 'WhatsApp Bildirimleri',
      subtitle: 'WhatsApp üzerinden bildirimler',
      value: whatsappEnabled,
      onValueChange: setWhatsappEnabled,
    },
  ];

  // Support menu items
  const supportItems: MenuItem[] = [
    {
      icon: 'help-circle-outline',
      label: 'Yardım & Destek',
      iconColor: '#6B7280',
      iconBg: '#F3F4F6',
      onPress: () => router.push('/settings/help'),
    },
    {
      icon: 'chatbubbles-outline',
      label: 'Bize Ulaşın',
      iconColor: '#6B7280',
      iconBg: '#F3F4F6',
      onPress: () => Linking.openURL('mailto:destek@netrandevu.com'),
    },
    {
      icon: 'document-text-outline',
      label: 'Gizlilik Politikası',
      iconColor: '#6B7280',
      iconBg: '#F3F4F6',
      onPress: () => router.push('/settings/privacy'),
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Kullanım Koşulları',
      iconColor: '#6B7280',
      iconBg: '#F3F4F6',
      onPress: () => router.push('/settings/privacy'),
    },
    {
      icon: 'information-circle-outline',
      label: 'Hakkında',
      iconColor: '#6B7280',
      iconBg: '#F3F4F6',
      onPress: () => router.push('/settings/about'),
    },
  ];

  // Render menu item
  const renderMenuItem = (item: MenuItem, isLast: boolean) => (
    <TouchableOpacity
      key={item.label}
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: item.iconBg || '#F3F4F6' }]}>
        <Ionicons name={item.icon as any} size={20} color={item.iconColor || '#6B7280'} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuLabel}>{item.label}</Text>
        {item.subtitle && <Text style={styles.menuSubtitle}>{item.subtitle}</Text>}
      </View>
      {item.badge && (
        <View style={[styles.badge, { backgroundColor: item.badgeColor || '#EF4444' }]}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </TouchableOpacity>
  );

  // Render toggle item
  const renderToggleItem = (item: any, isLast: boolean) => (
    <View key={item.label} style={[styles.menuItem, !isLast && styles.menuItemBorder]}>
      <View style={[styles.menuIconContainer, { backgroundColor: '#F3F4F6' }]}>
        <Ionicons name={item.icon as any} size={20} color="#6B7280" />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuLabel}>{item.label}</Text>
        {item.subtitle && <Text style={styles.menuSubtitle}>{item.subtitle}</Text>}
      </View>
      <Switch
        value={item.value}
        onValueChange={item.onValueChange}
        trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
        thumbColor={item.value ? '#3B82F6' : '#fff'}
        ios_backgroundColor="#E5E7EB"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ayarlar</Text>
        </View>

        {/* User Profile Card */}
        <TouchableOpacity
          style={styles.userCard}
          onPress={() => router.push('/profile/edit')}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0)?.toUpperCase() || user?.phone?.charAt(0) || 'P'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : 'Personel'}
            </Text>
            <View style={styles.userRoleRow}>
              <View style={[styles.roleBadge, user?.userType === 'owner' && styles.ownerBadge]}>
                <Ionicons
                  name={user?.userType === 'owner' ? 'shield-checkmark' : 'person'}
                  size={12}
                  color={user?.userType === 'owner' ? '#D97706' : '#6B7280'}
                />
                <Text style={[styles.roleText, user?.userType === 'owner' && styles.ownerRoleText]}>
                  {user?.userType === 'owner' ? 'Salon Sahibi' : 'Personel'}
                </Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>

        {/* Current Tenant Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aktif Salon</Text>
          <TouchableOpacity
            style={styles.tenantCard}
            onPress={handleSwitchTenant}
            disabled={availableTenants.length <= 1}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.tenantLogo,
                { backgroundColor: selectedTenant?.primaryColor || '#3B82F6' },
              ]}
            >
              <Text style={styles.tenantInitial}>
                {selectedTenant?.businessName?.charAt(0)?.toUpperCase() || 'S'}
              </Text>
            </View>
            <View style={styles.tenantInfo}>
              <Text style={styles.tenantName}>{selectedTenant?.businessName || 'Salon'}</Text>
              <Text style={styles.tenantSlug}>@{selectedTenant?.slug || 'salon'}</Text>
            </View>
            {availableTenants.length > 1 && (
              <View style={styles.switchBadge}>
                <Ionicons name="swap-horizontal" size={14} color="#3B82F6" />
                <Text style={styles.switchText}>Değiştir</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Actions - Only for owners */}
        {user?.userType === 'owner' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.label}
                  style={styles.quickActionItem}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Business Settings - Only for owners */}
        {user?.userType === 'owner' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İşletme Ayarları</Text>
            <View style={styles.menuCard}>
              {businessSettings.map((item, index) =>
                renderMenuItem(item, index === businessSettings.length - 1)
              )}
            </View>
          </View>
        )}

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap</Text>
          <View style={styles.menuCard}>
            {accountSettings.map((item, index) =>
              renderMenuItem(item, index === accountSettings.length - 1)
            )}
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirimler</Text>
          <View style={styles.menuCard}>
            {notificationSettings.map((item, index) =>
              renderToggleItem(item, index === notificationSettings.length - 1)
            )}
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destek</Text>
          <View style={styles.menuCard}>
            {supportItems.map((item, index) =>
              renderMenuItem(item, index === supportItems.length - 1)
            )}
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <Ionicons name="calendar" size={24} color="#3B82F6" />
          </View>
          <Text style={styles.appName}>Net Randevu</Text>
          <Text style={styles.version}>Versiyon 1.0.0</Text>
          <Text style={styles.copyright}>© 2024 Net Randevu. Tüm hakları saklıdır.</Text>
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

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },

  // User Card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  userRoleRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ownerBadge: {
    backgroundColor: '#FEF3C7',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  ownerRoleText: {
    color: '#D97706',
  },

  // Section
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // Tenant Card
  tenantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tenantLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenantInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  tenantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  tenantSlug: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  switchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  switchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionItem: {
    width: '22%',
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
  },

  // Menu Card
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
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
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingBottom: 100,
  },
  footerLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
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
  copyright: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 8,
  },
});
