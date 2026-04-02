import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/auth.store';
import { canAccessPage, StaffPermissions } from '../types';

const PAGE_MAP: { key: keyof StaffPermissions; label: string; route: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'dashboard', label: 'Ana Sayfa', route: '/(tabs)/staff', icon: 'home-outline' },
  { key: 'appointments', label: 'Randevular', route: '/(tabs)/staff/calendar', icon: 'calendar-outline' },
  { key: 'customers', label: 'Müşteriler', route: '/(tabs)/staff/customers', icon: 'people-outline' },
  { key: 'services', label: 'Hizmetler', route: '/(tabs)/staff/services', icon: 'cut-outline' },
  { key: 'staff', label: 'Personel', route: '/(tabs)/staff/team', icon: 'person-outline' },
  { key: 'packages', label: 'Paketler', route: '/(tabs)/staff/packages', icon: 'gift-outline' },
  { key: 'kasa', label: 'Kasa', route: '/(tabs)/staff/cashier', icon: 'wallet-outline' },
  { key: 'stock', label: 'Stok', route: '/(tabs)/staff/stock', icon: 'cube-outline' },
  { key: 'reports', label: 'Raporlar', route: '/(tabs)/staff/reports', icon: 'bar-chart-outline' },
  { key: 'settings', label: 'Ayarlar', route: '/(tabs)/staff/business-settings', icon: 'settings-outline' },
];

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
    const allowedPages = PAGE_MAP.filter(
      (p) => p.key !== permissionKey && canAccessPage(permissions, p.key)
    );

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

          {allowedPages.length > 0 && (
            <View style={styles.allowedSection}>
              <Text style={styles.allowedTitle}>Erişebileceğiniz sayfalar:</Text>
              <View style={styles.allowedGrid}>
                {allowedPages.map((page) => (
                  <TouchableOpacity
                    key={page.key}
                    style={styles.allowedButton}
                    onPress={() => router.replace(page.route as any)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={page.icon} size={20} color="#163974" />
                    <Text style={styles.allowedButtonText}>{page.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
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
    paddingHorizontal: 32,
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
  allowedSection: {
    width: '100%',
    alignItems: 'center',
  },
  allowedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  allowedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  allowedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  allowedButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#163974',
  },
});
