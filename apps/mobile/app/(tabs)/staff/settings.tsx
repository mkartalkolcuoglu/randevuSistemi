import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useAuthStore } from '../../../src/store/auth.store';

export default function StaffSettingsScreen() {
  const router = useRouter();
  const { user, selectedTenant, logout, availableTenants } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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

  const businessSettings = [
    {
      icon: 'time-outline',
      label: 'Çalışma Saatleri',
      subtitle: 'Salon açılış-kapanış saatleri',
      onPress: () => router.push('/settings/working-hours'),
    },
    {
      icon: 'cut-outline',
      label: 'Hizmetler',
      subtitle: 'Hizmet ve fiyat yönetimi',
      onPress: () => router.push('/settings/services'),
    },
    {
      icon: 'people-outline',
      label: 'Personel',
      subtitle: 'Personel listesi ve yetkileri',
      onPress: () => router.push('/settings/staff'),
    },
    {
      icon: 'calendar-outline',
      label: 'Randevu Ayarları',
      subtitle: 'Randevu kuralları ve süreler',
      onPress: () => router.push('/settings/appointments'),
    },
  ];

  const accountSettings = [
    {
      icon: 'person-outline',
      label: 'Profil Bilgileri',
      onPress: () => router.push('/profile/edit'),
    },
    {
      icon: 'lock-closed-outline',
      label: 'Güvenlik',
      onPress: () => router.push('/settings/security'),
    },
  ];

  const supportItems = [
    {
      icon: 'help-circle-outline',
      label: 'Yardım & Destek',
      onPress: () => router.push('/settings/help'),
    },
    {
      icon: 'document-text-outline',
      label: 'Gizlilik Politikası',
      onPress: () => router.push('/settings/privacy'),
    },
    {
      icon: 'information-circle-outline',
      label: 'Hakkında',
      onPress: () => router.push('/settings/about'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Ayarlar</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0) || user?.phone?.charAt(0) || 'P'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : 'Personel'}
            </Text>
            <Text style={styles.userRole}>
              {user?.userType === 'owner' ? 'Salon Sahibi' : 'Personel'}
            </Text>
          </View>
        </View>

        {/* Current Tenant */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aktif Salon</Text>
          <TouchableOpacity
            style={styles.tenantCard}
            onPress={handleSwitchTenant}
            disabled={availableTenants.length <= 1}
          >
            <View
              style={[
                styles.tenantLogo,
                { backgroundColor: selectedTenant?.primaryColor || '#3B82F6' },
              ]}
            >
              <Text style={styles.tenantInitial}>
                {selectedTenant?.businessName?.charAt(0) || 'S'}
              </Text>
            </View>
            <View style={styles.tenantInfo}>
              <Text style={styles.tenantName}>{selectedTenant?.businessName}</Text>
              <Text style={styles.tenantSlug}>@{selectedTenant?.slug}</Text>
            </View>
            {availableTenants.length > 1 && (
              <View style={styles.switchBadge}>
                <Ionicons name="swap-horizontal" size={16} color="#3B82F6" />
                <Text style={styles.switchText}>Değiştir</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Business Settings - Only for owners */}
        {user?.userType === 'owner' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İşletme Ayarları</Text>
            <View style={styles.menuCard}>
              {businessSettings.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    index < businessSettings.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons name={item.icon as any} size={22} color="#3B82F6" />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap</Text>
          <View style={styles.menuCard}>
            {accountSettings.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuItem,
                  index < accountSettings.length - 1 && styles.menuItemBorder,
                ]}
                onPress={item.onPress}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={22} color="#6B7280" />
                </View>
                <Text style={styles.menuLabelOnly}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirimler</Text>
          <View style={styles.menuCard}>
            <View style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="notifications-outline" size={22} color="#6B7280" />
              </View>
              <Text style={styles.menuLabelOnly}>Push Bildirimleri</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={notificationsEnabled ? '#3B82F6' : '#F3F4F6'}
              />
            </View>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destek</Text>
          <View style={styles.menuCard}>
            {supportItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuItem,
                  index < supportItems.length - 1 && styles.menuItemBorder,
                ]}
                onPress={item.onPress}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={22} color="#6B7280" />
                </View>
                <Text style={styles.menuLabelOnly}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View style={styles.footer}>
          <Text style={styles.version}>Net Randevu v1.0.0</Text>
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
    padding: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
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
  },
  tenantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tenantLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenantInitial: {
    fontSize: 18,
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
    paddingVertical: 5,
    borderRadius: 14,
  },
  switchText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
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
  menuLabelOnly: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    marginLeft: 12,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 100,
  },
  version: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
