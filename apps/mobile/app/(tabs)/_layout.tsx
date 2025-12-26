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
        {/* Hide staff tabs for customers */}
        <Tabs.Screen name="staff/index" options={{ href: null }} />
        <Tabs.Screen name="staff/appointments" options={{ href: null }} />
        <Tabs.Screen name="staff/customers" options={{ href: null }} />
        <Tabs.Screen name="staff/settings" options={{ href: null }} />
      </Tabs>
    );
  }

  // Staff/Owner layout
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
        name="staff/index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="staff/appointments"
        options={{
          title: 'Randevular',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
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
        name="staff/settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      {/* Hide customer tabs for staff */}
      <Tabs.Screen name="customer/index" options={{ href: null }} />
      <Tabs.Screen name="customer/new-appointment" options={{ href: null }} />
      <Tabs.Screen name="customer/profile" options={{ href: null }} />
    </Tabs>
  );
}
