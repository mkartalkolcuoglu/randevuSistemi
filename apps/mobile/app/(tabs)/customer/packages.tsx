import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
      month: 'long',
      year: 'numeric',
    });
  };

  const getTotalRemaining = () => {
    return packages.reduce((total, pkg) => {
      return total + pkg.items.reduce((sum, item) => sum + item.remainingQuantity, 0);
    }, 0);
  };

  const getProgressPercentage = (used: number, total: number) => {
    if (total === 0) return 0;
    return ((total - used) / total) * 100;
  };

  const renderPackage = ({ item }: { item: CustomerPackage }) => {
    const isExpiringSoon = item.expiresAt &&
      new Date(item.expiresAt).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
    const isExpired = item.expiresAt && new Date(item.expiresAt).getTime() < Date.now();

    const totalQuantity = item.items.reduce((sum, i) => sum + i.totalQuantity, 0);
    const remainingQuantity = item.items.reduce((sum, i) => sum + i.remainingQuantity, 0);

    return (
      <View style={[styles.packageCard, isExpired && styles.packageCardExpired]}>
        {/* Status Badge */}
        {isExpired ? (
          <View style={styles.expiredBadge}>
            <Ionicons name="close-circle" size={14} color="#fff" />
            <Text style={styles.expiredBadgeText}>Süresi Doldu</Text>
          </View>
        ) : isExpiringSoon && item.expiresAt ? (
          <View style={styles.expiringSoonBadge}>
            <Ionicons name="warning" size={14} color="#D97706" />
            <Text style={styles.expiringSoonBadgeText}>Süresi yaklaşıyor</Text>
          </View>
        ) : (
          <View style={styles.activeBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#059669" />
            <Text style={styles.activeBadgeText}>Aktif</Text>
          </View>
        )}

        {/* Header with tenant info */}
        <View style={styles.cardHeader}>
          <View style={styles.tenantLogo}>
            <Ionicons name="storefront" size={20} color="#059669" />
          </View>
          <View style={styles.tenantInfo}>
            <Text style={styles.tenantName}>{item.tenant?.businessName}</Text>
            <Text style={styles.packageName}>{item.packageName}</Text>
          </View>
          <View style={styles.remainingBadge}>
            <Text style={styles.remainingBadgeValue}>{remainingQuantity}</Text>
            <Text style={styles.remainingBadgeLabel}>Kalan</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${getProgressPercentage(totalQuantity - remainingQuantity, totalQuantity)}%` },
                isExpired && styles.progressFillExpired
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {remainingQuantity} / {totalQuantity} seans kaldı
          </Text>
        </View>

        {/* Services list */}
        <View style={styles.servicesList}>
          <Text style={styles.servicesTitle}>Hizmetler</Text>
          {item.items.map((service, index) => (
            <View
              key={service.id}
              style={[
                styles.serviceItem,
                index === item.items.length - 1 && styles.serviceItemLast
              ]}
            >
              <View style={styles.serviceIconContainer}>
                <Ionicons name="cut" size={16} color="#059669" />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.serviceName}</Text>
                <View style={styles.serviceProgressBar}>
                  <View
                    style={[
                      styles.serviceProgressFill,
                      { width: `${getProgressPercentage(service.usedQuantity, service.totalQuantity)}%` }
                    ]}
                  />
                </View>
              </View>
              <View style={styles.quantityContainer}>
                <Text style={styles.remainingText}>{service.remainingQuantity}</Text>
                <Text style={styles.totalText}>/{service.totalQuantity}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.footerText}>Alım: {formatDate(item.assignedAt)}</Text>
          </View>
          {item.expiresAt && (
            <View style={styles.footerItem}>
              <Ionicons name="time-outline" size={14} color={isExpiringSoon || isExpired ? '#EF4444' : '#6B7280'} />
              <Text style={[styles.footerText, (isExpiringSoon || isExpired) && styles.footerTextWarning]}>
                Son: {formatDate(item.expiresAt)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="gift-outline" size={48} color="#059669" />
      </View>
      <Text style={styles.emptyTitle}>Henüz paketiniz yok</Text>
      <Text style={styles.emptySubtitle}>
        İşletmelerden satın aldığınız paketler burada görünecek
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#059669', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Paketlerim</Text>
            <Text style={styles.headerSubtitle}>Tüm işletmelerden aldığınız paketler</Text>
          </View>
          {packages.length > 0 && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeValue}>{getTotalRemaining()}</Text>
              <Text style={styles.totalBadgeLabel}>Toplam Seans</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Summary Cards */}
      {packages.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="cube" size={20} color="#059669" />
            </View>
            <Text style={styles.summaryValue}>{packages.length}</Text>
            <Text style={styles.summaryLabel}>Paket</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="storefront" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.summaryValue}>
              {new Set(packages.map(p => p.tenant?.id)).size}
            </Text>
            <Text style={styles.summaryLabel}>İşletme</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.summaryValue}>{getTotalRemaining()}</Text>
            <Text style={styles.summaryLabel}>Kalan Seans</Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Paketler yükleniyor...</Text>
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
              tintColor="#059669"
              colors={['#059669']}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  totalBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  totalBadgeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  totalBadgeLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginTop: 2,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  packageCardExpired: {
    opacity: 0.7,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 14,
    gap: 4,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  expiringSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 14,
    gap: 4,
  },
  expiringSoonBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 14,
    gap: 4,
  },
  expiredBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tenantLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenantInfo: {
    marginLeft: 14,
    flex: 1,
  },
  tenantName: {
    fontSize: 13,
    color: '#6B7280',
  },
  packageName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  remainingBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
  },
  remainingBadgeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  remainingBadgeLabel: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  progressFillExpired: {
    backgroundColor: '#9CA3AF',
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'right',
  },
  servicesList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  servicesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  serviceItemLast: {
    borderBottomWidth: 0,
  },
  serviceIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  serviceProgressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  serviceProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 12,
  },
  remainingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  totalText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
  },
  footerTextWarning: {
    color: '#EF4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
