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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../../src/services/api';
import { Customer } from '../../../src/types';
import DrawerMenu from '../../../src/components/DrawerMenu';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// HIG/Material Design compliant header values
const IS_IOS = Platform.OS === 'ios';
const HEADER_BTN_SIZE = IS_IOS ? 44 : 48; // iOS HIG: 44pt min, Android: 48dp min
const HEADER_BTN_RADIUS = IS_IOS ? 20 : 24; // Circular buttons

// Status configuration with gradients
const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: string; gradient: [string, string] }> = {
  all: { bg: '#F3F4F6', text: '#374151', label: 'Tümü', icon: 'people', gradient: ['#6B7280', '#4B5563'] },
  active: { bg: '#D1FAE5', text: '#059669', label: 'Aktif', icon: 'checkmark-circle', gradient: ['#10B981', '#059669'] },
  vip: { bg: '#FEF3C7', text: '#D97706', label: 'VIP', icon: 'star', gradient: ['#F59E0B', '#D97706'] },
  inactive: { bg: '#FEE2E2', text: '#DC2626', label: 'Pasif', icon: 'pause-circle', gradient: ['#EF4444', '#DC2626'] },
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
  const [showSearch, setShowSearch] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // New customer form state - matching web panel fields
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    birthDate: '',
    gender: '',
    address: '',
    notes: '',
    status: 'active',
    whatsappNotifications: true,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editCustomer, setEditCustomer] = useState<typeof newCustomer | null>(null);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Reset form helper
  const resetNewCustomerForm = () => {
    setNewCustomer({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      birthDate: '',
      gender: '',
      address: '',
      notes: '',
      status: 'active',
      whatsappNotifications: true,
    });
  };

  // Start edit mode
  const startEditMode = () => {
    if (!selectedCustomer) return;
    setEditCustomer({
      firstName: selectedCustomer.firstName || '',
      lastName: selectedCustomer.lastName || '',
      phone: selectedCustomer.phone || '',
      email: selectedCustomer.email || '',
      birthDate: selectedCustomer.birthDate ? selectedCustomer.birthDate.split('T')[0] : '',
      gender: selectedCustomer.gender || '',
      address: selectedCustomer.address || '',
      notes: selectedCustomer.notes || '',
      status: selectedCustomer.status || 'active',
      whatsappNotifications: true,
    });
    setIsEditMode(true);
  };

  // Handle update customer
  const handleUpdateCustomer = async () => {
    if (!selectedCustomer || !editCustomer) return;
    if (!editCustomer.firstName.trim() || !editCustomer.lastName.trim() || !editCustomer.phone.trim()) {
      Alert.alert('Hata', 'Ad, soyad ve telefon zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      const customerData: Record<string, any> = {
        firstName: editCustomer.firstName.trim(),
        lastName: editCustomer.lastName.trim(),
        phone: editCustomer.phone.trim(),
      };

      if (editCustomer.email?.trim()) {
        customerData.email = editCustomer.email.trim();
      }
      if (editCustomer.birthDate) {
        customerData.birthDate = editCustomer.birthDate;
      }
      if (editCustomer.gender) {
        customerData.gender = editCustomer.gender;
      }
      if (editCustomer.address?.trim()) {
        customerData.address = editCustomer.address.trim();
      }
      if (editCustomer.notes?.trim()) {
        customerData.notes = editCustomer.notes.trim();
      }
      customerData.status = editCustomer.status;

      const response = await api.put(`/api/mobile/customers/${selectedCustomer.id}`, customerData);
      if (response.data.success) {
        Alert.alert('Başarılı', 'Müşteri güncellendi');
        setIsEditMode(false);
        setShowDetailModal(false);
        fetchCustomers();
      } else {
        Alert.alert('Hata', response.data.message || 'Müşteri güncellenemedi');
      }
    } catch (error: any) {
      console.error('Update customer error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete customer - can be called from list or detail
  const handleDeleteCustomer = (customer?: Customer) => {
    const customerToDelete = customer || selectedCustomer;
    if (!customerToDelete) return;

    Alert.alert(
      'Müşteriyi Sil',
      `${customerToDelete.firstName} ${customerToDelete.lastName} adlı müşteriyi silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const response = await api.delete(`/api/mobile/customers/${customerToDelete.id}`);
              if (response.data.success) {
                Alert.alert('Başarılı', 'Müşteri silindi');
                setShowDetailModal(false);
                fetchCustomers();
              } else {
                Alert.alert('Hata', response.data.message || 'Müşteri silinemedi');
              }
            } catch (error: any) {
              console.error('Delete customer error:', error);
              Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Handle add customer
  const handleAddCustomer = async () => {
    if (!newCustomer.firstName.trim() || !newCustomer.lastName.trim() || !newCustomer.phone.trim()) {
      Alert.alert('Hata', 'Ad, soyad ve telefon zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate unique email if not provided (to avoid duplicate email constraint)
      const uniqueEmail = newCustomer.email?.trim()
        ? newCustomer.email.trim()
        : `mobile_${Date.now()}_${Math.random().toString(36).substring(7)}@temp.local`;

      // Prepare data for API
      const customerData: Record<string, any> = {
        firstName: newCustomer.firstName.trim(),
        lastName: newCustomer.lastName.trim(),
        phone: newCustomer.phone.trim(),
        email: uniqueEmail,
      };

      // Only add optional fields if they have values
      if (newCustomer.birthDate) {
        customerData.birthDate = newCustomer.birthDate;
      }
      if (newCustomer.gender) {
        customerData.gender = newCustomer.gender;
      }
      if (newCustomer.address?.trim()) {
        customerData.address = newCustomer.address.trim();
      }
      if (newCustomer.notes?.trim()) {
        customerData.notes = newCustomer.notes.trim();
      }

      console.log('📝 Creating customer with data:', JSON.stringify(customerData, null, 2));
      const response = await api.post('/api/mobile/customers', customerData);
      console.log('✅ Customer creation response:', JSON.stringify(response.data, null, 2));
      if (response.data.success) {
        Alert.alert('Başarılı', 'Müşteri eklendi');
        setShowAddModal(false);
        resetNewCustomerForm();
        fetchCustomers();
      } else {
        Alert.alert('Hata', response.data.message || 'Müşteri eklenemedi');
      }
    } catch (error: any) {
      console.error('❌ Customer creation error:', error);
      console.error('❌ Error response:', JSON.stringify(error.response?.data, null, 2));
      console.error('❌ Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Bir hata oluştu';
      Alert.alert('Hata', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render filter tabs with modern design
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
            style={[styles.filterTab, isActive && styles.filterTabActive]}
            onPress={() => setActiveFilter(filter)}
            activeOpacity={0.7}
          >
            {isActive ? (
              <LinearGradient
                colors={config.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.filterTabGradient}
              >
                <Ionicons name={config.icon as any} size={15} color="#fff" />
                <Text style={styles.filterTabTextActive}>{config.label}</Text>
                <View style={styles.filterTabBadgeActive}>
                  <Text style={styles.filterTabBadgeTextActive}>{count}</Text>
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.filterTabInner}>
                <Ionicons name={config.icon as any} size={15} color="#9CA3AF" />
                <Text style={styles.filterTabText}>{config.label}</Text>
                <View style={styles.filterTabBadge}>
                  <Text style={styles.filterTabBadgeText}>{count}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // Render customer card - Compact & Modern
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
        {/* Left accent bar */}
        <LinearGradient
          colors={status.gradient}
          style={styles.cardAccent}
        />

        <View style={styles.cardContent}>
          {/* Top Row: Avatar + Name + Status */}
          <View style={styles.cardTopRow}>
            {/* Avatar */}
            <View style={[styles.avatar, item.status === 'vip' && styles.avatarVip]}>
              {item.status === 'vip' && (
                <View style={styles.vipBadge}>
                  <Ionicons name="star" size={8} color="#D97706" />
                </View>
              )}
              <Text style={[styles.avatarText, item.status === 'vip' && styles.avatarTextVip]}>
                {initials.toUpperCase()}
              </Text>
            </View>

            {/* Name & Contact */}
            <View style={styles.customerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.customerName} numberOfLines={1}>
                  {item.firstName} {item.lastName}
                </Text>
                {item.isBlacklisted && (
                  <View style={styles.blacklistBadge}>
                    <Ionicons name="warning" size={10} color="#DC2626" />
                  </View>
                )}
              </View>
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={12} color="#9CA3AF" />
                <Text style={styles.contactText}>{item.phone}</Text>
                {item.noShowCount > 0 && (
                  <View style={styles.noShowBadge}>
                    <Text style={styles.noShowText}>{item.noShowCount}x</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Ionicons name={status.icon as any} size={12} color={status.text} />
            </View>
          </View>

          {/* Bottom Row: Quick Actions */}
          <View style={styles.cardBottomRow}>
            {item.email && !item.email.includes('@placeholder') && !item.email.includes('@temp.local') && (
              <View style={styles.emailRow}>
                <Ionicons name="mail-outline" size={12} color="#9CA3AF" />
                <Text style={styles.emailText} numberOfLines={1}>{item.email}</Text>
              </View>
            )}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  handleCall(item.phone);
                }}
              >
                <Ionicons name="call" size={16} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionBtn, styles.whatsappBtn]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleWhatsApp(item.phone);
                }}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionBtn, styles.deleteCardBtn]}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedCustomer(item);
                  handleDeleteCustomer(item);
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
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

  // Close detail modal and reset edit mode
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setIsEditMode(false);
    setEditCustomer(null);
  };

  // Render detail modal with premium design
  const renderDetailModal = () => {
    if (!selectedCustomer) return null;
    const status = STATUS_CONFIG[selectedCustomer.status] || STATUS_CONFIG.active;

    return (
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={closeDetailModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.detailModalContent}>
            {/* Premium Gradient Header */}
            <LinearGradient
              colors={['#163974', '#0F2A52']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalGradientHeader}
            >
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={closeDetailModal}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>

              {/* Profile Avatar */}
              <View style={[styles.profileAvatarWrapper, selectedCustomer.status === 'vip' && styles.profileAvatarVip]}>
                <Text style={styles.profileAvatarText}>
                  {`${selectedCustomer.firstName?.charAt(0) || ''}${selectedCustomer.lastName?.charAt(0) || ''}`.toUpperCase()}
                </Text>
                {selectedCustomer.status === 'vip' && (
                  <View style={styles.profileVipBadge}>
                    <Ionicons name="star" size={12} color="#D97706" />
                  </View>
                )}
              </View>

              <Text style={styles.profileName}>
                {selectedCustomer.firstName} {selectedCustomer.lastName}
              </Text>
              <View style={[styles.profileStatusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name={status.icon as any} size={14} color="#fff" />
                <Text style={styles.profileStatusText}>{status.label}</Text>
              </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollContent}>
              {isEditMode && editCustomer ? (
                // Edit Mode - Show edit form
                <>
                  <View style={styles.editFormContainer}>
                    {/* Kişisel Bilgiler */}
                    <View style={styles.formSectionCard}>
                      <Text style={styles.formSectionTitle}>Kişisel Bilgiler</Text>

                      <View style={styles.formRow}>
                        <View style={styles.formGroup}>
                          <Text style={styles.formLabel}>Ad *</Text>
                          <TextInput
                            style={styles.formInputFull}
                            placeholder="Ad"
                            placeholderTextColor="#9CA3AF"
                            value={editCustomer.firstName}
                            onChangeText={(text) =>
                              setEditCustomer((prev) => prev ? { ...prev, firstName: text } : null)
                            }
                          />
                        </View>
                        <View style={styles.formGroup}>
                          <Text style={styles.formLabel}>Soyad *</Text>
                          <TextInput
                            style={styles.formInputFull}
                            placeholder="Soyad"
                            placeholderTextColor="#9CA3AF"
                            value={editCustomer.lastName}
                            onChangeText={(text) =>
                              setEditCustomer((prev) => prev ? { ...prev, lastName: text } : null)
                            }
                          />
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={styles.formGroup}>
                          <Text style={styles.formLabel}>Telefon *</Text>
                          <View style={styles.phoneInputWrapper}>
                            <Text style={styles.phonePrefix}>+90</Text>
                            <TextInput
                              style={styles.phoneInputFull}
                              placeholder="5XX XXX XX XX"
                              placeholderTextColor="#9CA3AF"
                              value={editCustomer.phone}
                              onChangeText={(text) =>
                                setEditCustomer((prev) => prev ? { ...prev, phone: text } : null)
                              }
                              keyboardType="phone-pad"
                            />
                          </View>
                        </View>
                        <View style={styles.formGroup}>
                          <Text style={styles.formLabel}>E-posta</Text>
                          <TextInput
                            style={styles.formInputFull}
                            placeholder="ornek@email.com"
                            placeholderTextColor="#9CA3AF"
                            value={editCustomer.email}
                            onChangeText={(text) =>
                              setEditCustomer((prev) => prev ? { ...prev, email: text } : null)
                            }
                            keyboardType="email-address"
                            autoCapitalize="none"
                          />
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={styles.formGroup}>
                          <Text style={styles.formLabel}>Doğum Tarihi</Text>
                          <TouchableOpacity
                            style={styles.formInputFull}
                            onPress={() => setShowEditDatePicker(true)}
                          >
                            <View style={styles.datePickerBtn}>
                              <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                              <Text style={editCustomer.birthDate ? styles.datePickerText : styles.datePickerPlaceholder}>
                                {editCustomer.birthDate
                                  ? new Date(editCustomer.birthDate).toLocaleDateString('tr-TR')
                                  : 'Tarih seçin'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.formGroup}>
                          <Text style={styles.formLabel}>Cinsiyet</Text>
                          <View style={styles.genderSelector}>
                            {GENDER_OPTIONS.filter(g => g.value).map((gender) => (
                              <TouchableOpacity
                                key={gender.value}
                                style={[
                                  styles.genderOption,
                                  editCustomer.gender === gender.value && styles.genderOptionActive,
                                ]}
                                onPress={() =>
                                  setEditCustomer((prev) => prev ? { ...prev, gender: gender.value } : null)
                                }
                              >
                                <Text
                                  style={[
                                    styles.genderOptionText,
                                    editCustomer.gender === gender.value && styles.genderOptionTextActive,
                                  ]}
                                >
                                  {gender.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>

                      <View style={styles.formGroupFull}>
                        <Text style={styles.formLabel}>Adres</Text>
                        <TextInput
                          style={styles.formInputFull}
                          placeholder="Tam adres"
                          placeholderTextColor="#9CA3AF"
                          value={editCustomer.address}
                          onChangeText={(text) =>
                            setEditCustomer((prev) => prev ? { ...prev, address: text } : null)
                          }
                        />
                      </View>
                    </View>

                    {/* Durum */}
                    <View style={styles.formSectionCard}>
                      <Text style={styles.formSectionTitle}>Müşteri Durumu</Text>
                      <View style={styles.statusSelector}>
                        {STATUS_OPTIONS.map((statusOpt) => (
                          <TouchableOpacity
                            key={statusOpt.value}
                            style={[
                              styles.statusOption,
                              editCustomer.status === statusOpt.value && {
                                backgroundColor: statusOpt.color + '20',
                                borderColor: statusOpt.color,
                              },
                            ]}
                            onPress={() =>
                              setEditCustomer((prev) => prev ? { ...prev, status: statusOpt.value } : null)
                            }
                          >
                            <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: statusOpt.color },
                              ]}
                            />
                            <Text
                              style={[
                                styles.statusOptionText,
                                editCustomer.status === statusOpt.value && { color: statusOpt.color },
                              ]}
                            >
                              {statusOpt.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Notlar */}
                    <View style={styles.formSectionCard}>
                      <Text style={styles.formSectionTitle}>Notlar</Text>
                      <TextInput
                        style={[styles.formInputFull, styles.formTextarea]}
                        placeholder="Müşteri hakkında notlar..."
                        placeholderTextColor="#9CA3AF"
                        value={editCustomer.notes}
                        onChangeText={(text) =>
                          setEditCustomer((prev) => prev ? { ...prev, notes: text } : null)
                        }
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                    </View>
                  </View>

                  {/* DateTimePicker for edit mode */}
                  {showEditDatePicker && (
                    Platform.OS === 'ios' ? (
                      <Modal
                        visible={showEditDatePicker}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setShowEditDatePicker(false)}
                      >
                        <View style={styles.datePickerModalOverlay}>
                          <View style={styles.datePickerModalContent}>
                            <View style={styles.datePickerModalHeader}>
                              <TouchableOpacity onPress={() => setShowEditDatePicker(false)}>
                                <Text style={styles.datePickerCancelText}>İptal</Text>
                              </TouchableOpacity>
                              <Text style={styles.datePickerModalTitle}>Doğum Tarihi</Text>
                              <TouchableOpacity onPress={() => setShowEditDatePicker(false)}>
                                <Text style={styles.datePickerDoneText}>Tamam</Text>
                              </TouchableOpacity>
                            </View>
                            <DateTimePicker
                              value={editCustomer.birthDate ? new Date(editCustomer.birthDate) : new Date(2000, 0, 1)}
                              mode="date"
                              display="spinner"
                              locale="tr-TR"
                              maximumDate={new Date()}
                              minimumDate={new Date(1920, 0, 1)}
                              onChange={(event, selectedDate) => {
                                if (selectedDate) {
                                  setEditCustomer((prev) => prev ? {
                                    ...prev,
                                    birthDate: selectedDate.toISOString().split('T')[0],
                                  } : null);
                                }
                              }}
                              style={styles.datePickerIOS}
                            />
                          </View>
                        </View>
                      </Modal>
                    ) : (
                      <DateTimePicker
                        value={editCustomer.birthDate ? new Date(editCustomer.birthDate) : new Date(2000, 0, 1)}
                        mode="date"
                        display="default"
                        maximumDate={new Date()}
                        minimumDate={new Date(1920, 0, 1)}
                        onChange={(event, selectedDate) => {
                          setShowEditDatePicker(false);
                          if (event.type === 'set' && selectedDate) {
                            setEditCustomer((prev) => prev ? {
                              ...prev,
                              birthDate: selectedDate.toISOString().split('T')[0],
                            } : null);
                          }
                        }}
                      />
                    )
                  )}
                </>
              ) : (
                // View Mode - Show customer details
                <>
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

                  {selectedCustomer.email && !selectedCustomer.email.includes('@placeholder') && !selectedCustomer.email.includes('@temp.local') && (
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

                  {selectedCustomer.gender && (
                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                          <Ionicons name="person" size={18} color="#3B82F6" />
                        </View>
                        <View>
                          <Text style={styles.infoLabel}>Cinsiyet</Text>
                          <Text style={styles.infoValue}>{selectedCustomer.gender}</Text>
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
                </>
              )}
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              {isEditMode ? (
                // Edit mode actions
                <View style={styles.editActionsRow}>
                  <TouchableOpacity
                    style={styles.cancelEditBtn}
                    onPress={() => {
                      setIsEditMode(false);
                      setEditCustomer(null);
                    }}
                  >
                    <Text style={styles.cancelEditBtnText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveEditBtn, isSubmitting && styles.submitBtnDisabled]}
                    onPress={handleUpdateCustomer}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={styles.saveEditBtnText}>Kaydet</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                // View mode actions - Düzenleme ve Randevu Oluştur
                <>
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={startEditMode}
                    >
                      <Ionicons name="create-outline" size={20} color="#163974" />
                      <Text style={styles.editBtnText}>Düzenle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.appointmentBtn}
                      onPress={() => {
                        closeDetailModal();
                        router.push({
                          pathname: '/appointment/new',
                          params: {
                            customerId: selectedCustomer.id,
                            customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
                            customerPhone: selectedCustomer.phone,
                            customerEmail: selectedCustomer.email || '',
                          },
                        });
                      }}
                    >
                      <Ionicons name="calendar" size={20} color="#fff" />
                      <Text style={styles.appointmentBtnText}>Randevu Oluştur</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Gender options
  const GENDER_OPTIONS = [
    { value: '', label: 'Seçin' },
    { value: 'Kadın', label: 'Kadın' },
    { value: 'Erkek', label: 'Erkek' },
    { value: 'Diğer', label: 'Diğer' },
  ];

  // Status options
  const STATUS_OPTIONS = [
    { value: 'active', label: 'Aktif', color: '#059669' },
    { value: 'inactive', label: 'Pasif', color: '#DC2626' },
    { value: 'vip', label: 'VIP', color: '#D97706' },
  ];

  // Render add customer modal - matching web panel fields
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
          {/* Premium Gradient Header */}
          <LinearGradient
            colors={['#163974', '#0F2A52']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addModalHeader}
          >
            <Text style={styles.addModalTitle}>Yeni Müşteri</Text>
            <TouchableOpacity
              style={styles.addModalCloseBtn}
              onPress={() => {
                setShowAddModal(false);
                resetNewCustomerForm();
              }}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.addModalScroll}>
            {/* Kişisel Bilgiler Section */}
            <View style={styles.formSectionCard}>
              <Text style={styles.formSectionTitle}>Kişisel Bilgiler</Text>

              {/* Ad */}
              <View style={styles.formGroupFull}>
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

              {/* Soyad */}
              <View style={styles.formGroupFull}>
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

              {/* Telefon */}
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

              {/* E-posta */}
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

              {/* Doğum Tarihi */}
              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>Doğum Tarihi</Text>
                <TouchableOpacity
                  style={styles.formInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View style={styles.datePickerBtn}>
                    <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                    <Text style={newCustomer.birthDate ? styles.datePickerText : styles.datePickerPlaceholder}>
                      {newCustomer.birthDate
                        ? new Date(newCustomer.birthDate).toLocaleDateString('tr-TR')
                        : 'Tarih seçin'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Cinsiyet */}
              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>Cinsiyet</Text>
                <View style={styles.genderSelectorFull}>
                  {GENDER_OPTIONS.filter(g => g.value).map((gender) => (
                    <TouchableOpacity
                      key={gender.value}
                      style={[
                        styles.genderOptionFull,
                        newCustomer.gender === gender.value && styles.genderOptionActive,
                      ]}
                      onPress={() =>
                        setNewCustomer((prev) => ({ ...prev, gender: gender.value }))
                      }
                    >
                      <Text
                        style={[
                          styles.genderOptionText,
                          newCustomer.gender === gender.value && styles.genderOptionTextActive,
                        ]}
                      >
                        {gender.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Adres */}
              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>Adres</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Tam adres"
                  placeholderTextColor="#9CA3AF"
                  value={newCustomer.address}
                  onChangeText={(text) =>
                    setNewCustomer((prev) => ({ ...prev, address: text }))
                  }
                />
              </View>
            </View>

            {/* Durum Section */}
            <View style={styles.formSectionCard}>
              <Text style={styles.formSectionTitle}>Müşteri Durumu</Text>
              <View style={styles.statusSelector}>
                {STATUS_OPTIONS.map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    style={[
                      styles.statusOption,
                      newCustomer.status === status.value && {
                        backgroundColor: status.color + '20',
                        borderColor: status.color,
                      },
                    ]}
                    onPress={() =>
                      setNewCustomer((prev) => ({ ...prev, status: status.value }))
                    }
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: status.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusOptionText,
                        newCustomer.status === status.value && { color: status.color },
                      ]}
                    >
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notlar Section */}
            <View style={styles.formSectionCard}>
              <Text style={styles.formSectionTitle}>Notlar</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                placeholder="Müşteri hakkında notlar, tercihler, alerjiler vb..."
                placeholderTextColor="#9CA3AF"
                value={newCustomer.notes}
                onChangeText={(text) =>
                  setNewCustomer((prev) => ({ ...prev, notes: text }))
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Bildirim Tercihleri Section */}
            <View style={styles.formSectionCard}>
              <Text style={styles.formSectionTitle}>Bildirim Tercihleri</Text>
              <TouchableOpacity
                style={styles.whatsappToggleNew}
                onPress={() =>
                  setNewCustomer((prev) => ({
                    ...prev,
                    whatsappNotifications: !prev.whatsappNotifications,
                  }))
                }
              >
                <View style={styles.whatsappToggleRow}>
                  <View style={[
                    styles.checkbox,
                    newCustomer.whatsappNotifications && styles.checkboxChecked,
                  ]}>
                    {newCustomer.whatsappNotifications && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                  <View style={styles.whatsappToggleContent}>
                    <View style={styles.whatsappToggleTitleRow}>
                      <Text style={styles.whatsappToggleText}>WhatsApp Bildirimleri</Text>
                      <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                    </View>
                    <Text style={styles.whatsappToggleHint}>
                      Randevu onayları ve hatırlatmalar WhatsApp üzerinden gönderilecektir.
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Bilgilendirme */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardText}>• Müşteri kaydedildikten sonra randevu oluşturabilirsiniz</Text>
                <Text style={styles.infoCardText}>• E-posta ve telefon bilgileri hatırlatmalar için kullanılacaktır</Text>
                <Text style={styles.infoCardText}>• Doğum tarihi bilgisi özel günlerde hatırlatma için kullanılır</Text>
              </View>
            </View>
          </ScrollView>

          {/* DateTimePicker for birth date */}
          {showDatePicker && (
            Platform.OS === 'ios' ? (
              <Modal
                visible={showDatePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.datePickerModalOverlay}>
                  <View style={styles.datePickerModalContent}>
                    <View style={styles.datePickerModalHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.datePickerCancelText}>İptal</Text>
                      </TouchableOpacity>
                      <Text style={styles.datePickerModalTitle}>Doğum Tarihi</Text>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.datePickerDoneText}>Tamam</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={newCustomer.birthDate ? new Date(newCustomer.birthDate) : new Date(2000, 0, 1)}
                      mode="date"
                      display="spinner"
                      locale="tr-TR"
                      maximumDate={new Date()}
                      minimumDate={new Date(1920, 0, 1)}
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          setNewCustomer((prev) => ({
                            ...prev,
                            birthDate: selectedDate.toISOString().split('T')[0],
                          }));
                        }
                      }}
                      style={styles.datePickerIOS}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker
                value={newCustomer.birthDate ? new Date(newCustomer.birthDate) : new Date(2000, 0, 1)}
                mode="date"
                display="default"
                maximumDate={new Date()}
                minimumDate={new Date(1920, 0, 1)}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (event.type === 'set' && selectedDate) {
                    setNewCustomer((prev) => ({
                      ...prev,
                      birthDate: selectedDate.toISOString().split('T')[0],
                    }));
                  }
                }}
              />
            )
          )}

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
      {/* Premium Gradient Header */}
      <LinearGradient
        colors={['#163974', '#0F2A52']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setDrawerOpen(true)}
          >
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.title}>Müşteriler</Text>
            <Text style={styles.subtitle}>{customers.length} müşteri kayıtlı</Text>
          </View>

          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name={showSearch ? 'close' : 'search'} size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search bar - collapsible */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
              <TextInput
                style={styles.searchInput}
                placeholder="İsim, telefon veya e-posta ara..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Filter tabs */}
      <View style={styles.filterTabs}>{renderFilterTabs()}</View>

      {/* Customer list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#163974" />
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
              tintColor="#163974"
              colors={['#163974']}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* FAB with gradient */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#163974', '#0F2A52']}
          style={styles.fabGradient}
        >
          <Ionicons name="person-add" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Modals */}
      {renderDetailModal()}
      {renderAddModal()}

      {/* Drawer Menu */}
      <DrawerMenu isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header - HIG/Material Design Compliant Premium gradient style
  header: {
    paddingHorizontal: IS_IOS ? 20 : 16,
    paddingTop: IS_IOS ? 16 : 12,
    paddingBottom: IS_IOS ? 16 : 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuBtn: {
    width: HEADER_BTN_SIZE,
    height: HEADER_BTN_SIZE,
    borderRadius: HEADER_BTN_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: IS_IOS ? 22 : 24,
    fontWeight: IS_IOS ? '700' : '600',
    color: '#fff',
    letterSpacing: IS_IOS ? -0.3 : 0,
  },
  subtitle: {
    fontSize: IS_IOS ? 13 : 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  searchBtn: {
    width: HEADER_BTN_SIZE,
    height: HEADER_BTN_SIZE,
    borderRadius: HEADER_BTN_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    marginTop: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },

  // Filter tabs - Modern style
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
    borderRadius: 20,
    overflow: 'hidden',
  },
  filterTabActive: {
    shadowColor: '#163974',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  filterTabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  filterTabText: {
    fontSize: 13,
    color: '#6B7280',
  },
  filterTabTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  filterTabBadge: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  filterTabBadgeActive: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterTabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  filterTabBadgeTextActive: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
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

  // Customer card - HIG/Material Design Compliant
  customerCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: IS_IOS ? 12 : 16, // iOS: 12pt, Android M3: 16dp
    marginBottom: IS_IOS ? 8 : 12,
    overflow: 'hidden',
    // Platform-specific shadows
    ...(IS_IOS ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    } : {
      elevation: 2,
    }),
  },
  cardAccent: {
    width: IS_IOS ? 4 : 6, // Slightly thicker on Android for visibility
  },
  cardContent: {
    flex: 1,
    padding: IS_IOS ? 12 : 16, // Android M3: more padding
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#163974',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  avatarTextVip: {
    color: '#D97706',
  },
  vipBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  blacklistBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#6B7280',
  },
  noShowBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  noShowText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  emailText: {
    fontSize: 11,
    color: '#9CA3AF',
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 6,
  },
  quickActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappBtn: {
    backgroundColor: '#D1FAE5',
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

  // FAB with gradient - HIG/Material Design Compliant
  fab: {
    position: 'absolute',
    right: IS_IOS ? 20 : 16,
    bottom: IS_IOS ? 24 : 16,
    // Platform-specific shadows
    ...(IS_IOS ? {
      shadowColor: '#163974',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    } : {
      elevation: 8,
    }),
  },
  fabGradient: {
    width: IS_IOS ? 50 : 56, // iOS: 50pt, Android Material 3: 56dp
    height: IS_IOS ? 50 : 56,
    borderRadius: IS_IOS ? 25 : 16, // iOS: circular, Android M3: 16dp rounded
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  // Detail modal - Premium design
  detailModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalGradientHeader: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  profileAvatarVip: {
    backgroundColor: '#FEF3C7',
    borderWidth: 3,
    borderColor: '#D97706',
  },
  profileAvatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  profileVipBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
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
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  modalScrollContent: {
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
    backgroundColor: '#163974',
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
    fontSize: IS_IOS ? 14 : 12, // iOS: 14pt, Android M3: 12sp for labels
    fontWeight: '600',
    color: IS_IOS ? '#374151' : '#49454F', // Android M3 onSurfaceVariant
    marginBottom: IS_IOS ? 8 : 4,
    ...(IS_IOS ? {} : { textTransform: 'uppercase' as const, letterSpacing: 0.5 }),
  },
  formInput: {
    backgroundColor: IS_IOS ? '#F3F4F6' : '#E7E0EC', // Android M3 surfaceVariant
    borderRadius: IS_IOS ? 12 : 4, // iOS: 12pt, Android M3: 4dp (sharp corners)
    paddingHorizontal: IS_IOS ? 12 : 16,
    paddingVertical: IS_IOS ? 12 : 16,
    fontSize: IS_IOS ? 14 : 16, // Android M3: 16sp for body
    color: '#1F2937',
    minHeight: IS_IOS ? 46 : 56, // iOS: 44-46pt, Android M3: 56dp
  },
  formTextarea: {
    minHeight: IS_IOS ? 100 : 120,
    paddingTop: IS_IOS ? 14 : 16,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IS_IOS ? '#F3F4F6' : '#E7E0EC',
    borderRadius: IS_IOS ? 12 : 4,
    overflow: 'hidden',
  },
  phonePrefix: {
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#163974',
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

  // Add modal - New premium styles
  addModalHeader: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  addModalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addModalScroll: {
    paddingBottom: 20,
  },
  formSectionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePickerText: {
    fontSize: 15,
    color: '#1F2937',
  },
  datePickerPlaceholder: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  genderSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  genderSelectorFull: {
    flexDirection: 'row',
    gap: 10,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  genderOptionFull: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  genderOptionActive: {
    backgroundColor: '#163974',
  },
  genderOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  genderOptionTextActive: {
    color: '#fff',
  },
  statusSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  whatsappToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  whatsappToggleNew: {
    padding: 14,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  whatsappToggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  whatsappToggleContent: {
    flex: 1,
  },
  whatsappToggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  whatsappToggleLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#25D366',
    borderColor: '#25D366',
  },
  whatsappToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  whatsappToggleHint: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    gap: 10,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },

  // DateTimePicker modal styles
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  datePickerCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#163974',
  },
  datePickerIOS: {
    height: 200,
    width: '100%',
  },

  // Delete button in card
  deleteCardBtn: {
    backgroundColor: '#FEE2E2',
  },

  // Edit form container
  editFormContainer: {
    paddingBottom: 20,
  },

  // Full width form input with better text visibility
  formInputFull: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 46,
  },

  // Phone input for edit mode
  phoneInputFull: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },

  // Action buttons row
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },

  // Edit button style
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#163974',
  },

  // Appointment button in detail modal
  appointmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#163974',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  appointmentBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Edit mode action buttons
  editActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelEditBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelEditBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveEditBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveEditBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
