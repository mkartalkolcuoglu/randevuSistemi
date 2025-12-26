import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { Tenant } from '../../src/types';

export default function SelectTenantScreen() {
  const router = useRouter();
  const { availableTenants, selectTenant, isLoading, logout } = useAuthStore();

  const handleSelectTenant = async (tenant: Tenant) => {
    const success = await selectTenant(tenant);
    if (success) {
      router.replace('/');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const renderTenant = ({ item }: { item: Tenant }) => (
    <TouchableOpacity
      style={styles.tenantCard}
      onPress={() => handleSelectTenant(item)}
      disabled={isLoading}
    >
      <View style={styles.tenantLogo}>
        {item.logo ? (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoInitial}>
              {item.businessName.charAt(0)}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.logoPlaceholder,
              { backgroundColor: item.primaryColor || '#3B82F6' },
            ]}
          >
            <Text style={styles.logoInitial}>
              {item.businessName.charAt(0)}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.tenantInfo}>
        <Text style={styles.tenantName}>{item.businessName}</Text>
        <Text style={styles.tenantSlug}>@{item.slug}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Salon Seçin</Text>
        <Text style={styles.subtitle}>
          Birden fazla salonda kayıtlısınız. Devam etmek için bir salon seçin.
        </Text>
      </View>

      <FlatList
        data={availableTenants}
        renderItem={renderTenant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Farklı Numara ile Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  list: {
    padding: 24,
    paddingTop: 0,
  },
  tenantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
  },
  tenantLogo: {
    marginRight: 16,
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  tenantSlug: {
    fontSize: 14,
    color: '#6B7280',
  },
  chevron: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  separator: {
    height: 12,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
});
