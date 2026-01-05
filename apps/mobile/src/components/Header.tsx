import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const THEME_COLOR = '#163974';

// HIG/Material Design compliant values
const IS_IOS = Platform.OS === 'ios';
const HEADER_BTN_SIZE = IS_IOS ? 44 : 48;
const HEADER_BTN_RADIUS = IS_IOS ? 12 : 16;
const HEADER_ICON_SIZE = IS_IOS ? 24 : 24;

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuPress: () => void;
  // Right action options
  showNotification?: boolean;
  notificationCount?: number;
  onNotificationPress?: () => void;
  showSearch?: boolean;
  searchActive?: boolean;
  onSearchPress?: () => void;
  showCalendar?: boolean;
  onCalendarPress?: () => void;
  // Search bar
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
  // Stats row (optional)
  stats?: Array<{
    icon: string;
    iconColor: string;
    iconBg: string;
    value: string | number;
    label: string;
  }>;
  // Custom gradient colors
  gradientColors?: [string, string];
}

export default function Header({
  title,
  subtitle,
  onMenuPress,
  showNotification = false,
  notificationCount = 0,
  onNotificationPress,
  showSearch = false,
  searchActive = false,
  onSearchPress,
  showCalendar = false,
  onCalendarPress,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Ara...',
  stats,
  gradientColors = ['#1E3A8A', '#3B82F6'],
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.headerGradient, { paddingTop: insets.top + (IS_IOS ? 16 : 12) }]}
    >
      {/* Top Row: Menu, Title, Actions */}
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={onMenuPress}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={HEADER_ICON_SIZE} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>

        <View style={styles.headerActions}>
          {showCalendar && onCalendarPress && (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={onCalendarPress}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar" size={HEADER_ICON_SIZE - 2} color="#fff" />
            </TouchableOpacity>
          )}
          {showSearch && onSearchPress && (
            <TouchableOpacity
              style={[styles.headerBtn, searchActive && styles.headerBtnActive]}
              onPress={onSearchPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={searchActive ? 'close' : 'search'}
                size={HEADER_ICON_SIZE - 2}
                color="#fff"
              />
            </TouchableOpacity>
          )}
          {showNotification && onNotificationPress && (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={onNotificationPress}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications" size={HEADER_ICON_SIZE - 2} color="#fff" />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Row (optional) */}
      {stats && stats.length > 0 && (
        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <View style={[styles.statIconBg, { backgroundColor: stat.iconBg }]}>
                <Ionicons name={stat.icon as any} size={16} color={stat.iconColor} />
              </View>
              <Text style={styles.statNumber}>
                {typeof stat.value === 'number' && stat.value > 999
                  ? `${(stat.value / 1000).toFixed(1)}K`
                  : stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Search Bar (when active) */}
      {searchActive && onSearchChange && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={searchQuery}
            onChangeText={onSearchChange}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingHorizontal: IS_IOS ? 20 : 16,
    paddingBottom: IS_IOS ? 20 : 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    width: HEADER_BTN_SIZE,
    height: HEADER_BTN_SIZE,
    borderRadius: HEADER_BTN_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: IS_IOS ? 14 : 16,
  },
  headerTitle: {
    fontSize: IS_IOS ? 24 : 22,
    fontWeight: IS_IOS ? '700' : '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: IS_IOS ? 13 : 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: IS_IOS ? 10 : 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 12,
    marginTop: 20,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginTop: 16,
    height: IS_IOS ? 44 : 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: IS_IOS ? 15 : 16,
    color: '#fff',
    height: IS_IOS ? 44 : 48,
  },
});
