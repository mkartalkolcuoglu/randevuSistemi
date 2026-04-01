import { Tabs } from 'expo-router';
import { Platform, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/auth.store';
import { canAccessPage, StaffPermissions } from '../../src/types';

// HIG/Material Design Compliant values
const TAB_BAR_BASE_HEIGHT = Platform.OS === 'ios' ? 49 : 64; // iOS HIG: 49pt, Android Material: 64dp
const TAB_ICON_SIZE = Platform.OS === 'ios' ? 28 : 24; // iOS: 25-28pt, Android: 24dp
const TAB_LABEL_SIZE = Platform.OS === 'ios' ? 10 : 12; // iOS HIG: 10pt, Android: 12sp
const TAB_ACTIVE_COLOR = '#163974';
const TAB_INACTIVE_COLOR = Platform.OS === 'ios' ? '#8E8E93' : '#49454F'; // iOS: systemGray, Android: onSurfaceVariant

export default function TabLayout() {
  const { user, logout } = useAuthStore();
  const insets = useSafeAreaInsets();
  const isCustomer = user?.userType === 'customer';
  const isOwner = user?.userType === 'owner';

  // Subscription check for staff/owner
  const isSubscriptionExpired = !isCustomer && user?.subscriptionEnd
    ? new Date(user.subscriptionEnd) < new Date()
    : false;

  if (isSubscriptionExpired) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
            <Ionicons name="warning" size={40} color="#DC2626" />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 8 }}>
            Abonelik Süresi Doldu
          </Text>
          <Text style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
            Hizmete devam etmek için web panelden abonelik paketinizi yenileyin.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://admin.netrandevu.com/admin/select-subscription')}
            style={{ backgroundColor: '#163974', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginBottom: 12, width: '100%', alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Paket Yenile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => logout()}
            style={{ paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' }}
          >
            <Text style={{ color: '#DC2626', fontSize: 15, fontWeight: '500' }}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  const permissions = user?.permissions as StaffPermissions | null | undefined;
  
  // Check permissions for tab bar items (null permissions uses defaults via canAccessPage)
  const canSeeDashboard = isOwner || canAccessPage(permissions, 'dashboard');
  const canSeeAppointments = isOwner || canAccessPage(permissions, 'appointments');
  const canSeeCustomers = isOwner || canAccessPage(permissions, 'customers');

  // Calculate tab bar height with safe area - both platforms need bottom inset
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 16 : 0);
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + bottomInset;

  // Common screen options for HIG compliance
  const getScreenOptions = (activeColor: string) => ({
    tabBarActiveTintColor: activeColor,
    tabBarInactiveTintColor: TAB_INACTIVE_COLOR,
    tabBarStyle: {
      backgroundColor: '#fff',
      borderTopColor: Platform.OS === 'ios' ? '#C6C6C8' : '#E7E0EC', // iOS: separator, Android: surfaceVariant
      borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
      height: tabBarHeight,
      paddingBottom: bottomInset,
      paddingTop: Platform.OS === 'ios' ? 8 : 12,
      // iOS uses subtle shadow, Android uses elevation
      ...(Platform.OS === 'ios' ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      } : {
        elevation: 8,
      }),
    },
    tabBarLabelStyle: {
      fontSize: TAB_LABEL_SIZE,
      fontWeight: '500' as const,
      marginTop: Platform.OS === 'ios' ? 0 : 4,
    },
    tabBarIconStyle: {
      marginBottom: Platform.OS === 'ios' ? 0 : -2,
    },
    headerShown: false,
  });

  if (isCustomer) {
    return (
      <Tabs screenOptions={getScreenOptions('#3B82F6')}>
        <Tabs.Screen
          name="customer/index"
          options={{
            title: 'Randevularım',
            tabBarIcon: ({ color }) => (
              <Ionicons name="calendar" size={TAB_ICON_SIZE} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="customer/new-appointment"
          options={{
            title: 'Yeni Randevu',
            tabBarIcon: ({ color }) => (
              <Ionicons name="add-circle" size={TAB_ICON_SIZE} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="customer/packages"
          options={{
            title: 'Paketlerim',
            tabBarIcon: ({ color }) => (
              <Ionicons name="gift" size={TAB_ICON_SIZE} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="customer/profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color }) => (
              <Ionicons name="person" size={TAB_ICON_SIZE} color={color} />
            ),
          }}
        />
        {/* Hide payment and notifications screens from tab bar */}
        <Tabs.Screen name="customer/payment" options={{ href: null }} />
        <Tabs.Screen name="customer/notifications" options={{ href: null }} />
        {/* Hide all staff tabs for customers */}
        <Tabs.Screen name="staff/index" options={{ href: null }} />
        <Tabs.Screen name="staff/appointments" options={{ href: null }} />
        <Tabs.Screen name="staff/customers" options={{ href: null }} />
        <Tabs.Screen name="staff/settings" options={{ href: null }} />
        <Tabs.Screen name="staff/business-settings" options={{ href: null }} />
        <Tabs.Screen name="staff/calendar" options={{ href: null }} />
        <Tabs.Screen name="staff/cashier" options={{ href: null }} />
        <Tabs.Screen name="staff/packages" options={{ href: null }} />
        <Tabs.Screen name="staff/performance" options={{ href: null }} />
        <Tabs.Screen name="staff/reports" options={{ href: null }} />
        <Tabs.Screen name="staff/services" options={{ href: null }} />
        <Tabs.Screen name="staff/stock" options={{ href: null }} />
        <Tabs.Screen name="staff/team" options={{ href: null }} />
        <Tabs.Screen name="staff/notifications" options={{ href: null }} />
      </Tabs>
    );
  }

  // Staff/Owner layout - 4 tabs: Ana Sayfa, Takvim, Randevular, Müşteriler
  return (
    <Tabs screenOptions={getScreenOptions(TAB_ACTIVE_COLOR)}>
      {/* Visible tabs - Home first */}
      <Tabs.Screen
        name="staff/index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="staff/calendar"
        options={{
          title: 'Takvim',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="staff/customers"
        options={{
          title: 'Müşteriler',
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />

      {/* Hidden staff tabs - accessible via navigation but not shown in tab bar */}
      <Tabs.Screen name="staff/appointments" options={{ href: null }} />
      <Tabs.Screen name="staff/settings" options={{ href: null }} />
      <Tabs.Screen name="staff/business-settings" options={{ href: null }} />
      <Tabs.Screen name="staff/cashier" options={{ href: null }} />
      <Tabs.Screen name="staff/packages" options={{ href: null }} />
      <Tabs.Screen name="staff/performance" options={{ href: null }} />
      <Tabs.Screen name="staff/reports" options={{ href: null }} />
      <Tabs.Screen name="staff/services" options={{ href: null }} />
      <Tabs.Screen name="staff/stock" options={{ href: null }} />
      <Tabs.Screen name="staff/team" options={{ href: null }} />
      <Tabs.Screen name="staff/notifications" options={{ href: null }} />

      {/* Hide customer tabs for staff */}
      <Tabs.Screen name="customer/index" options={{ href: null }} />
      <Tabs.Screen name="customer/new-appointment" options={{ href: null }} />
      <Tabs.Screen name="customer/packages" options={{ href: null }} />
      <Tabs.Screen name="customer/profile" options={{ href: null }} />
      <Tabs.Screen name="customer/payment" options={{ href: null }} />
      <Tabs.Screen name="customer/notifications" options={{ href: null }} />
    </Tabs>
  );
}
