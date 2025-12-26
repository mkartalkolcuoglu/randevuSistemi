import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();

  // Not authenticated - go to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Authenticated - redirect based on user type
  if (user?.userType === 'customer') {
    return <Redirect href="/(tabs)/customer" />;
  }

  // Staff or owner
  return <Redirect href="/(tabs)/staff" />;
}
