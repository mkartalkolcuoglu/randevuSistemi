import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth.store';

export default function TabLayout() {
  const { user } = useAuthStore();
  const isCustomer = user?.userType === 'customer';

  if (isCustomer) {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#E5E7EB',
            height: 85,
            paddingBottom: 25,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="customer/index"
          options={{
            title: 'Randevularım',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="customer/new-appointment"
          options={{
            title: 'Yeni Randevu',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="customer/profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
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
        <Tabs.Screen name="staff/kasa" options={{ href: null }} />
        <Tabs.Screen name="staff/notifications" options={{ href: null }} />
      </Tabs>
    );
  }

  // Staff/Owner layout - Only 3 tabs: Yeni Randevu, Müşteriler, Takvim
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#163974',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E5E7EB',
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      {/* Visible tabs */}
      <Tabs.Screen
        name="staff/index"
        options={{
          title: 'Yeni Randevu',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="staff/customers"
        options={{
          title: 'Müşteriler',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="staff/appointments"
        options={{
          title: 'Takvim',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden staff tabs - accessible via navigation but not shown in tab bar */}
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
      <Tabs.Screen name="staff/kasa" options={{ href: null }} />
      <Tabs.Screen name="staff/notifications" options={{ href: null }} />

      {/* Hide customer tabs for staff */}
      <Tabs.Screen name="customer/index" options={{ href: null }} />
      <Tabs.Screen name="customer/new-appointment" options={{ href: null }} />
      <Tabs.Screen name="customer/profile" options={{ href: null }} />
    </Tabs>
  );
}
