import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/auth.store';
import { canAccessPage, StaffPermissions } from '../types';
import Header from './Header';
import DrawerMenu from './DrawerMenu';

const THEME_COLOR = '#163974';

interface PermissionGuardProps {
  children: React.ReactNode;
  permissionKey: keyof StaffPermissions;
  pageName: string;
}

export default function PermissionGuard({ children, permissionKey, pageName }: PermissionGuardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const isOwner = user?.userType === 'owner';
  const permissions = user?.permissions as StaffPermissions | null | undefined;

  // Owner always has access
  if (isOwner) {
    return <>{children}</>;
  }

  // If permissions are set, check if user has access
  if (permissions && !canAccessPage(permissions, permissionKey)) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title={pageName}
          subtitle="Erişim Kısıtlı"
          onMenuPress={() => setDrawerOpen(true)}
          gradientColors={['#163974', '#1e4a8f']}
        />
        <View style={styles.accessDeniedContainer}>
          <View style={styles.accessDeniedIcon}>
            <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
          </View>
          <Text style={styles.accessDeniedTitle}>Erişim Yetkisi Yok</Text>
          <Text style={styles.accessDeniedText}>
            Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.{'\n'}
            Yetki için işletme sahibinize başvurun.
          </Text>
          <TouchableOpacity
            style={styles.accessDeniedButton}
            onPress={() => router.replace('/(tabs)/staff')}
          >
            <Ionicons name="home" size={20} color="#fff" />
            <Text style={styles.accessDeniedButtonText}>Ana Sayfaya Dön</Text>
          </TouchableOpacity>
        </View>
        <DrawerMenu isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </SafeAreaView>
    );
  }

  // If no permissions set (null) or user has access, show children
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  accessDeniedIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  accessDeniedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  accessDeniedButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
