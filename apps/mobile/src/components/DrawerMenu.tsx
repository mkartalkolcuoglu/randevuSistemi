import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '../store/auth.store';
import api from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 320);
const THEME_COLOR = '#163974';

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
  const [unreadCount, setUnreadCount] = useState(0);

  // Animation values
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
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

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/mobile/notifications');
      if (response.data.success) {
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const menuSections: MenuSection[] = [
    {
      title: 'ANA MENÜ',
      items: [
        { id: 'dashboard', label: 'Ana Sayfa', icon: 'home', route: '/(tabs)/staff', color: THEME_COLOR, bgColor: '#EFF6FF' },
        { id: 'appointments', label: 'Takvim', icon: 'calendar', route: '/(tabs)/staff/appointments', color: '#8B5CF6', bgColor: '#F3E8FF' },
        { id: 'customers', label: 'Müşteriler', icon: 'people', route: '/(tabs)/staff/customers', color: '#10B981', bgColor: '#D1FAE5' },
        { id: 'notifications', label: 'Bildirimler', icon: 'notifications', route: '/(tabs)/staff/notifications', color: '#F59E0B', bgColor: '#FEF3C7', badge: unreadCount },
      ],
    },
    {
      title: 'İŞLETME YÖNETİMİ',
      items: [
        { id: 'services', label: 'Hizmetler', icon: 'cut', route: '/(tabs)/staff/services', color: '#EC4899', bgColor: '#FCE7F3' },
        { id: 'staff', label: 'Personel', icon: 'people-circle', route: '/(tabs)/staff/team', color: '#06B6D4', bgColor: '#ECFEFF' },
        { id: 'packages', label: 'Paketler', icon: 'gift', route: '/(tabs)/staff/packages', color: '#6366F1', bgColor: '#E0E7FF' },
        { id: 'stock', label: 'Stok Yönetimi', icon: 'cube', route: '/(tabs)/staff/stock', color: '#14B8A6', bgColor: '#CCFBF1' },
      ],
    },
    {
      title: 'FİNANS & RAPORLAR',
      items: [
        { id: 'kasa', label: 'Kasa', icon: 'wallet', route: '/(tabs)/staff/kasa', color: '#22C55E', bgColor: '#DCFCE7' },
        { id: 'reports', label: 'Raporlar', icon: 'bar-chart', route: '/(tabs)/staff/reports', color: '#3B82F6', bgColor: '#DBEAFE' },
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
          {/* Header */}
          <LinearGradient
            colors={[THEME_COLOR, '#1e4a8f']}
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

            {/* User Info */}
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

            {/* Business Info */}
            <View style={styles.businessCard}>
              <View style={styles.businessIcon}>
                <Text style={styles.businessIconText}>
                  {selectedTenant?.businessName?.charAt(0)?.toUpperCase() || 'N'}
                </Text>
              </View>
              <Text style={styles.businessName} numberOfLines={1}>
                {selectedTenant?.businessName || 'Net Randevu'}
              </Text>
            </View>
          </LinearGradient>

          {/* Menu Items */}
          <ScrollView
            style={styles.menuContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.menuContent}
          >
            {menuSections.map((section) => (
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  drawerContent: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  // User Section
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME_COLOR,
  },
  userInfo: {
    marginLeft: 14,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  userRole: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },

  // Business Card
  businessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 12,
  },
  businessIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  businessName: {
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
    paddingBottom: 16,
  },
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  menuSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
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
    width: 40,
    height: 40,
    borderRadius: 12,
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
    minWidth: 22,
    height: 22,
    borderRadius: 11,
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
  activeIndicator: {
    width: 4,
    height: 24,
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
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  settingsIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
    borderTopColor: '#F3F4F6',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },
});
