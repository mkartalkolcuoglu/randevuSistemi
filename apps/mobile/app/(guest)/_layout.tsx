import { Stack } from 'expo-router';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';

export default function GuestLayout() {
  const router = useRouter();
  const { exitGuestMode } = useAuthStore();

  const handleLogin = () => {
    exitGuestMode();
    router.replace('/(auth)/login');
  };

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#1F2937',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        headerShadowVisible: false,
        headerRight: () => (
          <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Giriş Yap</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen
        name="explore/index"
        options={{
          title: 'Salonları Keşfet',
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="business/[id]"
        options={{
          title: 'Salon Detayı',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#059669',
    borderRadius: 8,
    marginRight: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
