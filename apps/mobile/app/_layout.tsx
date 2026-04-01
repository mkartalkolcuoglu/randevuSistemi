import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/store/auth.store';
import { View, ActivityIndicator, StyleSheet, AppState, LogBox } from 'react-native';

// Suppress expo-router's dev-only GO_BACK warning caused by href:null tabs during initialization
LogBox.ignoreLogs(["The action 'GO_BACK' was not handled"]);
import { notificationService } from '../src/services/notification.service';
import api from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SHOWN_NOTIFICATIONS_KEY = 'shown_notification_ids';

// Poll for new notifications every 30 seconds and show local push
function useNotificationPolling() {
  const { isAuthenticated, user } = useAuthStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user || user.userType === 'customer') return;

    const checkNotifications = async () => {
      if (AppState.currentState !== 'active') return;
      if (isCheckingRef.current) return; // Prevent concurrent checks
      isCheckingRef.current = true;

      try {
        const res = await api.get('/api/mobile/notifications');
        const notifications = res.data?.data || [];
        if (notifications.length === 0) return;

        // Read shown IDs from persistent storage
        const storedIds = await AsyncStorage.getItem(SHOWN_NOTIFICATIONS_KEY);
        const shownIds: string[] = storedIds ? JSON.parse(storedIds) : [];
        const shownSet = new Set(shownIds);

        let hasNew = false;
        for (const n of notifications) {
          if (!n.read && !shownSet.has(n.id)) {
            // New unread notification - show local push
            notificationService.scheduleLocalNotification(
              n.title || 'Bildirim',
              n.message || '',
              { notificationId: n.id, type: n.type },
            );
            shownSet.add(n.id);
            hasNew = true;
          }
        }

        if (hasNew) {
          // Keep only last 100 IDs to prevent storage bloat
          const updatedIds = Array.from(shownSet).slice(-100);
          await AsyncStorage.setItem(SHOWN_NOTIFICATIONS_KEY, JSON.stringify(updatedIds));
        }
      } catch {
        // Silently fail
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Initial check after 5 seconds (let app settle)
    const timeout = setTimeout(checkNotifications, 5000);
    // Then every 30 seconds
    intervalRef.current = setInterval(checkNotifications, 30000);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, user?.userType]);
}

export default function RootLayout() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  // Start notification polling for staff/owner
  useNotificationPolling();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#1E3A8A" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(guest)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
