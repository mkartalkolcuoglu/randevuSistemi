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
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../../src/services/api';
import DrawerMenu from '../../../src/components/DrawerMenu';

// Interfaces
interface PackageItem {
  id: string;
  itemType: 'service' | 'product';
  itemId: string;
  itemName: string;
  quantity: number;
}

interface Package {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  items: PackageItem[];
  customerCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

interface CustomerPackage {
  id: string;
  customerId: string;
  packageId: string;
  staffName: string;
  status: string;
  assignedAt: string;
  expiresAt: string | null;
  customer: Customer;
  usages: {
    id: string;
    itemType: string;
    itemName: string;
    totalQuantity: number;
    usedQuantity: number;
    remainingQuantity: number;
  }[];
}

// Status configuration
const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: string; gradient: [string, string] }> = {
  all: { bg: '#F3F4F6', text: '#374151', label: 'Tümü', icon: 'apps', gradient: ['#6B7280', '#4B5563'] },
  active: { bg: '#D1FAE5', text: '#059669', label: 'Aktif', icon: 'checkmark-circle', gradient: ['#10B981', '#059669'] },
  inactive: { bg: '#FEE2E2', text: '#DC2626', label: 'Pasif', icon: 'pause-circle', gradient: ['#EF4444', '#DC2626'] },
};

const FILTER_TABS = ['all', 'active', 'inactive'];

