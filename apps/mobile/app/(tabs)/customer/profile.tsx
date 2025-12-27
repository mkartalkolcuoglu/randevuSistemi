import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/auth.store';

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { user, selectedTenant, logout, availableTenants } = useAuthStore();

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

  const menuItems = [
    {
      icon: 'person-outline',
      label: 'Kişisel Bilgiler',
      onPress: () => router.push('/profile/edit'),
    },
    {
      icon: 'notifications-outline',
      label: 'Bildirim Ayarları',
      onPress: () => Alert.alert('Bildirim Ayarları', 'Bu özellik yakında eklenecek'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Yardım & Destek',
      onPress: () => Alert.alert('Yardım', 'Destek için: destek@netrandevu.com'),
    },
    {
      icon: 'document-text-outline',
      label: 'Gizlilik Politikası',
      onPress: () => Alert.alert('Gizlilik Politikası', 'Bu özellik yakında eklenecek'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0) || user?.phone?.charAt(0) || 'K'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : 'Kullanıcı'}
            </Text>
            <Text style={styles.userPhone}>{user?.phone}</Text>
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
              >
                <Ionicons name={item.icon as any} size={22} color="#6B7280" />
                <Text style={styles.menuLabel}>{item.label}</Text>
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

        {/* App Version */}
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  userPhone: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
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
    width: 48,
    height: 48,
    borderRadius: 10,
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
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  switchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  switchText: {
    fontSize: 13,
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
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
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
    paddingBottom: 40,
  },
  version: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
