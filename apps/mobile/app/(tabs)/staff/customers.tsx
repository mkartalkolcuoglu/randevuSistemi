import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Platform,
  Linking,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../src/services/api';
import { Customer } from '../../../src/types';

// Status configuration
const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  all: { bg: '#F3F4F6', text: '#374151', label: 'Tümü', icon: 'people' },
  active: { bg: '#D1FAE5', text: '#059669', label: 'Aktif', icon: 'checkmark-circle' },
  vip: { bg: '#FEF3C7', text: '#D97706', label: 'VIP', icon: 'star' },
  inactive: { bg: '#FEE2E2', text: '#DC2626', label: 'Pasif', icon: 'pause-circle' },
};

const FILTER_TABS = ['all', 'active', 'vip', 'inactive'];

export default function StaffCustomersScreen() {
  const router = useRouter();

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New customer form state
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    notes: '',
  });

  // Fetch customers
  const fetchCustomers = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await api.get('/api/mobile/customers');
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, [])
  );

  // Filter and search customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Apply status filter
    if (activeFilter !== 'all') {
      result = result.filter((c) => c.status === activeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((customer) => {
        const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
        return (
          fullName.includes(query) ||
          customer.phone.includes(query) ||
          customer.email?.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [customers, activeFilter, searchQuery]);

  // Get customer counts by status
  const statusCounts = useMemo(() => {
    return {
      all: customers.length,
      active: customers.filter((c) => c.status === 'active').length,
      vip: customers.filter((c) => c.status === 'vip').length,
      inactive: customers.filter((c) => c.status === 'inactive').length,
    };
  }, [customers]);

  // Handle call
  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  // Handle WhatsApp
  const handleWhatsApp = (phone: string) => {
    const formattedPhone = phone.replace(/\D/g, '');
    Linking.openURL(`whatsapp://send?phone=90${formattedPhone}`);
  };

  // Handle add customer
  const handleAddCustomer = async () => {
    if (!newCustomer.firstName.trim() || !newCustomer.lastName.trim() || !newCustomer.phone.trim()) {
      Alert.alert('Hata', 'Ad, soyad ve telefon zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/mobile/customers', newCustomer);
      if (response.data.success) {
        Alert.alert('Başarılı', 'Müşteri eklendi');
        setShowAddModal(false);
        setNewCustomer({ firstName: '', lastName: '', phone: '', email: '', notes: '' });
        fetchCustomers();
      } else {
        Alert.alert('Hata', response.data.message || 'Müşteri eklenemedi');
      }
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render filter tabs
  const renderFilterTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterTabsContent}
    >
      {FILTER_TABS.map((filter) => {
        const config = STATUS_CONFIG[filter];
        const count = statusCounts[filter as keyof typeof statusCounts] || 0;
        const isActive = activeFilter === filter;

        return (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              isActive && { backgroundColor: config.bg, borderColor: config.text },
            ]}
            onPress={() => setActiveFilter(filter)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={config.icon as any}
              size={16}
              color={isActive ? config.text : '#9CA3AF'}
            />
            <Text
              style={[
                styles.filterTabText,
                isActive && { color: config.text, fontWeight: '600' },
              ]}
            >
              {config.label}
            </Text>
            <View
              style={[
                styles.filterTabBadge,
                isActive && { backgroundColor: config.text },
              ]}
            >
              <Text
                style={[
                  styles.filterTabBadgeText,
                  isActive && { color: '#fff' },
                ]}
              >
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // Render customer card
  const renderCustomer = ({ item }: { item: Customer }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;
    const initials = `${item.firstName?.charAt(0) || ''}${item.lastName?.charAt(0) || ''}`;

    return (
      <TouchableOpacity
        style={styles.customerCard}
        onPress={() => {
          setSelectedCustomer(item);
          setShowDetailModal(true);
        }}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={[styles.avatar, item.status === 'vip' && styles.avatarVip]}>
          {item.status === 'vip' && (
            <View style={styles.vipBadge}>
              <Ionicons name="star" size={10} color="#D97706" />
            </View>
          )}
          <Text style={[styles.avatarText, item.status === 'vip' && styles.avatarTextVip]}>
            {initials.toUpperCase()}
          </Text>
        </View>

        {/* Customer Info */}
        <View style={styles.customerInfo}>
          <View style={styles.customerHeader}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.firstName} {item.lastName}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.text }]}>
                {status.label}
              </Text>
            </View>
          </View>

          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={14} color="#6B7280" />
            <Text style={styles.contactText}>{item.phone}</Text>
          </View>

          {item.email && (
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={14} color="#6B7280" />
              <Text style={styles.contactText} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          )}

          {/* Warning badges */}
          <View style={styles.badgesRow}>
            {item.isBlacklisted && (
              <View style={styles.warningBadge}>
                <Ionicons name="warning" size={12} color="#DC2626" />
                <Text style={styles.warningText}>Kara liste</Text>
              </View>
            )}
            {item.noShowCount > 0 && (
              <View style={styles.noShowBadge}>
                <Ionicons name="close-circle-outline" size={12} color="#F59E0B" />
                <Text style={styles.noShowText}>{item.noShowCount}x gelmedi</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={(e) => {
              e.stopPropagation();
              handleCall(item.phone);
            }}
          >
            <Ionicons name="call" size={18} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={(e) => {
              e.stopPropagation();
              handleWhatsApp(item.phone);
            }}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <Ionicons name="people-outline" size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery
          ? 'Müşteri bulunamadı'
          : activeFilter !== 'all'
          ? `${STATUS_CONFIG[activeFilter].label} müşteri yok`
          : 'Henüz müşteri yok'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Farklı bir arama terimi deneyin'
          : 'Yeni müşteri eklemek için + butonuna basın'}
      </Text>
    </View>
  );

  // Render detail modal
  const renderDetailModal = () => {
    if (!selectedCustomer) return null;
    const status = STATUS_CONFIG[selectedCustomer.status] || STATUS_CONFIG.active;

    return (
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Müşteri Detayı</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetailModal(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Profile section */}
              <View style={styles.profileSection}>
                <View style={[styles.largeAvatar, selectedCustomer.status === 'vip' && styles.largeAvatarVip]}>
                  <Text style={styles.largeAvatarText}>
                    {`${selectedCustomer.firstName?.charAt(0) || ''}${selectedCustomer.lastName?.charAt(0) || ''}`.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.profileName}>
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </Text>
                <View style={[styles.profileStatusBadge, { backgroundColor: status.bg }]}>
                  <Ionicons name={status.icon as any} size={14} color={status.text} />
                  <Text style={[styles.profileStatusText, { color: status.text }]}>
                    {status.label}
                  </Text>
                </View>
              </View>

              {/* Contact actions */}
              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={styles.contactAction}
                  onPress={() => handleCall(selectedCustomer.phone)}
                >
                  <View style={[styles.contactActionIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="call" size={22} color="#3B82F6" />
                  </View>
                  <Text style={styles.contactActionLabel}>Ara</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactAction}
                  onPress={() => handleWhatsApp(selectedCustomer.phone)}
                >
                  <View style={[styles.contactActionIcon, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                  </View>
                  <Text style={styles.contactActionLabel}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactAction}
                  onPress={() => {
                    if (selectedCustomer.email) {
                      Linking.openURL(`mailto:${selectedCustomer.email}`);
                    }
                  }}
                >
                  <View style={[styles.contactActionIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="mail" size={22} color="#D97706" />
                  </View>
                  <Text style={styles.contactActionLabel}>E-posta</Text>
                </TouchableOpacity>
              </View>

              {/* Info sections */}
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrapper}>
                    <Ionicons name="call" size={18} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>Telefon</Text>
                    <Text style={styles.infoValue}>{selectedCustomer.phone}</Text>
                  </View>
                </View>
              </View>

              {selectedCustomer.email && (
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconWrapper}>
                      <Ionicons name="mail" size={18} color="#3B82F6" />
                    </View>
                    <View>
                      <Text style={styles.infoLabel}>E-posta</Text>
                      <Text style={styles.infoValue}>{selectedCustomer.email}</Text>
                    </View>
                  </View>
                </View>
              )}

              {selectedCustomer.birthDate && (
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconWrapper}>
                      <Ionicons name="gift" size={18} color="#3B82F6" />
                    </View>
                    <View>
                      <Text style={styles.infoLabel}>Doğum Tarihi</Text>
                      <Text style={styles.infoValue}>
                        {new Date(selectedCustomer.birthDate).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {selectedCustomer.address && (
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconWrapper}>
                      <Ionicons name="location" size={18} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.infoLabel}>Adres</Text>
                      <Text style={styles.infoValue}>{selectedCustomer.address}</Text>
                    </View>
                  </View>
                </View>
              )}

              {selectedCustomer.notes && (
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconWrapper}>
                      <Ionicons name="document-text" size={18} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.infoLabel}>Notlar</Text>
                      <Text style={styles.infoValue}>{selectedCustomer.notes}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Stats */}
              <View style={styles.statsSection}>
                <Text style={styles.statsTitle}>İstatistikler</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{selectedCustomer.noShowCount || 0}</Text>
                    <Text style={styles.statLabel}>Gelmedi</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {new Date(selectedCustomer.createdAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.statLabel}>Kayıt Tarihi</Text>
                  </View>
                </View>
              </View>

              {/* Warnings */}
              {selectedCustomer.isBlacklisted && (
                <View style={styles.warningSection}>
                  <Ionicons name="warning" size={20} color="#DC2626" />
                  <View style={styles.warningContent}>
                    <Text style={styles.warningSectionTitle}>Kara Listede</Text>
                    <Text style={styles.warningSectionText}>
                      Bu müşteri kara listede bulunuyor
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.newAppointmentBtn}
                onPress={() => {
                  setShowDetailModal(false);
                  // Navigate to new appointment with customer pre-selected
                  Alert.alert('Randevu Oluştur', 'Bu özellik yakında eklenecek');
                }}
              >
                <Ionicons name="calendar" size={20} color="#fff" />
                <Text style={styles.newAppointmentBtnText}>Randevu Oluştur</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render add customer modal
  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAddModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.addModalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Yeni Müşteri</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowAddModal(false);
                setNewCustomer({ firstName: '', lastName: '', phone: '', email: '', notes: '' });
              }}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Form */}
            <View style={styles.formSection}>
              <View style={styles.formRow}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Ad *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Müşteri adı"
                    placeholderTextColor="#9CA3AF"
                    value={newCustomer.firstName}
                    onChangeText={(text) =>
                      setNewCustomer((prev) => ({ ...prev, firstName: text }))
                    }
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Soyad *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Müşteri soyadı"
                    placeholderTextColor="#9CA3AF"
                    value={newCustomer.lastName}
                    onChangeText={(text) =>
                      setNewCustomer((prev) => ({ ...prev, lastName: text }))
                    }
                  />
                </View>
              </View>

              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>Telefon *</Text>
                <View style={styles.phoneInputWrapper}>
                  <Text style={styles.phonePrefix}>+90</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="5XX XXX XX XX"
                    placeholderTextColor="#9CA3AF"
                    value={newCustomer.phone}
                    onChangeText={(text) =>
                      setNewCustomer((prev) => ({ ...prev, phone: text }))
                    }
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>E-posta</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="ornek@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={newCustomer.email}
                  onChangeText={(text) =>
                    setNewCustomer((prev) => ({ ...prev, email: text }))
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>Notlar</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea]}
                  placeholder="Müşteri hakkında notlar..."
                  placeholderTextColor="#9CA3AF"
                  value={newCustomer.notes}
                  onChangeText={(text) =>
                    setNewCustomer((prev) => ({ ...prev, notes: text }))
                  }
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </ScrollView>

          {/* Submit button */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleAddCustomer}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>Müşteri Ekle</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Müşteriler</Text>
            <Text style={styles.subtitle}>{customers.length} müşteri kayıtlı</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="İsim, telefon veya e-posta ara..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterTabs}>{renderFilterTabs()}</View>

      {/* Customer list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Müşteriler yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomer}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchCustomers(true)}
              tintColor="#3B82F6"
              colors={['#3B82F6']}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="person-add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Modals */}
      {renderDetailModal()}
      {renderAddModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 2,
  },
  searchContainer: {
    marginTop: 4,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },

  // Filter tabs
  filterTabs: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  filterTabText: {
    fontSize: 13,
    color: '#6B7280',
  },
  filterTabBadge: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  filterTabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Customer card
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarVip: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#D97706',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  avatarTextVip: {
    color: '#D97706',
  },
  vipBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  contactText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  warningText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '500',
  },
  noShowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  noShowText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 8,
  },
  quickActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  // Detail modal
  detailModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  largeAvatarVip: {
    backgroundColor: '#FEF3C7',
    borderWidth: 3,
    borderColor: '#D97706',
  },
  largeAvatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  profileStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  profileStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactAction: {
    alignItems: 'center',
    gap: 8,
  },
  contactActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactActionLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  warningSectionText: {
    fontSize: 13,
    color: '#B91C1C',
    marginTop: 2,
  },
  modalActions: {
    padding: 20,
    paddingTop: 12,
  },
  newAppointmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  newAppointmentBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Add modal
  addModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  formSection: {
    padding: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroup: {
    flex: 1,
    marginBottom: 16,
  },
  formGroupFull: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
  },
  formTextarea: {
    minHeight: 100,
    paddingTop: 14,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    overflow: 'hidden',
  },
  phonePrefix: {
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