export default function PackagesScreen() {
  // State
  const [packages, setPackages] = useState<Package[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAssignedModal, setShowAssignedModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Assigned customers
  const [assignedCustomers, setAssignedCustomers] = useState<CustomerPackage[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  // New package form state
  const [newPackage, setNewPackage] = useState({
    name: '',
    description: '',
    price: '',
    items: [] as { itemType: 'service' | 'product'; itemId: string; itemName: string; quantity: string }[],
  });

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editPackage, setEditPackage] = useState<typeof newPackage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Assign modal state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [paymentType, setPaymentType] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [customerSearch, setCustomerSearch] = useState('');

  // Fetch packages
  const fetchPackages = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await api.get('/api/mobile/packages?includeInactive=true');
      setPackages(response.data.data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch services for package items
  const fetchServices = async () => {
    try {
      const response = await api.get('/api/mobile/services');
      setServices(response.data.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Fetch staff for assignment
  const fetchStaff = async () => {
    try {
      const response = await api.get('/api/mobile/staff');
      setStaff(response.data.data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  // Fetch customers for assignment
  const fetchCustomers = async () => {
    try {
      const response = await api.get('/api/mobile/customers');
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // Fetch assigned customers for a package
  const fetchAssignedCustomers = async (packageId: string) => {
    setLoadingAssigned(true);
    try {
      const response = await api.get(`/api/mobile/packages/assign?packageId=${packageId}`);
      setAssignedCustomers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching assigned customers:', error);
      setAssignedCustomers([]);
    } finally {
      setLoadingAssigned(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPackages();
      fetchServices();
      fetchStaff();
      fetchCustomers();
    }, [])
  );

  // Filter and search packages
  const filteredPackages = useMemo(() => {
    let result = [...packages];

    // Apply status filter
    if (activeFilter === 'active') {
      result = result.filter((p) => p.isActive);
    } else if (activeFilter === 'inactive') {
      result = result.filter((p) => !p.isActive);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((pkg) => {
        return (
          pkg.name.toLowerCase().includes(query) ||
          pkg.description?.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [packages, activeFilter, searchQuery]);

  // Get package counts by status
  const statusCounts = useMemo(() => {
    return {
      all: packages.length,
      active: packages.filter((p) => p.isActive).length,
      inactive: packages.filter((p) => !p.isActive).length,
    };
  }, [packages]);

  // Filtered customers for assign modal
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const query = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.includes(query)
    );
  }, [customers, customerSearch]);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Reset form helper
  const resetNewPackageForm = () => {
    setNewPackage({
      name: '',
      description: '',
      price: '',
      items: [],
    });
  };

  // Add item to package
  const addPackageItem = () => {
    setNewPackage((prev) => ({
      ...prev,
      items: [...prev.items, { itemType: 'service', itemId: '', itemName: '', quantity: '1' }],
    }));
  };

  // Remove item from package
  const removePackageItem = (index: number) => {
    setNewPackage((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Update item in package
  const updatePackageItem = (index: number, field: string, value: any) => {
    setNewPackage((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };

      // If itemId changed, update itemName
      if (field === 'itemId' && value) {
        const service = services.find((s) => s.id === value);
        if (service) {
          items[index].itemName = service.name;
        }
      }

      return { ...prev, items };
    });
  };

  // Start edit mode
  const startEditMode = () => {
    if (!selectedPackage) return;
    setEditPackage({
      name: selectedPackage.name || '',
      description: selectedPackage.description || '',
      price: selectedPackage.price?.toString() || '',
      items: selectedPackage.items.map((item) => ({
        itemType: item.itemType,
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity.toString(),
      })),
    });
    setIsEditMode(true);
  };

  // Handle update package
  const handleUpdatePackage = async () => {
    if (!selectedPackage || !editPackage) return;
    if (!editPackage.name.trim() || !editPackage.price) {
      Alert.alert('Hata', 'Paket adı ve fiyatı zorunludur');
      return;
    }

    if (editPackage.items.length === 0) {
      Alert.alert('Hata', 'En az bir paket içeriği ekleyin');
      return;
    }

    const price = parseFloat(editPackage.price);
    if (isNaN(price) || price < 0) {
      Alert.alert('Hata', 'Geçersiz fiyat değeri');
      return;
    }

    // Validate items
    for (const item of editPackage.items) {
      if (!item.itemId || !item.quantity) {
        Alert.alert('Hata', 'Tüm içerik öğelerini doldurun');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const packageData = {
        name: editPackage.name.trim(),
        description: editPackage.description?.trim() || null,
        price,
        items: editPackage.items.map((item) => ({
          itemType: item.itemType,
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: parseInt(item.quantity),
        })),
      };

      const response = await api.put(`/api/mobile/packages/${selectedPackage.id}`, packageData);
      if (response.data.success) {
        Alert.alert('Başarılı', 'Paket güncellendi');
        setIsEditMode(false);
        setShowDetailModal(false);
        fetchPackages();
      } else {
        Alert.alert('Hata', response.data.message || 'Paket güncellenemedi');
      }
    } catch (error: any) {
      console.error('Update package error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggle package status
  const handleToggleStatus = async (pkg?: Package) => {
    const targetPkg = pkg || selectedPackage;
    if (!targetPkg) return;

    setIsToggling(true);
    try {
      const response = await api.patch(`/api/mobile/packages/${targetPkg.id}`);
      if (response.data.success) {
        fetchPackages();
        if (selectedPackage && selectedPackage.id === targetPkg.id) {
          setSelectedPackage({
            ...selectedPackage,
            isActive: response.data.data.isActive,
          });
        }
      } else {
        Alert.alert('Hata', response.data.message || 'Durum değiştirilemedi');
      }
    } catch (error: any) {
      console.error('Toggle status error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsToggling(false);
    }
  };

  // Handle delete package
  const handleDeletePackage = (pkg?: Package) => {
    const targetPkg = pkg || selectedPackage;
    if (!targetPkg) return;

    if (targetPkg.customerCount > 0) {
      Alert.alert('Uyarı', `Bu paket ${targetPkg.customerCount} müşteriye atanmış. Önce müşteri atamalarını kaldırın.`);
      return;
    }

    Alert.alert(
      'Paketi Sil',
      `"${targetPkg.name}" paketini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const response = await api.delete(`/api/mobile/packages/${targetPkg.id}`);
              if (response.data.success) {
                Alert.alert('Başarılı', 'Paket silindi');
                setShowDetailModal(false);
                fetchPackages();
              } else {
                Alert.alert('Hata', response.data.message || 'Paket silinemedi');
              }
            } catch (error: any) {
              console.error('Delete package error:', error);
              Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Handle add package
  const handleAddPackage = async () => {
    if (!newPackage.name.trim() || !newPackage.price) {
      Alert.alert('Hata', 'Paket adı ve fiyatı zorunludur');
      return;
    }

    if (newPackage.items.length === 0) {
      Alert.alert('Hata', 'En az bir paket içeriği ekleyin');
      return;
    }

    const price = parseFloat(newPackage.price);
    if (isNaN(price) || price < 0) {
      Alert.alert('Hata', 'Geçersiz fiyat değeri');
      return;
    }

    // Validate items
    for (const item of newPackage.items) {
      if (!item.itemId || !item.quantity) {
        Alert.alert('Hata', 'Tüm içerik öğelerini doldurun');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const packageData = {
        name: newPackage.name.trim(),
        description: newPackage.description?.trim() || null,
        price,
        items: newPackage.items.map((item) => ({
          itemType: item.itemType,
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: parseInt(item.quantity),
        })),
      };

      const response = await api.post('/api/mobile/packages', packageData);
      if (response.data.success) {
        Alert.alert('Başarılı', 'Paket eklendi');
        setShowAddModal(false);
        resetNewPackageForm();
        fetchPackages();
      } else {
        Alert.alert('Hata', response.data.message || 'Paket eklenemedi');
      }
    } catch (error: any) {
      console.error('Add package error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open assign modal
  const openAssignModal = (pkg: Package) => {
    setSelectedPackage(pkg);
    setSelectedCustomer(null);
    setSelectedStaff(null);
    setPaymentType('cash');
    setCustomerSearch('');
    setShowAssignModal(true);
  };

  // Handle assign package to customer
  const handleAssignPackage = async () => {
    if (!selectedPackage || !selectedCustomer || !selectedStaff) {
      Alert.alert('Hata', 'Müşteri ve personel seçimi zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/mobile/packages/assign', {
        packageId: selectedPackage.id,
        customerId: selectedCustomer.id,
        staffId: selectedStaff.id,
        paymentType,
      });

      if (response.data.success) {
        Alert.alert('Başarılı', 'Paket müşteriye atandı ve ödeme kaydedildi');
        setShowAssignModal(false);
        fetchPackages();
      } else {
        Alert.alert('Hata', response.data.message || 'Paket atanamadı');
      }
    } catch (error: any) {
      console.error('Assign package error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open assigned customers modal
  const openAssignedModal = (pkg: Package) => {
    setSelectedPackage(pkg);
    fetchAssignedCustomers(pkg.id);
    setShowAssignedModal(true);
  };

  // Remove customer package assignment
  const handleRemoveAssignment = (customerPackageId: string, customerName: string) => {
    Alert.alert(
      'Paketi Kaldır',
      `"${customerName}" adlı müşteriden bu paketi kaldırmak istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/api/mobile/packages/assign?customerPackageId=${customerPackageId}`);
              if (response.data.success) {
                Alert.alert('Başarılı', 'Paket müşteriden kaldırıldı');
                if (selectedPackage) {
                  fetchAssignedCustomers(selectedPackage.id);
                  fetchPackages();
                }
              } else {
                Alert.alert('Hata', response.data.message || 'Paket kaldırılamadı');
              }
            } catch (error: any) {
              console.error('Remove assignment error:', error);
              Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  // Render package card - Compact modern design (like customers page)
  const renderPackageCard = ({ item }: { item: Package }) => {
    const statusConfig = item.isActive ? STATUS_CONFIG.active : STATUS_CONFIG.inactive;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          setSelectedPackage(item);
          setIsEditMode(false);
          setShowDetailModal(true);
        }}
        activeOpacity={0.7}
      >
        {/* Left accent bar */}
        <LinearGradient
          colors={statusConfig.gradient}
          style={styles.cardAccent}
        />

        <View style={styles.cardBody}>
          {/* Top Row: Icon + Name + Status + Price */}
          <View style={styles.cardTopRow}>
            {/* Package Icon */}
            <View style={styles.packageIcon}>
              <Ionicons name="gift" size={18} color="#fff" />
            </View>

            {/* Name & Description */}
            <View style={styles.packageInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.packageName} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
              {item.description && (
                <Text style={styles.packageDesc} numberOfLines={1}>
                  {item.description}
                </Text>
              )}
            </View>

            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.text} />
            </View>
          </View>

          {/* Middle Row: Price + Items Count */}
          <View style={styles.cardMiddleRow}>
            <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
            <View style={styles.itemsCountBadge}>
              <Ionicons name="layers-outline" size={12} color="#6B7280" />
              <Text style={styles.itemsCountText}>{item.items.length} içerik</Text>
            </View>
            {item.customerCount > 0 && (
              <TouchableOpacity
                style={styles.customerCountBadge}
                onPress={() => openAssignedModal(item)}
              >
                <Ionicons name="people" size={12} color="#163974" />
                <Text style={styles.customerCountText}>{item.customerCount} müşteri</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom Row: Quick Actions */}
          <View style={styles.cardBottomRow}>
            <View style={styles.itemsPreview}>
              {item.items.slice(0, 2).map((pkgItem, index) => (
                <View key={index} style={styles.itemChip}>
                  <Text style={styles.itemChipText} numberOfLines={1}>
                    {pkgItem.quantity}x {pkgItem.itemName}
                  </Text>
                </View>
              ))}
              {item.items.length > 2 && (
                <View style={styles.moreChip}>
                  <Text style={styles.moreChipText}>+{item.items.length - 2}</Text>
                </View>
              )}
            </View>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  openAssignModal(item);
                }}
              >
                <Ionicons name="person-add" size={16} color="#10B981" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedPackage(item);
                  startEditMode();
                  setShowDetailModal(true);
                }}
              >
                <Ionicons name="create-outline" size={16} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionBtn, styles.deleteBtn]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeletePackage(item);
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
      <Ionicons name="gift-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Paket Bulunamadı</Text>
      <Text style={styles.emptyText}>
        {searchQuery ? 'Arama kriterlerine uygun paket yok' : 'Henüz paket eklenmemiş'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.emptyBtnText}>Yeni Paket Ekle</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render stats row (like services page)
  const renderStatsRow = () => (
    <View style={styles.statsRow}>
      <TouchableOpacity
        style={[styles.statItem, activeFilter === 'all' && styles.statItemActive]}
        onPress={() => setActiveFilter('all')}
      >
        <Text style={[styles.statValue, activeFilter === 'all' && styles.statValueActive]}>
          {statusCounts.all}
        </Text>
        <Text style={[styles.statLabel, activeFilter === 'all' && styles.statLabelActive]}>Toplam</Text>
      </TouchableOpacity>
      <View style={styles.statDivider} />
      <TouchableOpacity
        style={[styles.statItem, activeFilter === 'active' && styles.statItemActive]}
        onPress={() => setActiveFilter('active')}
      >
        <Text style={[styles.statValue, { color: '#059669' }, activeFilter === 'active' && styles.statValueActive]}>
          {statusCounts.active}
        </Text>
        <Text style={[styles.statLabel, activeFilter === 'active' && styles.statLabelActive]}>Aktif</Text>
      </TouchableOpacity>
      <View style={styles.statDivider} />
      <TouchableOpacity
        style={[styles.statItem, activeFilter === 'inactive' && styles.statItemActive]}
        onPress={() => setActiveFilter('inactive')}
      >
        <Text style={[styles.statValue, { color: '#DC2626' }, activeFilter === 'inactive' && styles.statValueActive]}>
          {statusCounts.inactive}
        </Text>
        <Text style={[styles.statLabel, activeFilter === 'inactive' && styles.statLabelActive]}>Pasif</Text>
      </TouchableOpacity>
    </View>
  );

  // Render item form (for add/edit)
  const renderItemForm = (items: typeof newPackage.items, setItems: (items: typeof newPackage.items) => void, isEdit: boolean = false) => (
    <View style={styles.itemsSection}>
      <View style={styles.itemsHeader}>
        <Text style={styles.formLabel}>Paket İçeriği *</Text>
        <TouchableOpacity
          style={styles.addItemBtn}
          onPress={() => {
            const newItem = { itemType: 'service' as const, itemId: '', itemName: '', quantity: '1' };
            if (isEdit && editPackage) {
              setEditPackage({ ...editPackage, items: [...editPackage.items, newItem] });
            } else {
              setNewPackage((prev) => ({ ...prev, items: [...prev.items, newItem] }));
            }
          }}
        >
          <Ionicons name="add" size={16} color="#6366F1" />
          <Text style={styles.addItemBtnText}>Öğe Ekle</Text>
        </TouchableOpacity>
      </View>

      {items.map((item, index) => (
        <View key={index} style={styles.itemFormRow}>
          <View style={styles.itemFormContent}>
            <View style={styles.itemFormField}>
              <Text style={styles.itemFormLabel}>Hizmet</Text>
              <View style={styles.serviceSelectContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {services.map((service) => (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        styles.serviceOption,
                        item.itemId === service.id && styles.serviceOptionSelected,
                      ]}
                      onPress={() => {
                        const newItems = [...items];
                        newItems[index] = { ...newItems[index], itemId: service.id, itemName: service.name };
                        if (isEdit && editPackage) {
                          setEditPackage({ ...editPackage, items: newItems });
                        } else {
                          setNewPackage((prev) => ({ ...prev, items: newItems }));
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.serviceOptionText,
                          item.itemId === service.id && styles.serviceOptionTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {service.name}
                      </Text>
                      <Text
                        style={[
                          styles.serviceOptionPrice,
                          item.itemId === service.id && styles.serviceOptionPriceSelected,
                        ]}
                      >
                        {formatPrice(service.price)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.itemFormFieldSmall}>
              <Text style={styles.itemFormLabel}>Adet</Text>
              <TextInput
                style={styles.quantityInput}
                value={item.quantity}
                onChangeText={(text) => {
                  const newItems = [...items];
                  newItems[index] = { ...newItems[index], quantity: text };
                  if (isEdit && editPackage) {
                    setEditPackage({ ...editPackage, items: newItems });
                  } else {
                    setNewPackage((prev) => ({ ...prev, items: newItems }));
                  }
                }}
                keyboardType="number-pad"
                placeholder="1"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.removeItemBtn}
            onPress={() => {
              const newItems = items.filter((_, i) => i !== index);
              if (isEdit && editPackage) {
                setEditPackage({ ...editPackage, items: newItems });
              } else {
                setNewPackage((prev) => ({ ...prev, items: newItems }));
              }
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ))}

      {items.length === 0 && (
        <View style={styles.noItemsContainer}>
          <Ionicons name="cube-outline" size={32} color="#D1D5DB" />
          <Text style={styles.noItemsText}>Henüz içerik eklenmedi</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.menuBtn} onPress={() => setDrawerOpen(true)}>
            <Ionicons name="menu" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Paketler</Text>
            <Text style={styles.headerSubtitle}>{packages.length} paket</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowSearch(!showSearch)}>
            <Ionicons name={showSearch ? 'close' : 'search'} size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Paket ara..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Stats Row */}
      {renderStatsRow()}

      {/* Package List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#163974" />
          <Text style={styles.loadingText}>Paketler yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPackages}
          renderItem={renderPackageCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchPackages(true)}
              tintColor="#163974"
              colors={['#163974']}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
        <LinearGradient colors={['#1E4A8D', '#163974']} style={styles.fabGradient}>
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Drawer Menu */}
      <DrawerMenu isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowDetailModal(false);
                setIsEditMode(false);
              }}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{isEditMode ? 'Paketi Düzenle' : 'Paket Detayı'}</Text>
            {!isEditMode ? (
              <TouchableOpacity onPress={startEditMode}>
                <Ionicons name="create-outline" size={24} color="#6366F1" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 24 }} />
            )}
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalBody}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {isEditMode && editPackage ? (
                // Edit Form
                <View style={styles.editFormContainer}>
                  <View style={styles.formGroupFull}>
                    <Text style={styles.formLabel}>Paket Adı *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editPackage.name}
                      onChangeText={(text) => setEditPackage({ ...editPackage, name: text })}
                      placeholder="Paket adı"
                    />
                  </View>

                  <View style={styles.formGroupFull}>
                    <Text style={styles.formLabel}>Açıklama</Text>
                    <TextInput
                      style={[styles.formInput, styles.formTextarea]}
                      value={editPackage.description}
                      onChangeText={(text) => setEditPackage({ ...editPackage, description: text })}
                      placeholder="Paket açıklaması"
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.formGroupFull}>
                    <Text style={styles.formLabel}>Fiyat (₺) *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editPackage.price}
                      onChangeText={(text) => setEditPackage({ ...editPackage, price: text })}
                      placeholder="0"
                      keyboardType="decimal-pad"
                    />
                  </View>

                  {renderItemForm(editPackage.items, (items) => setEditPackage({ ...editPackage, items }), true)}

                  <TouchableOpacity
                    style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                    onPress={handleUpdatePackage}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={styles.submitBtnText}>Güncelle</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                // Detail View
                selectedPackage && (
                  <View style={styles.detailContainer}>
                    <View style={styles.detailHeader}>
                      <Text style={styles.detailName}>{selectedPackage.name}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: selectedPackage.isActive
                              ? STATUS_CONFIG.active.bg
                              : STATUS_CONFIG.inactive.bg,
                          },
                        ]}
                      >
                        <Ionicons
                          name={selectedPackage.isActive ? 'checkmark-circle' : 'pause-circle'}
                          size={14}
                          color={
                            selectedPackage.isActive
                              ? STATUS_CONFIG.active.text
                              : STATUS_CONFIG.inactive.text
                          }
                        />
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: selectedPackage.isActive
                                ? STATUS_CONFIG.active.text
                                : STATUS_CONFIG.inactive.text,
                            },
                          ]}
                        >
                          {selectedPackage.isActive ? 'Aktif' : 'Pasif'}
                        </Text>
                      </View>
                    </View>

                    {selectedPackage.description && (
                      <Text style={styles.detailDescription}>{selectedPackage.description}</Text>
                    )}

                    <Text style={styles.detailPrice}>{formatPrice(selectedPackage.price)}</Text>

                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Paket İçeriği</Text>
                      {selectedPackage.items.map((item, index) => (
                        <View key={index} style={styles.detailItemRow}>
                          <View style={styles.detailItemDot} />
                          <Text style={styles.detailItemText}>
                            {item.quantity}x {item.itemName}
                          </Text>
                          <View style={styles.detailItemTypeBadge}>
                            <Text style={styles.detailItemTypeText}>
                              {item.itemType === 'service' ? 'Hizmet' : 'Ürün'}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    {selectedPackage.customerCount > 0 && (
                      <TouchableOpacity
                        style={styles.assignedCountCard}
                        onPress={() => {
                          setShowDetailModal(false);
                          openAssignedModal(selectedPackage);
                        }}
                      >
                        <Ionicons name="people" size={20} color="#6366F1" />
                        <Text style={styles.assignedCountText}>
                          {selectedPackage.customerCount} müşteriye atanmış
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color="#6366F1" />
                      </TouchableOpacity>
                    )}

                    <View style={styles.detailActions}>
                      <TouchableOpacity
                        style={styles.detailAssignBtn}
                        onPress={() => {
                          setShowDetailModal(false);
                          openAssignModal(selectedPackage);
                        }}
                      >
                        <Ionicons name="person-add" size={18} color="#fff" />
                        <Text style={styles.detailAssignBtnText}>Müşteriye Ata</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.detailToggleBtn, isToggling && styles.detailToggleBtnDisabled]}
                        onPress={() => handleToggleStatus()}
                        disabled={isToggling}
                      >
                        {isToggling ? (
                          <ActivityIndicator color="#6B7280" size="small" />
                        ) : (
                          <>
                            <Ionicons
                              name={selectedPackage.isActive ? 'pause' : 'play'}
                              size={18}
                              color="#6B7280"
                            />
                            <Text style={styles.detailToggleBtnText}>
                              {selectedPackage.isActive ? 'Pasife Al' : 'Aktif Et'}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.detailDeleteBtn, isDeleting && styles.detailDeleteBtnDisabled]}
                        onPress={() => handleDeletePackage()}
                        disabled={isDeleting || selectedPackage.customerCount > 0}
                      >
                        {isDeleting ? (
                          <ActivityIndicator color="#EF4444" size="small" />
                        ) : (
                          <>
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            <Text style={styles.detailDeleteBtnText}>Sil</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Add Package Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                resetNewPackageForm();
              }}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Yeni Paket</Text>
            <View style={{ width: 24 }} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalBody}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.addFormContainer}>
                <View style={styles.formGroupFull}>
                  <Text style={styles.formLabel}>Paket Adı *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newPackage.name}
                    onChangeText={(text) => setNewPackage({ ...newPackage, name: text })}
                    placeholder="Paket adı"
                  />
                </View>

                <View style={styles.formGroupFull}>
                  <Text style={styles.formLabel}>Açıklama</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextarea]}
                    value={newPackage.description}
                    onChangeText={(text) => setNewPackage({ ...newPackage, description: text })}
                    placeholder="Paket açıklaması"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formGroupFull}>
                  <Text style={styles.formLabel}>Fiyat (₺) *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newPackage.price}
                    onChangeText={(text) => setNewPackage({ ...newPackage, price: text })}
                    placeholder="0"
                    keyboardType="decimal-pad"
                  />
                </View>

                {renderItemForm(newPackage.items, (items) => setNewPackage({ ...newPackage, items }), false)}

                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                  onPress={handleAddPackage}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="add" size={20} color="#fff" />
                      <Text style={styles.submitBtnText}>Paket Oluştur</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Assign Package Modal */}
      <Modal visible={showAssignModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAssignModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Paketi Müşteriye Ata</Text>
            <View style={{ width: 24 }} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalBody}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedPackage && (
                <View style={styles.assignFormContainer}>
                  {/* Package Info */}
                  <View style={styles.assignPackageInfo}>
                    <Text style={styles.assignPackageName}>{selectedPackage.name}</Text>
                    <Text style={styles.assignPackagePrice}>{formatPrice(selectedPackage.price)}</Text>
                  </View>

                  {/* Package Items */}
                  <View style={styles.assignPackageItems}>
                    <Text style={styles.assignSectionTitle}>Paket İçeriği:</Text>
                    {selectedPackage.items.map((item, index) => (
                      <View key={index} style={styles.assignItemRow}>
                        <View style={styles.assignItemDot} />
                        <Text style={styles.assignItemText}>
                          {item.quantity}x {item.itemName}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Customer Selection */}
                  <View style={styles.formGroupFull}>
                    <Text style={styles.formLabel}>Müşteri Seçin *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={customerSearch}
                      onChangeText={setCustomerSearch}
                      placeholder="Müşteri ara (isim, email, telefon)..."
                    />
                    <ScrollView style={styles.customerList} nestedScrollEnabled>
                      {filteredCustomers.slice(0, 10).map((customer) => (
                        <TouchableOpacity
                          key={customer.id}
                          style={[
                            styles.customerOption,
                            selectedCustomer?.id === customer.id && styles.customerOptionSelected,
                          ]}
                          onPress={() => setSelectedCustomer(customer)}
                        >
                          <View style={styles.customerAvatar}>
                            <Text style={styles.customerAvatarText}>
                              {customer.firstName[0]}{customer.lastName[0]}
                            </Text>
                          </View>
                          <View style={styles.customerInfo}>
                            <Text style={styles.customerName}>
                              {customer.firstName} {customer.lastName}
                            </Text>
                            <Text style={styles.customerDetail}>{customer.email}</Text>
                            {customer.phone && (
                              <Text style={styles.customerDetail}>{customer.phone}</Text>
                            )}
                          </View>
                          {selectedCustomer?.id === customer.id && (
                            <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Staff Selection */}
                  <View style={styles.formGroupFull}>
                    <Text style={styles.formLabel}>Satış Yapan Personel *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {staff.map((s) => (
                        <TouchableOpacity
                          key={s.id}
                          style={[
                            styles.staffOption,
                            selectedStaff?.id === s.id && styles.staffOptionSelected,
                          ]}
                          onPress={() => setSelectedStaff(s)}
                        >
                          <Text
                            style={[
                              styles.staffOptionText,
                              selectedStaff?.id === s.id && styles.staffOptionTextSelected,
                            ]}
                          >
                            {s.firstName} {s.lastName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Payment Type */}
                  <View style={styles.formGroupFull}>
                    <Text style={styles.formLabel}>Ödeme Türü</Text>
                    <View style={styles.paymentOptions}>
                      {[
                        { key: 'cash', label: 'Nakit', icon: 'cash' },
                        { key: 'card', label: 'Kart', icon: 'card' },
                        { key: 'transfer', label: 'Havale', icon: 'swap-horizontal' },
                      ].map((option) => (
                        <TouchableOpacity
                          key={option.key}
                          style={[
                            styles.paymentOption,
                            paymentType === option.key && styles.paymentOptionSelected,
                          ]}
                          onPress={() => setPaymentType(option.key as any)}
                        >
                          <Ionicons
                            name={option.icon as any}
                            size={20}
                            color={paymentType === option.key ? '#6366F1' : '#6B7280'}
                          />
                          <Text
                            style={[
                              styles.paymentOptionText,
                              paymentType === option.key && styles.paymentOptionTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      styles.assignSubmitBtn,
                      (isSubmitting || !selectedCustomer || !selectedStaff) && styles.submitBtnDisabled,
                    ]}
                    onPress={handleAssignPackage}
                    disabled={isSubmitting || !selectedCustomer || !selectedStaff}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={styles.submitBtnText}>Paketi Ata ve Ödeme Kaydet</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Assigned Customers Modal */}
      <Modal visible={showAssignedModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAssignedModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Atanan Müşteriler</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalBody}>
            {selectedPackage && (
              <View style={styles.assignedHeader}>
                <Text style={styles.assignedPackageName}>{selectedPackage.name}</Text>
                <Text style={styles.assignedPackagePrice}>{formatPrice(selectedPackage.price)}</Text>
              </View>
            )}

            {loadingAssigned ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
              </View>
            ) : assignedCustomers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>Henüz müşteri yok</Text>
                <Text style={styles.emptyText}>Bu pakete henüz müşteri atanmamış</Text>
              </View>
            ) : (
              <FlatList
                data={assignedCustomers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.assignedCustomerCard}>
                    <View style={styles.assignedCustomerHeader}>
                      <View style={styles.assignedCustomerAvatar}>
                        <Text style={styles.assignedCustomerAvatarText}>
                          {item.customer?.firstName?.[0]}{item.customer?.lastName?.[0]}
                        </Text>
                      </View>
                      <View style={styles.assignedCustomerInfo}>
                        <Text style={styles.assignedCustomerName}>
                          {item.customer?.firstName} {item.customer?.lastName}
                        </Text>
                        <Text style={styles.assignedCustomerDetail}>
                          Satan: {item.staffName}
                        </Text>
                        <Text style={styles.assignedCustomerDate}>
                          {new Date(item.assignedAt).toLocaleDateString('tr-TR')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.assignedUsages}>
                      <Text style={styles.assignedUsagesTitle}>Kullanım Durumu:</Text>
                      {item.usages.map((usage, index) => (
                        <View key={index} style={styles.usageRow}>
                          <Text style={styles.usageItemName}>{usage.itemName}</Text>
                          <View style={styles.usageProgress}>
                            <View
                              style={[
                                styles.usageProgressBar,
                                {
                                  width: `${(usage.usedQuantity / usage.totalQuantity) * 100}%`,
                                  backgroundColor:
                                    usage.remainingQuantity === 0
                                      ? '#EF4444'
                                      : usage.remainingQuantity <= 2
                                      ? '#F59E0B'
                                      : '#10B981',
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.usageText}>
                            {usage.remainingQuantity}/{usage.totalQuantity}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.removeAssignmentBtn}
                      onPress={() =>
                        handleRemoveAssignment(
                          item.id,
                          `${item.customer?.firstName} ${item.customer?.lastName}`
                        )
                      }
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      <Text style={styles.removeAssignmentBtnText}>Kaldır</Text>
                    </TouchableOpacity>
                  </View>
                )}
                contentContainerStyle={styles.assignedList}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  statItemActive: {
    backgroundColor: '#F3F4F6',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statValueActive: {
    color: '#163974',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statLabelActive: {
    color: '#163974',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#163974',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  // Card - Compact modern design (like customers page)
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardAccent: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#163974',
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageInfo: {
    flex: 1,
    marginLeft: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  packageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  packageDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#163974',
  },
  itemsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemsCountText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  customerCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  customerCountText: {
    fontSize: 11,
    color: '#163974',
    fontWeight: '500',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  itemsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  itemChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: 100,
  },
  itemChipText: {
    fontSize: 10,
    color: '#4B5563',
  },
  moreChip: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  moreChipText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 6,
  },
  quickActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 28,
    shadowColor: '#163974',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalBody: {
    flex: 1,
  },
  editFormContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  addFormContainer: {
    padding: 16,
    paddingBottom: 40,
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 46,
  },
  formTextarea: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  itemsSection: {
    marginBottom: 16,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    gap: 4,
  },
  addItemBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  itemFormRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  itemFormContent: {
    flex: 1,
  },
  itemFormField: {
    marginBottom: 8,
  },
  itemFormFieldSmall: {
    width: 80,
  },
  itemFormLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  serviceSelectContainer: {
    maxHeight: 100,
  },
  serviceOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  serviceOptionSelected: {
    backgroundColor: '#6366F1',
  },
  serviceOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  serviceOptionTextSelected: {
    color: '#fff',
  },
  serviceOptionPrice: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  serviceOptionPriceSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  quantityInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  removeItemBtn: {
    padding: 8,
    marginTop: 16,
  },
  noItemsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  noItemsText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  detailContainer: {
    padding: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  detailDescription: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 12,
  },
  detailPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6366F1',
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    marginRight: 10,
  },
  detailItemText: {
    fontSize: 15,
    color: '#4B5563',
    flex: 1,
  },
  detailItemTypeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  detailItemTypeText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  assignedCountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  assignedCountText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#6366F1',
  },
  detailActions: {
    gap: 10,
  },
  detailAssignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  detailAssignBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  detailToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  detailToggleBtnDisabled: {
    opacity: 0.6,
  },
  detailToggleBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  detailDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  detailDeleteBtnDisabled: {
    opacity: 0.6,
  },
  detailDeleteBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  assignFormContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  assignPackageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  assignPackageName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  assignPackagePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366F1',
  },
  assignPackageItems: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  assignSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  assignItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  assignItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
    marginRight: 8,
  },
  assignItemText: {
    fontSize: 13,
    color: '#4B5563',
  },
  customerList: {
    maxHeight: 200,
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  customerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  customerOptionSelected: {
    backgroundColor: '#EEF2FF',
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  customerDetail: {
    fontSize: 12,
    color: '#6B7280',
  },
  staffOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    marginRight: 8,
  },
  staffOptionSelected: {
    backgroundColor: '#6366F1',
  },
  staffOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  staffOptionTextSelected: {
    color: '#fff',
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    gap: 6,
  },
  paymentOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  paymentOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  paymentOptionTextSelected: {
    color: '#6366F1',
  },
  assignSubmitBtn: {
    backgroundColor: '#10B981',
  },
  assignedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  assignedPackageName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  assignedPackagePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366F1',
  },
  assignedList: {
    padding: 16,
  },
  assignedCustomerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  assignedCustomerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  assignedCustomerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assignedCustomerAvatarText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  assignedCustomerInfo: {
    flex: 1,
  },
  assignedCustomerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  assignedCustomerDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  assignedCustomerDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  assignedUsages: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  assignedUsagesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  usageItemName: {
    fontSize: 12,
    color: '#4B5563',
    width: 100,
  },
  usageProgress: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  usageProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  usageText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    width: 35,
    textAlign: 'right',
  },
  removeAssignmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    gap: 4,
  },
  removeAssignmentBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#EF4444',
  },
});
