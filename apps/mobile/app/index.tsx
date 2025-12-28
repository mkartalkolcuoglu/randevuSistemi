import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../src/store/auth.store';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, [isAuthenticated, user]);

  const checkOnboardingStatus = async () => {
    if (!isAuthenticated || user?.userType !== 'customer') {
      setIsCheckingOnboarding(false);
      return;
    }

    try {
      // Check if onboarding was already completed
      const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);

      // Check if profile is incomplete (no firstName or lastName)
      const profileIncomplete = !user?.firstName || !user?.lastName;

      // Need onboarding if not completed before AND profile is incomplete
      if (!onboardingCompleted && profileIncomplete) {
        setNeedsOnboarding(true);
      } else {
        setNeedsOnboarding(false);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  // Show loading while checking onboarding status
  if (isCheckingOnboarding) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Not authenticated - go to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Customer needs onboarding
  if (user?.userType === 'customer' && needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  // Customer authenticated with complete profile
  if (user?.userType === 'customer') {
    return <Redirect href="/(tabs)/customer" />;
  }

  // Staff or owner
  return <Redirect href="/(tabs)/staff" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
