import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '../store/auth.store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DrawerMenu({ isOpen, onClose }: DrawerMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, selectedTenant, logout } = useAuthStore();

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: 'home', route: '/(tabs)/staff' },
    { id: 'appointments', label: 'Randevular', icon: 'calendar', route: '/(tabs)/staff/appointments' },
    { id: 'customers', label: 'Müşteriler', icon: 'people', route: '/(tabs)/staff/customers' },
    { id: 'services', label: 'Hizmetler', icon: 'cut', route: '/settings/services' },
    { id: 'packages', label: 'Paketler', icon: 'gift', route: '/settings/packages' },
    { id: 'cashier', label: 'Kasa', icon: 'cash', route: '/settings/cashier' },
    { id: 'settings', label: 'Ayarlar', icon: 'settings', route: '/(tabs)/staff/settings' },
  ];

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/login');
  };

  const isActive = (route: string) => {
    if (route === '/(tabs)/staff' && pathname === '/staff') return true;
    return pathname.includes(route.replace('/(tabs)', ''));
  };

  if (!isOpen) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.drawer}>
        <SafeAreaView style={styles.drawerContent} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View
                style={[
                  styles.logo,
                  { backgroundColor: selectedTenant?.primaryColor || '#3B82F6' }
                ]}
              >
                <Text style={styles.logoText}>
                  {selectedTenant?.businessName?.charAt(0)?.toUpperCase() || 'N'}
                </Text>
              </View>
              <View style={styles.businessInfo}>
                <Text style={styles.businessName} numberOfLines={1}>
                  {selectedTenant?.businessName || 'Net Randevu'}
                </Text>
                <Text style={styles.userRole}>
                  {user?.userType === 'owner' ? 'İşletme Sahibi' : 'Personel'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* User Card */}
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView
            style={styles.menuContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>MENÜ</Text>
              {menuItems.map((item) => {
                const active = isActive(item.route);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.menuItem, active && styles.menuItemActive]}
                    onPress={() => handleNavigate(item.route)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.menuIconWrapper, active && styles.menuIconWrapperActive]}>
                      <Ionicons
                        name={item.icon as any}
                        size={22}
                        color={active ? '#3B82F6' : '#6B7280'}
                      />
                    </View>
                    <Text style={[styles.menuItemText, active && styles.menuItemTextActive]}>
                      {item.label}
                    </Text>
                    {item.badge && item.badge > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={active ? '#3B82F6' : '#D1D5DB'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Actions */}
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>HIZLI İŞLEMLER</Text>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('/appointments/new')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconWrapper, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="add-circle" size={22} color="#3B82F6" />
                </View>
                <Text style={styles.menuItemText}>Yeni Randevu</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('/customers/new')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconWrapper, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="person-add" size={22} color="#059669" />
                </View>
                <Text style={styles.menuItemText}>Yeni Müşteri</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              <Text style={styles.logoutText}>Çıkış Yap</Text>
            </TouchableOpacity>
            <Text style={styles.version}>Net Randevu v1.0.0</Text>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 320,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  businessInfo: {
    marginLeft: 12,
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userRole: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  menuContainer: {
    flex: 1,
  },
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  menuSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: '#EFF6FF',
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconWrapperActive: {
    backgroundColor: '#DBEAFE',
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
    marginLeft: 12,
  },
  menuItemTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  version: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
  },
});
