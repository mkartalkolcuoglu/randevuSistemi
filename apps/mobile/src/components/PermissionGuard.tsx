import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/auth.store';
import { canAccessPage, StaffPermissions } from '../types';

interface PermissionGuardProps {
  children: React.ReactNode;
  permissionKey: keyof StaffPermissions;
  pageName: string;
}

export default function PermissionGuard({ children, permissionKey, pageName }: PermissionGuardProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  const isOwner = user?.userType === 'owner';
  const permissions = user?.permissions as StaffPermissions | null | undefined;

  if (isOwner) {
    return <>{children}</>;
  }

  if (!canAccessPage(permissions, permissionKey)) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed-outline" size={36} color="#9CA3AF" />
          </View>
          <Text style={styles.title}>Erişim Yetkisi Yok</Text>
          <Text style={styles.subtitle}>
            <Text style={styles.pageName}>{pageName}</Text> sayfasını görüntüleme yetkiniz bulunmamaktadır.
          </Text>
          <Text style={styles.hint}>Yetki için işletme sahibinize başvurun.</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/(tabs)/staff')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
            <Text style={styles.buttonText}>Ana Sayfaya Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  pageName: {
    fontWeight: '600',
    color: '#374151',
  },
  hint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#163974',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
