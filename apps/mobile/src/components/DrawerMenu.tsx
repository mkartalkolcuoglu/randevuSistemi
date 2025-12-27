import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '../store/auth.store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 320);

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: number;
  color?: string;
  bgColor?: string;
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
  const { user, selectedTenant, logout } = useAuthStore();

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
        { id: 'dashboard', label: 'Ana Sayfa', icon: 'home', route: '/(tabs)/staff', color: '#3B82F6', bgColor: '#EFF6FF' },
        { id: 'appointments', label: 'Randevular', icon: 'calendar', route: '/(tabs)/staff/appointments', color: '#8B5CF6', bgColor: '#F3E8FF' },
        { id: 'calendar', label: 'Takvim', icon: 'calendar-outline', route: '/(tabs)/staff/calendar', color: '#06B6D4', bgColor: '#ECFEFF' },
        { id: 'customers', label: 'Müşteriler', icon: 'people', route: '/(tabs)/staff/customers', color: '#10B981', bgColor: '#D1FAE5' },
      ],
    },
    {
      title: 'YÖNETİM',
      items: [
        { id: 'services', label: 'Hizmetler', icon: 'cut', route: '/(tabs)/staff/services', color: '#F59E0B', bgColor: '#FEF3C7' },
        { id: 'staff', label: 'Personel', icon: 'people', route: '/(tabs)/staff/team', color: '#EC4899', bgColor: '#FCE7F3' },
        { id: 'packages', label: 'Paketler', icon: 'gift', route: '/(tabs)/staff/packages', color: '#6366F1', bgColor: '#E0E7FF' },
        { id: 'stock', label: 'Stok', icon: 'cube', route: '/(tabs)/staff/stock', color: '#14B8A6', bgColor: '#CCFBF1' },
      ],
    },
    {
      title: 'FİNANS & RAPORLAR',
      items: [
        { id: 'cashier', label: 'Kasa', icon: 'cash', route: '/(tabs)/staff/cashier', color: '#22C55E', bgColor: '#DCFCE7' },
        { id: 'reports', label: 'Raporlar', icon: 'bar-chart', route: '/(tabs)/staff/reports', color: '#EF4444', bgColor: '#FEE2E2' },
        { id: 'performance', label: 'Performans', icon: 'trending-up', route: '/(tabs)/staff/performance', color: '#F97316', bgColor: '#FFEDD5' },
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
          {/* Gradient Header */}
          <LinearGradient
            colors={['#1E3A8A', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>

            {/* Business Logo & Name */}
            <View style={styles.businessContainer}>
              <View style={styles.logoWrapper}>
                <Text style={styles.logoText}>
                  {selectedTenant?.businessName?.charAt(0)?.toUpperCase() || 'N'}
                </Text>
              </View>
              <Text style={styles.businessName} numberOfLines={1}>
                {selectedTenant?.businessName || 'Net Randevu'}
              </Text>
            </View>

            {/* User Info */}
            <View style={styles.userContainer}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <View style={styles.userRoleBadge}>
                  <Text style={styles.userRoleText}>
                    {user?.userType === 'owner' ? 'İşletme Sahibi' : 'Personel'}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Quick Action */}
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => handleNavigate('/appointment/new')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.quickActionGradient}
            >
              <Ionicons name="add-circle" size={22} color="#fff" />
              <Text style={styles.quickActionText}>Yeni Randevu Oluştur</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Menu Items */}
          <ScrollView
            style={styles.menuContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.menuContent}
          >
            {menuSections.map((section, sectionIndex) => (
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
                      {item.badge && item.badge > 0 && (
                        <View style={[styles.badge, { backgroundColor: item.color }]}>
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      )}
                      {active && (
                        <View style={[styles.activeIndicator, { backgroundColor: item.color }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {/* Settings Link */}
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => handleNavigate('/(tabs)/staff/settings')}
              activeOpacity={0.7}
            >
              <View style={styles.settingsIconWrapper}>
                <Ionicons name="settings" size={20} color="#6B7280" />
              </View>
              <Text style={styles.settingsText}>Ayarlar</Text>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              <Text style={styles.logoutText}>Çıkış Yap</Text>
            </TouchableOpacity>
            <Text style={styles.version}>Net Randevu v1.0.0</Text>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  drawerContent: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  businessContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  logoWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  businessName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  userRoleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    marginTop: 4,
  },
  userRoleText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },

  // Quick Action
  quickActionBtn: {
    marginHorizontal: 16,
    marginTop: -12,
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  quickActionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },

  // Menu
  menuContainer: {
    flex: 1,
  },
  menuContent: {
    paddingBottom: 20,
  },
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  menuSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
    paddingLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 2,
  },
  menuItemActive: {
    backgroundColor: '#F8FAFC',
  },
  menuIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginLeft: 12,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  activeIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginLeft: 8,
  },

  // Settings
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  settingsIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginLeft: 12,
  },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },
  version: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
  },
});
