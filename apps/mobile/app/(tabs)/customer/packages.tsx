import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../src/services/api';

interface PackageItem {
  id: string;
  serviceId: string;
  serviceName: string;
  totalQuantity: number;
  usedQuantity: number;
  remainingQuantity: number;
}

interface CustomerPackage {
  id: string;
  packageId: string;
  packageName: string;
  packageDescription: string | null;
  tenant: {
    id: string;
    businessName: string;
    slug: string;
    logo: string | null;
  };
  assignedAt: string;
  expiresAt: string | null;
  status: string;
  items: PackageItem[];
}

export default function CustomerPackagesScreen() {
  const [packages, setPackages] = useState<CustomerPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPackages = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await api.get('/api/mobile/customer/all-packages');
      if (response.data.success) {
        setPackages(response.data.data.packages || []);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPackages();
    }, [])
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderPackageItem = ({ item }: { item: PackageItem }) => (
    <View style={styles.serviceItem}>
      <View style={styles.serviceInfo}>
        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
        <Text style={styles.serviceName}>{item.serviceName}</Text>
      </View>
      <View style={styles.quantityContainer}>
        <Text style={styles.remainingText}>{item.remainingQuantity}</Text>
        <Text style={styles.totalText}>/ {item.totalQuantity}</Text>
      </View>
    </View>
  );

  const renderPackage = ({ item }: { item: CustomerPackage }) => {
    const isExpiringSoon = item.expiresAt &&
      new Date(item.expiresAt).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

    return (
      <View style={styles.packageCard}>
        {/* Header with tenant info */}
        <View style={styles.cardHeader}>
          <View style={[styles.tenantLogo, { backgroundColor: '#3B82F6' }]}>
            <Text style={styles.tenantInitial}>
              {item.tenant?.businessName?.charAt(0) || 'S'}
            </Text>
          </View>
          <View style={styles.tenantInfo}>
            <Text style={styles.tenantName}>{item.tenant?.businessName}</Text>
            <Text style={styles.tenantSlug}>@{item.tenant?.slug}</Text>
          </View>
        </View>

        {/* Package name and description */}
        <View style={styles.packageInfo}>
          <Text style={styles.packageName}>{item.packageName}</Text>
          {item.packageDescription && (
            <Text style={styles.packageDescription}>{item.packageDescription}</Text>
          )}
        </View>

        {/* Expiry warning */}
        {isExpiringSoon && item.expiresAt && (
          <View style={styles.expiryWarning}>
            <Ionicons name="warning" size={16} color="#F59E0B" />
            <Text style={styles.expiryWarningText}>
              Son kullanma: {formatDate(item.expiresAt)}
            </Text>
          </View>
        )}

        {/* Services list */}
        <View style={styles.servicesList}>
          <Text style={styles.servicesTitle}>Kalan Haklar</Text>
          {item.items.map((service) => (
            <View key={service.id} style={styles.serviceItem}>
              <View style={styles.serviceInfo}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.serviceName}>{service.serviceName}</Text>
              </View>
              <View style={styles.quantityContainer}>
                <Text style={styles.remainingText}>{service.remainingQuantity}</Text>
                <Text style={styles.totalText}>/ {service.totalQuantity}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer with date */}
        <View style={styles.cardFooter}>
          <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
          <Text style={styles.assignedDate}>
            Alım tarihi: {formatDate(item.assignedAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="gift-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Paketiniz bulunmuyor</Text>
      <Text style={styles.emptySubtitle}>
        Satın aldığınız paketler burada görünecek
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Paketlerim</Text>
        <Text style={styles.subtitle}>Tüm salonlardan aldığınız paketler</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={packages}
          renderItem={renderPackage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchPackages(true)}
              tintColor="#3B82F6"
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tenantLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenantInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  tenantInfo: {
    marginLeft: 12,
    flex: 1,
  },
  tenantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  tenantSlug: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 1,
  },
  packageInfo: {
    marginBottom: 12,
  },
  packageName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  packageDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  expiryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  expiryWarningText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#D97706',
    marginLeft: 8,
  },
  servicesList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  servicesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    color: '#1F2937',
    marginLeft: 10,
    flex: 1,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  remainingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  totalText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  assignedDate: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
