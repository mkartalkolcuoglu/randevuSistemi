import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../../src/services/api';
import DrawerMenu from '../../../src/components/DrawerMenu';
import Header from '../../../src/components/Header';

const THEME_COLOR = '#163974';

// HIG/Material Design compliant header values
const IS_IOS = Platform.OS === 'ios';
const HEADER_BTN_SIZE = IS_IOS ? 44 : 48;
const HEADER_BTN_RADIUS = IS_IOS ? 12 : 16;

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// Notification type icons and colors
const NOTIFICATION_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  new_appointment: { icon: 'calendar', color: '#3B82F6', bg: '#DBEAFE' },
  appointment_cancelled: { icon: 'close-circle', color: '#EF4444', bg: '#FEE2E2' },
  appointment_confirmed: { icon: 'checkmark-circle', color: '#059669', bg: '#D1FAE5' },
  appointment_completed: { icon: 'checkmark-done', color: '#059669', bg: '#D1FAE5' },
  reminder: { icon: 'alarm', color: '#F59E0B', bg: '#FEF3C7' },
  payment: { icon: 'cash', color: '#10B981', bg: '#D1FAE5' },
  default: { icon: 'notifications', color: THEME_COLOR, bg: '#EFF6FF' },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/mobile/notifications');
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/api/mobile/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/mobile/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Hata', 'Bildirimler okundu olarak işaretlenemedi');
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type or link
    if (notification.link) {
      // Convert web link to mobile route
      if (notification.link.includes('/appointments/')) {
        router.push('/(tabs)/staff/appointments');
      } else if (notification.link.includes('/customers/')) {
        router.push('/(tabs)/staff/customers');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;

    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNotificationConfig = (type: string) => {
    return NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.default;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <Header
        title="Bildirimler"
        subtitle={unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler'}
        onMenuPress={() => setDrawerOpen(true)}
        gradientColors={['#163974', '#1e4a8f']}
        stats={[
          { icon: 'notifications', iconColor: '#3B82F6', iconBg: '#DBEAFE', value: notifications.length, label: 'Toplam' },
          { icon: 'mail-unread', iconColor: '#F59E0B', iconBg: '#FEF3C7', value: unreadCount, label: 'Okunmamış' },
          { icon: 'checkmark-done', iconColor: '#10B981', iconBg: '#D1FAE5', value: notifications.length - unreadCount, label: 'Okunmuş' },
        ]}
        rightIcon={unreadCount > 0 ? "checkmark-done-outline" : undefined}
        onRightPress={unreadCount > 0 ? markAllAsRead : undefined}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME_COLOR]} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>Bildirim yok</Text>
            <Text style={styles.emptySubtitle}>Yeni bildirimler burada görünecek</Text>
          </View>
        ) : (
          notifications.map((notification) => {
            const config = getNotificationConfig(notification.type);
            return (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationUnread,
                ]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View style={[styles.notificationIcon, { backgroundColor: config.bg }]}>
                  <Ionicons name={config.icon as any} size={22} color={config.color} />
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle} numberOfLines={1}>
                      {notification.title}
                    </Text>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>{formatDate(notification.createdAt)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

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

  // Header - HIG/Material Design Compliant
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IS_IOS ? 20 : 16,
    paddingTop: IS_IOS ? 16 : 12,
    paddingBottom: IS_IOS ? 12 : 8,
  },
  backButton: {
    width: HEADER_BTN_SIZE,
    height: HEADER_BTN_SIZE,
    borderRadius: HEADER_BTN_RADIUS,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...(IS_IOS ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    } : {
      elevation: 2,
    }),
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: IS_IOS ? 12 : 16,
    gap: 10,
  },
  title: {
    fontSize: IS_IOS ? 24 : 22,
    fontWeight: IS_IOS ? '700' : '600',
    color: '#1F2937',
    letterSpacing: IS_IOS ? -0.5 : 0,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME_COLOR,
  },

  scrollContent: {
    paddingTop: 8,
    paddingHorizontal: 20,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // Notification Card
  notificationCard: {
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
  notificationUnread: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
});
