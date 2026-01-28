import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://admin.netrandevu.com';

interface TenantSearchResult {
  id: string;
  businessName: string;
  slug: string;
  logo?: string;
  phone?: string;
  address?: string;
}

export default function GuestExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TenantSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchTenants();
      } else {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const searchTenants = async () => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/mobile/tenants/search?search=${encodeURIComponent(searchQuery)}&public=true`
      );
      const data = await response.json();
      setSearchResults(data.data || []);
    } catch (error) {
      console.error('Error searching tenants:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTenant = (tenant: TenantSearchResult) => {
    router.push(`/(guest)/business/${tenant.id}`);
  };

  const renderTenantItem = ({ item }: { item: TenantSearchResult }) => (
    <TouchableOpacity
      style={styles.tenantCard}
      onPress={() => handleSelectTenant(item)}
      activeOpacity={0.7}
    >
      <View style={styles.tenantIconContainer}>
        <Ionicons name="business" size={28} color="#059669" />
      </View>
      <View style={styles.tenantInfo}>
        <Text style={styles.tenantName}>{item.businessName}</Text>
        {item.address && (
          <View style={styles.tenantMeta}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.tenantAddress} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        )}
        {item.phone && (
          <View style={styles.tenantMeta}>
            <Ionicons name="call-outline" size={14} color="#6B7280" />
            <Text style={styles.tenantPhone}>{item.phone}</Text>
          </View>
        )}
      </View>
      <View style={styles.tenantArrow}>
        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.emptyText}>Aranıyor...</Text>
        </View>
      );
    }

    if (!hasSearched) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="search-outline" size={48} color="#059669" />
          </View>
          <Text style={styles.emptyTitle}>Salonları Keşfedin</Text>
          <Text style={styles.emptyText}>
            Randevu almak istediğiniz salonu aramak için{'\n'}en az 2 karakter girin
          </Text>
        </View>
      );
    }

    if (searchResults.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="business-outline" size={48} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>Sonuç Bulunamadı</Text>
          <Text style={styles.emptyText}>
            "{searchQuery}" ile eşleşen salon bulunamadı.{'\n'}
            Farklı bir arama terimi deneyin.
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Hero Section */}
      <LinearGradient
        colors={['#059669', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroSection}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="calendar" size={32} color="#059669" />
          </View>
          <Text style={styles.heroTitle}>Net Randevu</Text>
          <Text style={styles.heroSubtitle}>
            Giriş yapmadan salonları keşfedin
          </Text>
        </View>
      </LinearGradient>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Salon adı yazın..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setHasSearched(false);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results Section */}
      {searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderTenantItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color="#3B82F6" />
        <Text style={styles.infoBannerText}>
          Randevu almak için giriş yapmanız gerekecektir
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  heroSection: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  searchSection: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  tenantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tenantIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  tenantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  tenantAddress: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  tenantPhone: {
    fontSize: 13,
    color: '#6B7280',
  },
  tenantArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#BFDBFE',
    gap: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '500',
  },
});
