import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '../store/auth.store';
import { canAccessPage, StaffPermissions } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// HIG: iOS max 280pt, Material: max 360dp - use 85% or max
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, Platform.OS === 'ios' ? 280 : 320);
const THEME_COLOR = '#163974';

// HIG/Material compliant sizes
const IS_IOS = Platform.OS === 'ios';
const TOUCH_TARGET = IS_IOS ? 44 : 48; // iOS: 44pt min, Android: 48dp min
const BORDER_RADIUS = IS_IOS ? 10 : 16; // iOS: 10-16pt, Android: 16-28dp
const SECTION_TITLE_SIZE = IS_IOS ? 13 : 12; // iOS: 13pt footnote, Android: 12sp label

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: number;
  color?: string;
  bgColor?: string;
  permissionKey?: keyof StaffPermissions;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DrawerMenu({ isOpen, onClose }: DrawerMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  // Animation values
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const menuSections: MenuSection[] = [
    {
      title: 'ANA MENÜ',
      items: [
        { id: 'dashboard', label: 'Ana Sayfa', icon: 'home', route: '/(tabs)/staff', color: THEME_COLOR, bgColor: '#EFF6FF', permissionKey: 'dashboard' },
        { id: 'appointments', label: 'Randevular', icon: 'calendar', route: '/(tabs)/staff/appointments', color: '#8B5CF6', bgColor: '#F3E8FF', permissionKey: 'appointments' },
        { id: 'customers', label: 'Müşteriler', icon: 'people', route: '/(tabs)/staff/customers', color: '#10B981', bgColor: '#D1FAE5', permissionKey: 'customers' },
      ],
    },
    {
      title: 'İŞLETME YÖNETİMİ',
      items: [
        { id: 'services', label: 'Hizmetler', icon: 'cut', route: '/(tabs)/staff/services', color: '#EC4899', bgColor: '#FCE7F3', permissionKey: 'services' },
        { id: 'staff', label: 'Personel', icon: 'people-circle', route: '/(tabs)/staff/team', color: '#06B6D4', bgColor: '#ECFEFF', permissionKey: 'staff' },
        { id: 'packages', label: 'Paketler', icon: 'gift', route: '/(tabs)/staff/packages', color: '#6366F1', bgColor: '#E0E7FF', permissionKey: 'packages' },
        { id: 'stock', label: 'Stok Yönetimi', icon: 'cube', route: '/(tabs)/staff/stock', color: '#14B8A6', bgColor: '#CCFBF1', permissionKey: 'stock' },
      ],
    },
    {
      title: 'FİNANS & RAPORLAR',
      items: [
        { id: 'kasa', label: 'Kasa', icon: 'wallet', route: '/(tabs)/staff/cashier', color: '#22C55E', bgColor: '#DCFCE7', permissionKey: 'kasa' },
        { id: 'reports', label: 'Raporlar', icon: 'bar-chart', route: '/(tabs)/staff/reports', color: '#3B82F6', bgColor: '#DBEAFE', permissionKey: 'reports' },
        { id: 'performance', label: 'Performans', icon: 'trending-up', route: '/(tabs)/staff/performance', color: '#F97316', bgColor: '#FFEDD5', permissionKey: 'reports' },
      ],
    },
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
    if (route === '/(tabs)/staff' && (pathname === '/staff' || pathname === '/(tabs)/staff')) return true;
    return pathname.includes(route.replace('/(tabs)', ''));
  };

  if (!isOpen) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[styles.backdrop, { opacity: fadeAnim }]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        <SafeAreaView style={styles.drawerContent} edges={['top', 'bottom']}>
          {/* Header */}
          <LinearGradient
            colors={[THEME_COLOR, '#1e4a8f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {/* User Info & Close Button Row */}
            <View style={styles.headerRow}>
              <View style={styles.userSection}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.firstName} {user?.lastName}
                  </Text>
                  <Text style={styles.userRole}>
                    {user?.userType === 'owner' ? 'İşletme Sahibi' : 'Personel'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Menu Items */}
          <ScrollView
            style={styles.menuContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.menuContent}
          >
            {filteredMenuSections.map((section) => (
              <View key={section.title} style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>{section.title}</Text>
                {section.items.map((item) => {
                  const active = isActive(item.route);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.menuItem, active && styles.menuItemActive]}
                      onPress={() => handleNavigate(item.route)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.menuIconWrapper,
                          { backgroundColor: active ? item.bgColor : '#F3F4F6' }
                        ]}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={20}
                          color={active ? item.color : '#6B7280'}
                        />
                      </View>
                      <Text
                        style={[
                          styles.menuItemText,
                          active && { color: item.color, fontWeight: '600' }
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.badge !== undefined && item.badge > 0 ? (
                        <View style={[styles.badge, { backgroundColor: item.color }]}>
                          <Text style={styles.badgeText}>
                            {item.badge > 9 ? '9+' : item.badge}
                          </Text>
                        </View>
                      ) : null}
                      {active && (
                        <View style={[styles.activeIndicator, { backgroundColor: item.color }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {/* Settings */}
            <View style={styles.settingsSection}>
              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => handleNavigate('/(tabs)/staff/settings')}
                activeOpacity={0.7}
              >
                <View style={styles.settingsIconWrapper}>
                  <Ionicons name="settings-outline" size={20} color="#6B7280" />
                </View>
                <Text style={styles.settingsText}>İşletme Ayarları</Text>
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              </TouchableOpacity>
            </View>

            {/* Logout Button - inside ScrollView */}
            <View style={styles.logoutSection}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                <Text style={styles.logoutText}>Çıkış Yap</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
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
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    // Platform-specific shadows
    ...(IS_IOS ? {
      shadowColor: '#000',
      shadowOffset: { width: 4, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    } : {
      elevation: 16,
    }),
  },
  drawerContent: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: IS_IOS ? 20 : 16,
    paddingTop: IS_IOS ? 8 : 12,
    paddingBottom: IS_IOS ? 16 : 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: BORDER_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // User Section
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  userAvatar: {
    width: IS_IOS ? 52 : 56, // Android: 56dp for large avatars
    height: IS_IOS ? 52 : 56,
    borderRadius: IS_IOS ? 14 : 28, // Android: full circle
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...(IS_IOS ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    } : {
      elevation: 2,
    }),
  },
  userAvatarText: {
    fontSize: IS_IOS ? 22 : 24,
    fontWeight: '700',
    color: THEME_COLOR,
  },
  userInfo: {
    marginLeft: IS_IOS ? 14 : 16,
    flex: 1,
  },
  userName: {
    fontSize: IS_IOS ? 17 : 16, // iOS: 17pt headline, Android: 16sp title
    fontWeight: IS_IOS ? '600' : '500',
    color: '#fff',
  },
  userRole: {
    fontSize: IS_IOS ? 13 : 14, // iOS: 13pt footnote, Android: 14sp body
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },

  // Menu
  menuContainer: {
    flex: 1,
  },
  menuContent: {
    paddingBottom: 16,
  },
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  menuSectionTitle: {
    fontSize: SECTION_TITLE_SIZE,
    fontWeight: IS_IOS ? '600' : '500',
    color: IS_IOS ? '#8E8E93' : '#49454F', // iOS: systemGray, Android: onSurfaceVariant
    letterSpacing: IS_IOS ? 0.5 : 0.4,
    textTransform: IS_IOS ? 'none' : 'uppercase',
    marginBottom: 8,
    marginTop: 16,
    paddingLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH_TARGET,
    paddingVertical: IS_IOS ? 8 : 4,
    paddingHorizontal: IS_IOS ? 10 : 12,
    borderRadius: BORDER_RADIUS,
    marginBottom: 2,
  },
  menuItemActive: {
    backgroundColor: IS_IOS ? '#F8FAFC' : '#E8DEF8', // Android: secondaryContainer
  },
  menuIconWrapper: {
    width: TOUCH_TARGET - 4,
    height: TOUCH_TARGET - 4,
    borderRadius: IS_IOS ? 10 : (TOUCH_TARGET - 4) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: IS_IOS ? 15 : 14,
    fontWeight: '500',
    color: IS_IOS ? '#3C3C43' : '#1D1B20',
    marginLeft: 12,
  },
  badge: {
    minWidth: IS_IOS ? 20 : 24,
    height: IS_IOS ? 20 : 24,
    borderRadius: IS_IOS ? 10 : 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  badgeText: {
    fontSize: IS_IOS ? 11 : 12,
    fontWeight: '700',
    color: '#fff',
  },
  activeIndicator: {
    width: IS_IOS ? 3 : 4,
    height: IS_IOS ? 20 : 24,
    borderRadius: 2,
  },

  // Settings
  settingsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH_TARGET,
    paddingVertical: IS_IOS ? 8 : 4,
    paddingHorizontal: IS_IOS ? 10 : 12,
    borderTopWidth: IS_IOS ? 0.5 : 1,
    borderTopColor: IS_IOS ? '#C6C6C8' : '#E7E0EC',
  },
  settingsIconWrapper: {
    width: TOUCH_TARGET - 4,
    height: TOUCH_TARGET - 4,
    borderRadius: IS_IOS ? 10 : (TOUCH_TARGET - 4) / 2,
    backgroundColor: IS_IOS ? '#F2F2F7' : '#E7E0EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsText: {
    flex: 1,
    fontSize: IS_IOS ? 15 : 14,
    fontWeight: '500',
    color: IS_IOS ? '#3C3C43' : '#1D1B20',
    marginLeft: 12,
  },

  // Logout Section
  logoutSection: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: TOUCH_TARGET,
    backgroundColor: IS_IOS ? '#FEF2F2' : '#FFEDEA',
    borderRadius: BORDER_RADIUS,
  },
  logoutText: {
    fontSize: IS_IOS ? 17 : 14,
    fontWeight: '600',
    color: IS_IOS ? '#FF3B30' : '#BA1A1A', // iOS: systemRed, Android: error
    marginLeft: 8,
  },
});
