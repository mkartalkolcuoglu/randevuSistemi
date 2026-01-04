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
import Header from '../../../src/components/Header';
import PermissionGuard from '../../../src/components/PermissionGuard';

// Staff interface
interface Staff {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string;
  status: string;
  avatar: string | null;
  salary: number | null;
  hireDate: string | null;
  specializations: string[];
  experience: number | null;
  rating: number | null;
  workingHours: any | null;
  notes: string | null;
  canLogin: boolean;
  role: string | null;
  services: { id: string; name: string }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Status configuration
const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: string; gradient: [string, string] }> = {
  all: { bg: '#F3F4F6', text: '#374151', label: 'Tümü', icon: 'apps', gradient: ['#6B7280', '#4B5563'] },
  active: { bg: '#D1FAE5', text: '#059669', label: 'Aktif', icon: 'checkmark-circle', gradient: ['#10B981', '#059669'] },
  inactive: { bg: '#FEE2E2', text: '#DC2626', label: 'Pasif', icon: 'pause-circle', gradient: ['#EF4444', '#DC2626'] },
  vacation: { bg: '#FEF3C7', text: '#D97706', label: 'İzinli', icon: 'sunny', gradient: ['#F59E0B', '#D97706'] },
};

const FILTER_TABS = ['all', 'active', 'inactive', 'vacation'];

// Default working hours
const DEFAULT_WORKING_HOURS = {
  monday: { isOpen: true, start: '09:00', end: '18:00' },
  tuesday: { isOpen: true, start: '09:00', end: '18:00' },
  wednesday: { isOpen: true, start: '09:00', end: '18:00' },
  thursday: { isOpen: true, start: '09:00', end: '18:00' },
  friday: { isOpen: true, start: '09:00', end: '18:00' },
  saturday: { isOpen: true, start: '09:00', end: '18:00' },
  sunday: { isOpen: false, start: '09:00', end: '18:00' },
};

const DAY_LABELS: Record<string, string> = {
  monday: 'Pazartesi',
  tuesday: 'Salı',
  wednesday: 'Çarşamba',
  thursday: 'Perşembe',
  friday: 'Cuma',
  saturday: 'Cumartesi',
  sunday: 'Pazar',
};

// Permission pages
const PERMISSION_PAGES = [
  { key: 'dashboard', label: 'Ana Sayfa' },
  { key: 'appointments', label: 'Randevular' },
  { key: 'customers', label: 'Müşteriler' },
  { key: 'services', label: 'Hizmetler' },
  { key: 'staff', label: 'Personel' },
  { key: 'packages', label: 'Paketler' },
  { key: 'cashier', label: 'Kasa' },
  { key: 'stock', label: 'Stok' },
  { key: 'reports', label: 'Raporlama' },
  { key: 'settings', label: 'Ayarlar' },
];

const PERMISSION_TYPES = [
  { key: 'view', label: 'Görüntüleme' },
  { key: 'create', label: 'Ekleme' },
  { key: 'edit', label: 'Düzenleme' },
  { key: 'delete', label: 'Silme' },
];

// Default permissions (all view enabled)
const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  dashboard: { view: true, create: false, edit: false, delete: false },
  appointments: { view: true, create: false, edit: false, delete: false },
  customers: { view: true, create: false, edit: false, delete: false },
  services: { view: true, create: false, edit: false, delete: false },
  staff: { view: false, create: false, edit: false, delete: false },
  packages: { view: false, create: false, edit: false, delete: false },
  cashier: { view: false, create: false, edit: false, delete: false },
  stock: { view: false, create: false, edit: false, delete: false },
  reports: { view: false, create: false, edit: false, delete: false },
  settings: { view: false, create: false, edit: false, delete: false },
};

export default function StaffTeamScreen() {
  // State
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // New staff form state
  const [newStaff, setNewStaff] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    status: 'active',
    salary: '',
    hireDate: '',
    specializations: [] as string[],
    experience: '',
    rating: '4',
    workingHours: DEFAULT_WORKING_HOURS,
    notes: '',
    canLogin: false,
    username: '',
    password: '',
    permissions: DEFAULT_PERMISSIONS,
  });
  const [newSpecialization, setNewSpecialization] = useState('');

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editStaff, setEditStaff] = useState<typeof newStaff | null>(null);
  const [editSpecialization, setEditSpecialization] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Fetch staff
  const fetchStaff = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      console.log('📡 Fetching staff...');
      const response = await api.get('/api/mobile/staff?includeAll=true');
      console.log('✅ Staff fetched:', response.data.data?.length || 0, 'items');
      setStaff(response.data.data || []);
    } catch (error: any) {
      console.error('❌ Error fetching staff:', error?.message);
      console.error('Response status:', error?.response?.status);
      console.error('Response data:', JSON.stringify(error?.response?.data));
      setStaff([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStaff();
    }, [])
  );

  // Filter and search staff
  const filteredStaff = useMemo(() => {
    let result = [...staff];

    // Apply status filter
    if (activeFilter !== 'all') {
      result = result.filter((s) => s.status === activeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((member) => {
        return (
          `${member.firstName} ${member.lastName}`.toLowerCase().includes(query) ||
          member.email?.toLowerCase().includes(query) ||
          member.phone?.toLowerCase().includes(query) ||
          member.position?.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [staff, activeFilter, searchQuery]);

  // Get staff counts by status
  const statusCounts = useMemo(() => {
    return {
      all: staff.length,
      active: staff.filter((s) => s.status === 'active').length,
      inactive: staff.filter((s) => s.status === 'inactive').length,
      vacation: staff.filter((s) => s.status === 'vacation').length,
    };
  }, [staff]);

  // Parse permissions helper
  const parsePermissions = (permStr: string | null): Record<string, Record<string, boolean>> => {
    if (!permStr) return DEFAULT_PERMISSIONS;
    try {
      return JSON.parse(permStr);
    } catch {
      return DEFAULT_PERMISSIONS;
    }
  };

  // Reset form helper
  const resetNewStaffForm = () => {
    setNewStaff({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      status: 'active',
      salary: '',
      hireDate: '',
      specializations: [],
      experience: '',
      rating: '4',
      workingHours: DEFAULT_WORKING_HOURS,
      notes: '',
      canLogin: false,
      username: '',
      password: '',
      permissions: DEFAULT_PERMISSIONS,
    });
    setNewSpecialization('');
  };

  // Start edit mode
  const startEditMode = () => {
    if (!selectedStaff) return;
    setEditStaff({
      firstName: selectedStaff.firstName || '',
      lastName: selectedStaff.lastName || '',
      email: selectedStaff.email || '',
      phone: selectedStaff.phone || '',
      position: selectedStaff.position || '',
      status: selectedStaff.status || 'active',
      salary: selectedStaff.salary?.toString() || '',
      hireDate: selectedStaff.hireDate || '',
      specializations: selectedStaff.specializations || [],
      experience: selectedStaff.experience?.toString() || '',
      rating: selectedStaff.rating?.toString() || '4',
      workingHours: selectedStaff.workingHours || DEFAULT_WORKING_HOURS,
      notes: selectedStaff.notes || '',
      canLogin: selectedStaff.canLogin || false,
      username: '',
      password: '',
      permissions: parsePermissions((selectedStaff as any).permissions),
    });
    setEditSpecialization('');
    setIsEditMode(true);
  };

  // Handle update staff
  const handleUpdateStaff = async () => {
    if (!selectedStaff || !editStaff) return;
    if (!editStaff.firstName.trim() || !editStaff.lastName.trim() || !editStaff.email.trim() || !editStaff.position.trim()) {
      Alert.alert('Hata', 'Ad, soyad, e-posta ve pozisyon zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      const staffData: any = {
        firstName: editStaff.firstName.trim(),
        lastName: editStaff.lastName.trim(),
        email: editStaff.email.trim(),
        phone: editStaff.phone?.trim() || null,
        position: editStaff.position.trim(),
        status: editStaff.status,
        salary: editStaff.salary ? parseFloat(editStaff.salary) : null,
        hireDate: editStaff.hireDate || null,
        specializations: editStaff.specializations,
        experience: editStaff.experience ? parseInt(editStaff.experience) : null,
        rating: editStaff.rating ? parseFloat(editStaff.rating) : null,
        workingHours: editStaff.workingHours,
        notes: editStaff.notes?.trim() || null,
        canLogin: editStaff.canLogin,
        permissions: editStaff.canLogin ? JSON.stringify(editStaff.permissions) : null,
      };

      // Only include username/password if canLogin is true and they are provided
      if (editStaff.canLogin && editStaff.username?.trim()) {
        staffData.username = editStaff.username.trim();
      }
      if (editStaff.canLogin && editStaff.password?.trim()) {
        staffData.password = editStaff.password.trim();
      }

      const response = await api.put(`/api/mobile/staff/${selectedStaff.id}`, staffData);
      if (response.data.success) {
        Alert.alert('Başarılı', 'Personel güncellendi');
        setIsEditMode(false);
        setShowDetailModal(false);
        fetchStaff();
      } else {
        Alert.alert('Hata', response.data.message || 'Personel güncellenemedi');
      }
    } catch (error: any) {
      console.error('Update staff error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggle staff status
  const handleToggleStatus = async (member?: Staff, newStatus?: string) => {
    const targetStaff = member || selectedStaff;
    if (!targetStaff) return;

    setIsToggling(true);
    try {
      const response = await api.patch(`/api/mobile/staff/${targetStaff.id}`, {
        status: newStatus,
      });
      if (response.data.success) {
        fetchStaff();
        if (selectedStaff && selectedStaff.id === targetStaff.id) {
          setSelectedStaff({
            ...selectedStaff,
            status: response.data.data.status,
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

  // Handle delete staff
  const handleDeleteStaff = (member?: Staff) => {
    const staffToDelete = member || selectedStaff;
    if (!staffToDelete) return;

    Alert.alert(
      'Personeli Sil',
      `"${staffToDelete.firstName} ${staffToDelete.lastName}" personelini silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const response = await api.delete(`/api/mobile/staff/${staffToDelete.id}`);
              if (response.data.success) {
                Alert.alert('Başarılı', 'Personel silindi');
                setShowDetailModal(false);
                fetchStaff();
              } else {
                Alert.alert('Hata', response.data.message || 'Personel silinemedi');
              }
            } catch (error: any) {
              console.error('Delete staff error:', error);
              Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Handle add staff
  const handleAddStaff = async () => {
    if (!newStaff.firstName.trim() || !newStaff.lastName.trim() || !newStaff.email.trim() || !newStaff.position.trim()) {
      Alert.alert('Hata', 'Ad, soyad, e-posta ve pozisyon zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      const staffData: any = {
        firstName: newStaff.firstName.trim(),
        lastName: newStaff.lastName.trim(),
        email: newStaff.email.trim(),
        phone: newStaff.phone?.trim() || null,
        position: newStaff.position.trim(),
        status: newStaff.status,
        salary: newStaff.salary ? parseFloat(newStaff.salary) : null,
        hireDate: newStaff.hireDate || null,
        specializations: newStaff.specializations,
        experience: newStaff.experience ? parseInt(newStaff.experience) : null,
        rating: newStaff.rating ? parseFloat(newStaff.rating) : null,
        workingHours: newStaff.workingHours,
        notes: newStaff.notes?.trim() || null,
        canLogin: newStaff.canLogin,
        permissions: newStaff.canLogin ? JSON.stringify(newStaff.permissions) : null,
      };

      // Only include username/password if canLogin is true
      if (newStaff.canLogin && newStaff.username?.trim()) {
        staffData.username = newStaff.username.trim();
      }
      if (newStaff.canLogin && newStaff.password?.trim()) {
        staffData.password = newStaff.password.trim();
      }

      const response = await api.post('/api/mobile/staff', staffData);
      if (response.data.success) {
        Alert.alert('Başarılı', 'Personel eklendi');
        setShowAddModal(false);
        resetNewStaffForm();
        fetchStaff();
      } else {
        Alert.alert('Hata', response.data.message || 'Personel eklenemedi');
      }
    } catch (error: any) {
      console.error('Add staff error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format salary
  const formatSalary = (salary: number | null) => {
    if (!salary) return 'Belirtilmemiş';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary);
  };

  // Get experience level
  const getExperienceLevel = (experience: number | null) => {
    if (!experience) return 'Belirtilmemiş';
    if (experience < 1) return 'Yeni Başlayan';
    if (experience < 3) return `${experience} Yıl (Tecrübeli)`;
    if (experience < 5) return `${experience} Yıl (Uzman)`;
    return `${experience} Yıl (Kıdemli)`;
  };

  // Render stars
  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color={i <= rating ? '#F59E0B' : '#D1D5DB'}
        />
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  // Add specialization helper
  const addSpecialization = (isEdit: boolean) => {
    const spec = isEdit ? editSpecialization : newSpecialization;
    if (!spec.trim()) return;

    if (isEdit && editStaff) {
      if (!editStaff.specializations.includes(spec.trim())) {
        setEditStaff({
          ...editStaff,
          specializations: [...editStaff.specializations, spec.trim()],
        });
      }
      setEditSpecialization('');
    } else {
      if (!newStaff.specializations.includes(spec.trim())) {
        setNewStaff({
          ...newStaff,
          specializations: [...newStaff.specializations, spec.trim()],
        });
      }
      setNewSpecialization('');
    }
  };

  // Remove specialization helper
  const removeSpecialization = (spec: string, isEdit: boolean) => {
    if (isEdit && editStaff) {
      setEditStaff({
        ...editStaff,
        specializations: editStaff.specializations.filter((s) => s !== spec),
      });
    } else {
      setNewStaff({
        ...newStaff,
        specializations: newStaff.specializations.filter((s) => s !== spec),
      });
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

  // Render staff card
  const renderStaff = ({ item }: { item: Staff }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;

    return (
      <TouchableOpacity
        style={styles.staffCard}
        onPress={() => {
          setSelectedStaff(item);
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
            <View style={[styles.avatar, { backgroundColor: status.bg }]}>
              <Ionicons name="person" size={24} color={status.text} />
            </View>

            {/* Name & Position */}
            <View style={styles.staffInfo}>
              <Text style={styles.staffName} numberOfLines={1}>
                {item.firstName} {item.lastName}
              </Text>
              <Text style={styles.positionText}>{item.position}</Text>
            </View>

            {/* Status badge */}
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Ionicons name={status.icon as any} size={12} color={status.text} />
              <Text style={[styles.statusBadgeText, { color: status.text }]}>{status.label}</Text>
            </View>
          </View>

          {/* Contact Info */}
          <View style={styles.contactRow}>
            {item.phone && (
              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={12} color="#6B7280" />
                <Text style={styles.contactText}>{item.phone}</Text>
              </View>
            )}
            {item.email && (
              <View style={styles.contactItem}>
                <Ionicons name="mail-outline" size={12} color="#6B7280" />
                <Text style={styles.contactText} numberOfLines={1}>{item.email}</Text>
              </View>
            )}
          </View>

          {/* Bottom Row: Experience + Rating + Actions */}
          <View style={styles.cardBottomRow}>
            <View style={styles.staffStats}>
              <View style={styles.statItem}>
                <Ionicons name="briefcase-outline" size={14} color="#8B5CF6" />
                <Text style={styles.statText}>
                  {item.experience ? `${item.experience} Yıl` : 'Yeni'}
                </Text>
              </View>
              {item.rating && (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.statText}>{item.rating.toFixed(1)}</Text>
                  </View>
                </>
              )}
            </View>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedStaff(item);
                  setShowDetailModal(true);
                  setTimeout(() => startEditMode(), 100);
                }}
              >
                <Ionicons name="create-outline" size={16} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionBtn, styles.deleteCardBtn]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteStaff(item);
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
          ? 'Personel bulunamadı'
          : activeFilter !== 'all'
          ? `${STATUS_CONFIG[activeFilter].label} personel yok`
          : 'Henüz personel yok'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Farklı bir arama terimi deneyin'
          : 'Yeni personel eklemek için + butonuna basın'}
      </Text>
    </View>
  );

  // Close detail modal and reset edit mode
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setIsEditMode(false);
    setEditStaff(null);
  };

  // Render working hours section
  const renderWorkingHours = (hours: any, editable: boolean = false) => {
    if (!hours) return null;

    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
      <View style={styles.workingHoursContainer}>
        {dayOrder.map((day) => {
          const dayData = hours[day];
          if (!dayData) return null;

          return (
            <View key={day} style={styles.workingHourRow}>
              <Text style={styles.dayLabel}>{DAY_LABELS[day]}</Text>
              {editable ? (
                <View style={styles.workingHourEdit}>
                  <Switch
                    value={dayData.isOpen}
                    onValueChange={(value) => {
                      if (editStaff) {
                        setEditStaff({
                          ...editStaff,
                          workingHours: {
                            ...editStaff.workingHours,
                            [day]: { ...dayData, isOpen: value },
                          },
                        });
                      }
                    }}
                    trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
                    thumbColor={dayData.isOpen ? '#059669' : '#9CA3AF'}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                  {dayData.isOpen && (
                    <View style={styles.timeInputsRow}>
                      <TextInput
                        style={styles.timeInput}
                        value={dayData.start}
                        onChangeText={(text) => {
                          if (editStaff) {
                            setEditStaff({
                              ...editStaff,
                              workingHours: {
                                ...editStaff.workingHours,
                                [day]: { ...dayData, start: text },
                              },
                            });
                          }
                        }}
                        placeholder="09:00"
                        placeholderTextColor="#9CA3AF"
                      />
                      <Text style={styles.timeSeparator}>-</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={dayData.end}
                        onChangeText={(text) => {
                          if (editStaff) {
                            setEditStaff({
                              ...editStaff,
                              workingHours: {
                                ...editStaff.workingHours,
                                [day]: { ...dayData, end: text },
                              },
                            });
                          }
                        }}
                        placeholder="18:00"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  )}
                </View>
              ) : (
                <Text style={[styles.dayHours, !dayData.isOpen && styles.dayOff]}>
                  {dayData.isOpen ? `${dayData.start} - ${dayData.end}` : 'Kapalı'}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  // Render detail modal
  const renderDetailModal = () => {
    if (!selectedStaff) return null;
    const status = STATUS_CONFIG[selectedStaff.status] || STATUS_CONFIG.active;

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

              {/* Avatar */}
              <View style={styles.profileIconWrapper}>
                <Ionicons name="person" size={32} color="#fff" />
              </View>

              <Text style={styles.profileName}>
                {selectedStaff.firstName} {selectedStaff.lastName}
              </Text>
              <Text style={styles.profilePosition}>{selectedStaff.position}</Text>
              <View style={[styles.profileStatusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name={status.icon as any} size={14} color="#fff" />
                <Text style={styles.profileStatusText}>{status.label}</Text>
              </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollContent}>
              {isEditMode && editStaff ? (
                // Edit Mode
                <View style={styles.editFormContainer}>
                  {/* Kişisel Bilgiler */}
                  <View style={styles.formSectionCard}>
                    <Text style={styles.formSectionTitle}>Kişisel Bilgiler</Text>

                    <View style={styles.formRow}>
                      <View style={styles.formGroupHalf}>
                        <Text style={styles.formLabel}>Ad *</Text>
                        <TextInput
                          style={styles.formInput}
                          placeholder="Ad"
                          placeholderTextColor="#9CA3AF"
                          value={editStaff.firstName}
                          onChangeText={(text) =>
                            setEditStaff((prev) => prev ? { ...prev, firstName: text } : null)
                          }
                        />
                      </View>
                      <View style={styles.formGroupHalf}>
                        <Text style={styles.formLabel}>Soyad *</Text>
                        <TextInput
                          style={styles.formInput}
                          placeholder="Soyad"
                          placeholderTextColor="#9CA3AF"
                          value={editStaff.lastName}
                          onChangeText={(text) =>
                            setEditStaff((prev) => prev ? { ...prev, lastName: text } : null)
                          }
                        />
                      </View>
                    </View>

                    <View style={styles.formGroupFull}>
                      <Text style={styles.formLabel}>E-posta *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="ornek@mail.com"
                        placeholderTextColor="#9CA3AF"
                        value={editStaff.email}
                        onChangeText={(text) =>
                          setEditStaff((prev) => prev ? { ...prev, email: text } : null)
                        }
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>

                    <View style={styles.formGroupFull}>
                      <Text style={styles.formLabel}>Telefon</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="0555 555 55 55"
                        placeholderTextColor="#9CA3AF"
                        value={editStaff.phone}
                        onChangeText={(text) =>
                          setEditStaff((prev) => prev ? { ...prev, phone: text } : null)
                        }
                        keyboardType="phone-pad"
                      />
                    </View>

                    <View style={styles.formGroupFull}>
                      <Text style={styles.formLabel}>Pozisyon *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Örn: Kuaför, Berber"
                        placeholderTextColor="#9CA3AF"
                        value={editStaff.position}
                        onChangeText={(text) =>
                          setEditStaff((prev) => prev ? { ...prev, position: text } : null)
                        }
                      />
                    </View>
                  </View>

                  {/* Durum */}
                  <View style={styles.formSectionCard}>
                    <Text style={styles.formSectionTitle}>Durum</Text>
                    <View style={styles.statusOptions}>
                      {['active', 'inactive', 'vacation'].map((s) => {
                        const config = STATUS_CONFIG[s];
                        const isSelected = editStaff.status === s;
                        return (
                          <TouchableOpacity
                            key={s}
                            style={[
                              styles.statusOption,
                              isSelected && { backgroundColor: config.bg, borderColor: config.text },
                            ]}
                            onPress={() => setEditStaff((prev) => prev ? { ...prev, status: s } : null)}
                          >
                            <Ionicons name={config.icon as any} size={16} color={isSelected ? config.text : '#9CA3AF'} />
                            <Text style={[styles.statusOptionText, isSelected && { color: config.text }]}>
                              {config.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Profesyonel Bilgiler */}
                  <View style={styles.formSectionCard}>
                    <Text style={styles.formSectionTitle}>Profesyonel Bilgiler</Text>

                    <View style={styles.formGroupFull}>
                      <Text style={styles.formLabel}>Uzmanlık Alanları</Text>
                      <View style={styles.specializationInputRow}>
                        <TextInput
                          style={[styles.formInput, { flex: 1 }]}
                          placeholder="Uzmanlık ekle"
                          placeholderTextColor="#9CA3AF"
                          value={editSpecialization}
                          onChangeText={setEditSpecialization}
                          onSubmitEditing={() => addSpecialization(true)}
                        />
                        <TouchableOpacity
                          style={styles.addSpecBtn}
                          onPress={() => addSpecialization(true)}
                        >
                          <Ionicons name="add" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>
                      {editStaff.specializations.length > 0 && (
                        <View style={styles.specializationTags}>
                          {editStaff.specializations.map((spec, index) => (
                            <View key={index} style={styles.specTag}>
                              <Text style={styles.specTagText}>{spec}</Text>
                              <TouchableOpacity onPress={() => removeSpecialization(spec, true)}>
                                <Ionicons name="close-circle" size={16} color="#6B7280" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={styles.formRow}>
                      <View style={styles.formGroupHalf}>
                        <Text style={styles.formLabel}>Deneyim (Yıl)</Text>
                        <TextInput
                          style={styles.formInput}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          value={editStaff.experience}
                          onChangeText={(text) =>
                            setEditStaff((prev) => prev ? { ...prev, experience: text } : null)
                          }
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.formGroupHalf}>
                        <Text style={styles.formLabel}>Değerlendirme (1-5)</Text>
                        <TextInput
                          style={styles.formInput}
                          placeholder="4"
                          placeholderTextColor="#9CA3AF"
                          value={editStaff.rating}
                          onChangeText={(text) =>
                            setEditStaff((prev) => prev ? { ...prev, rating: text } : null)
                          }
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>
                  </View>

                  {/* İstihdam Bilgileri */}
                  <View style={styles.formSectionCard}>
                    <Text style={styles.formSectionTitle}>İstihdam Bilgileri</Text>

                    <View style={styles.formRow}>
                      <View style={styles.formGroupHalf}>
                        <Text style={styles.formLabel}>İşe Giriş Tarihi</Text>
                        <TextInput
                          style={styles.formInput}
                          placeholder="2024-01-15"
                          placeholderTextColor="#9CA3AF"
                          value={editStaff.hireDate}
                          onChangeText={(text) =>
                            setEditStaff((prev) => prev ? { ...prev, hireDate: text } : null)
                          }
                        />
                      </View>
                      <View style={styles.formGroupHalf}>
                        <Text style={styles.formLabel}>Maaş (₺)</Text>
                        <TextInput
                          style={styles.formInput}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          value={editStaff.salary}
                          onChangeText={(text) =>
                            setEditStaff((prev) => prev ? { ...prev, salary: text } : null)
                          }
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Çalışma Saatleri */}
                  <View style={styles.formSectionCard}>
                    <Text style={styles.formSectionTitle}>Çalışma Saatleri</Text>
                    {renderWorkingHours(editStaff.workingHours, true)}
                  </View>

                  {/* Giriş Yetkisi */}
                  <View style={styles.formSectionCard}>
                    <Text style={styles.formSectionTitle}>Giriş Yetkisi</Text>
                    <View style={styles.switchRow}>
                      <View style={styles.switchInfo}>
                        <Text style={styles.switchLabel}>Sisteme Giriş Yapabilir</Text>
                        <Text style={styles.switchHint}>
                          Personel mobil uygulamaya giriş yapabilir
                        </Text>
                      </View>
                      <Switch
                        value={editStaff.canLogin}
                        onValueChange={(value) =>
                          setEditStaff((prev) => prev ? { ...prev, canLogin: value } : null)
                        }
                        trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
                        thumbColor={editStaff.canLogin ? '#059669' : '#9CA3AF'}
                      />
                    </View>

                    {editStaff.canLogin && (
                      <>
                        <View style={styles.formGroupFull}>
                          <Text style={styles.formLabel}>Kullanıcı Adı</Text>
                          <TextInput
                            style={styles.formInput}
                            placeholder="kullanici_adi"
                            placeholderTextColor="#9CA3AF"
                            value={editStaff.username}
                            onChangeText={(text) =>
                              setEditStaff((prev) => prev ? { ...prev, username: text } : null)
                            }
                            autoCapitalize="none"
                          />
                        </View>
                        <View style={styles.formGroupFull}>
                          <Text style={styles.formLabel}>Şifre (Değiştirmek için doldurun)</Text>
                          <TextInput
                            style={styles.formInput}
                            placeholder="••••••••"
                            placeholderTextColor="#9CA3AF"
                            value={editStaff.password}
                            onChangeText={(text) =>
                              setEditStaff((prev) => prev ? { ...prev, password: text } : null)
                            }
                            secureTextEntry
                          />
                        </View>
                      </>
                    )}
                  </View>

                  {/* Sayfa Yetkileri - only shown when canLogin is true */}
                  {editStaff.canLogin && (
                    <View style={styles.formSectionCard}>
                      <Text style={styles.formSectionTitle}>Sayfa Yetkileri</Text>
                      <Text style={styles.permissionsHint}>
                        Personelin erişebileceği sayfaları ve yapabileceği işlemleri seçin
                      </Text>

                      {PERMISSION_PAGES.map((page) => (
                        <View key={page.key} style={styles.permissionPageRow}>
                          <Text style={styles.permissionPageLabel}>{page.label}</Text>
                          <View style={styles.permissionTypesRow}>
                            {PERMISSION_TYPES.map((type) => {
                              const isChecked = editStaff.permissions[page.key]?.[type.key] || false;
                              return (
                                <TouchableOpacity
                                  key={type.key}
                                  style={[
                                    styles.permissionCheckbox,
                                    isChecked && styles.permissionCheckboxActive,
                                  ]}
                                  onPress={() => {
                                    setEditStaff((prev) => {
                                      if (!prev) return null;
                                      const newPermissions = { ...prev.permissions };
                                      if (!newPermissions[page.key]) {
                                        newPermissions[page.key] = { view: false, create: false, edit: false, delete: false };
                                      }
                                      newPermissions[page.key] = {
                                        ...newPermissions[page.key],
                                        [type.key]: !isChecked,
                                      };
                                      return { ...prev, permissions: newPermissions };
                                    });
                                  }}
                                >
                                  <Ionicons
                                    name={isChecked ? 'checkbox' : 'square-outline'}
                                    size={16}
                                    color={isChecked ? '#3B82F6' : '#9CA3AF'}
                                  />
                                  <Text style={[
                                    styles.permissionTypeLabel,
                                    isChecked && styles.permissionTypeLabelActive,
                                  ]}>
                                    {type.label}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      ))}

                      <View style={styles.permissionInfoBox}>
                        <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                        <Text style={styles.permissionInfoText}>
                          Personel sadece "Görüntüleme" yetkisi olan sayfaları görebilir. Diğer yetkiler sayfa içindeki butonları kontrol eder.
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Notlar */}
                  <View style={styles.formSectionCard}>
                    <Text style={styles.formSectionTitle}>Notlar</Text>
                    <TextInput
                      style={[styles.formInput, styles.formTextarea]}
                      placeholder="Personel hakkında notlar..."
                      placeholderTextColor="#9CA3AF"
                      value={editStaff.notes}
                      onChangeText={(text) =>
                        setEditStaff((prev) => prev ? { ...prev, notes: text } : null)
                      }
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              ) : (
                // View Mode
                <>
                  {/* Stats */}
                  <View style={styles.statsSection}>
                    <View style={styles.statsGrid}>
                      <View style={styles.statBox}>
                        <View style={[styles.statBoxIcon, { backgroundColor: '#F3E8FF' }]}>
                          <Ionicons name="briefcase" size={24} color="#8B5CF6" />
                        </View>
                        <Text style={styles.statBoxValue}>
                          {getExperienceLevel(selectedStaff.experience)}
                        </Text>
                        <Text style={styles.statBoxLabel}>Deneyim</Text>
                      </View>
                      <View style={styles.statBox}>
                        <View style={[styles.statBoxIcon, { backgroundColor: '#FEF3C7' }]}>
                          <Ionicons name="star" size={24} color="#F59E0B" />
                        </View>
                        <Text style={styles.statBoxValue}>
                          {selectedStaff.rating ? selectedStaff.rating.toFixed(1) : '-'}
                        </Text>
                        <Text style={styles.statBoxLabel}>Değerlendirme</Text>
                      </View>
                    </View>
                  </View>

                  {/* Contact Info */}
                  <View style={styles.infoSection}>
                    {selectedStaff.email && (
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                          <Ionicons name="mail" size={18} color="#3B82F6" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.infoLabel}>E-posta</Text>
                          <Text style={styles.infoValue}>{selectedStaff.email}</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {selectedStaff.phone && (
                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                          <Ionicons name="call" size={18} color="#3B82F6" />
                        </View>
                        <View>
                          <Text style={styles.infoLabel}>Telefon</Text>
                          <Text style={styles.infoValue}>{selectedStaff.phone}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Specializations */}
                  {selectedStaff.specializations && selectedStaff.specializations.length > 0 && (
                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                          <Ionicons name="ribbon" size={18} color="#3B82F6" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.infoLabel}>Uzmanlık Alanları</Text>
                          <View style={styles.specializationTags}>
                            {selectedStaff.specializations.map((spec, index) => (
                              <View key={index} style={styles.specTagView}>
                                <Text style={styles.specTagViewText}>{spec}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Salary */}
                  {selectedStaff.salary && (
                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                          <Ionicons name="cash" size={18} color="#3B82F6" />
                        </View>
                        <View>
                          <Text style={styles.infoLabel}>Maaş</Text>
                          <Text style={styles.infoValue}>{formatSalary(selectedStaff.salary)}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Working Hours */}
                  {selectedStaff.workingHours && (
                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                          <Ionicons name="time" size={18} color="#3B82F6" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.infoLabel}>Çalışma Saatleri</Text>
                          {renderWorkingHours(selectedStaff.workingHours)}
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Notes */}
                  {selectedStaff.notes && (
                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                          <Ionicons name="document-text" size={18} color="#3B82F6" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.infoLabel}>Notlar</Text>
                          <Text style={styles.infoValue}>{selectedStaff.notes}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Status Change */}
                  <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                      <View style={styles.infoIconWrapper}>
                        <Ionicons name={status.icon as any} size={18} color={status.text} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.infoLabel}>Durum</Text>
                        <View style={styles.statusChangeRow}>
                          {['active', 'inactive', 'vacation'].map((s) => {
                            const config = STATUS_CONFIG[s];
                            const isCurrentStatus = selectedStaff.status === s;
                            return (
                              <TouchableOpacity
                                key={s}
                                style={[
                                  styles.statusChangeBtn,
                                  isCurrentStatus && { backgroundColor: config.bg, borderColor: config.text },
                                ]}
                                onPress={() => !isCurrentStatus && handleToggleStatus(undefined, s)}
                                disabled={isToggling || isCurrentStatus}
                              >
                                {isToggling && isCurrentStatus ? (
                                  <ActivityIndicator size="small" color={config.text} />
                                ) : (
                                  <>
                                    <Ionicons name={config.icon as any} size={14} color={isCurrentStatus ? config.text : '#9CA3AF'} />
                                    <Text style={[styles.statusChangeBtnText, isCurrentStatus && { color: config.text }]}>
                                      {config.label}
                                    </Text>
                                  </>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              {isEditMode ? (
                <View style={styles.editActionsRow}>
                  <TouchableOpacity
                    style={styles.cancelEditBtn}
                    onPress={() => {
                      setIsEditMode(false);
                      setEditStaff(null);
                    }}
                  >
                    <Text style={styles.cancelEditBtnText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveEditBtn, isSubmitting && styles.submitBtnDisabled]}
                    onPress={handleUpdateStaff}
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
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={startEditMode}
                  >
                    <Ionicons name="create-outline" size={20} color="#163974" />
                    <Text style={styles.editBtnText}>Düzenle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteStaff()}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                        <Text style={styles.deleteBtnText}>Sil</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Render add modal
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
            <Text style={styles.addModalTitle}>Yeni Personel</Text>
            <TouchableOpacity
              style={styles.addModalCloseBtn}
              onPress={() => {
                setShowAddModal(false);
                resetNewStaffForm();
              }}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.addModalScroll}>
            {/* Kişisel Bilgiler */}
            <View style={styles.formSectionCard}>
              <Text style={styles.formSectionTitle}>Kişisel Bilgiler</Text>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Ad *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ad"
                    placeholderTextColor="#9CA3AF"
                    value={newStaff.firstName}
                    onChangeText={(text) =>
                      setNewStaff((prev) => ({ ...prev, firstName: text }))
                    }
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Soyad *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Soyad"
                    placeholderTextColor="#9CA3AF"
                    value={newStaff.lastName}
                    onChangeText={(text) =>
                      setNewStaff((prev) => ({ ...prev, lastName: text }))
                    }
                  />
                </View>
              </View>

              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>E-posta *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="ornek@mail.com"
                  placeholderTextColor="#9CA3AF"
                  value={newStaff.email}
                  onChangeText={(text) =>
                    setNewStaff((prev) => ({ ...prev, email: text }))
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>Telefon</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0555 555 55 55"
                  placeholderTextColor="#9CA3AF"
                  value={newStaff.phone}
                  onChangeText={(text) =>
                    setNewStaff((prev) => ({ ...prev, phone: text }))
                  }
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>Pozisyon *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Örn: Kuaför, Berber"
                  placeholderTextColor="#9CA3AF"
                  value={newStaff.position}
                  onChangeText={(text) =>
                    setNewStaff((prev) => ({ ...prev, position: text }))
                  }
                />
              </View>
            </View>

            {/* Profesyonel Bilgiler */}
            <View style={styles.formSectionCard}>
              <Text style={styles.formSectionTitle}>Profesyonel Bilgiler</Text>

              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>Uzmanlık Alanları</Text>
                <View style={styles.specializationInputRow}>
                  <TextInput
                    style={[styles.formInput, { flex: 1 }]}
                    placeholder="Uzmanlık ekle"
                    placeholderTextColor="#9CA3AF"
                    value={newSpecialization}
                    onChangeText={setNewSpecialization}
                    onSubmitEditing={() => addSpecialization(false)}
                  />
                  <TouchableOpacity
                    style={styles.addSpecBtn}
                    onPress={() => addSpecialization(false)}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                {newStaff.specializations.length > 0 && (
                  <View style={styles.specializationTags}>
                    {newStaff.specializations.map((spec, index) => (
                      <View key={index} style={styles.specTag}>
                        <Text style={styles.specTagText}>{spec}</Text>
                        <TouchableOpacity onPress={() => removeSpecialization(spec, false)}>
                          <Ionicons name="close-circle" size={16} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Deneyim (Yıl)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    value={newStaff.experience}
                    onChangeText={(text) =>
                      setNewStaff((prev) => ({ ...prev, experience: text }))
                    }
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Maaş (₺)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    value={newStaff.salary}
                    onChangeText={(text) =>
                      setNewStaff((prev) => ({ ...prev, salary: text }))
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Giriş Yetkisi */}
            <View style={styles.formSectionCard}>
              <Text style={styles.formSectionTitle}>Giriş Yetkisi</Text>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Sisteme Giriş Yapabilir</Text>
                  <Text style={styles.switchHint}>
                    Personel mobil uygulamaya giriş yapabilir
                  </Text>
                </View>
                <Switch
                  value={newStaff.canLogin}
                  onValueChange={(value) =>
                    setNewStaff((prev) => ({ ...prev, canLogin: value }))
                  }
                  trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
                  thumbColor={newStaff.canLogin ? '#059669' : '#9CA3AF'}
                />
              </View>

              {newStaff.canLogin && (
                <>
                  <View style={styles.formGroupFull}>
                    <Text style={styles.formLabel}>Kullanıcı Adı</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="kullanici_adi"
                      placeholderTextColor="#9CA3AF"
                      value={newStaff.username}
                      onChangeText={(text) =>
                        setNewStaff((prev) => ({ ...prev, username: text }))
                      }
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.formGroupFull}>
                    <Text style={styles.formLabel}>Şifre</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="••••••••"
                      placeholderTextColor="#9CA3AF"
                      value={newStaff.password}
                      onChangeText={(text) =>
                        setNewStaff((prev) => ({ ...prev, password: text }))
                      }
                      secureTextEntry
                    />
                  </View>
                </>
              )}
            </View>

            {/* Sayfa Yetkileri - only shown when canLogin is true */}
            {newStaff.canLogin && (
              <View style={styles.formSectionCard}>
                <Text style={styles.formSectionTitle}>Sayfa Yetkileri</Text>
                <Text style={styles.permissionsHint}>
                  Personelin erişebileceği sayfaları ve yapabileceği işlemleri seçin
                </Text>

                {PERMISSION_PAGES.map((page) => (
                  <View key={page.key} style={styles.permissionPageRow}>
                    <Text style={styles.permissionPageLabel}>{page.label}</Text>
                    <View style={styles.permissionTypesRow}>
                      {PERMISSION_TYPES.map((type) => {
                        const isChecked = newStaff.permissions[page.key]?.[type.key] || false;
                        return (
                          <TouchableOpacity
                            key={type.key}
                            style={[
                              styles.permissionCheckbox,
                              isChecked && styles.permissionCheckboxActive,
                            ]}
                            onPress={() => {
                              setNewStaff((prev) => {
                                const newPermissions = { ...prev.permissions };
                                if (!newPermissions[page.key]) {
                                  newPermissions[page.key] = { view: false, create: false, edit: false, delete: false };
                                }
                                newPermissions[page.key] = {
                                  ...newPermissions[page.key],
                                  [type.key]: !isChecked,
                                };
                                return { ...prev, permissions: newPermissions };
                              });
                            }}
                          >
                            <Ionicons
                              name={isChecked ? 'checkbox' : 'square-outline'}
                              size={16}
                              color={isChecked ? '#3B82F6' : '#9CA3AF'}
                            />
                            <Text style={[
                              styles.permissionTypeLabel,
                              isChecked && styles.permissionTypeLabelActive,
                            ]}>
                              {type.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}

                <View style={styles.permissionInfoBox}>
                  <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                  <Text style={styles.permissionInfoText}>
                    Personel sadece "Görüntüleme" yetkisi olan sayfaları görebilir. Diğer yetkiler sayfa içindeki butonları kontrol eder.
                  </Text>
                </View>
              </View>
            )}

            {/* Notlar */}
            <View style={styles.formSectionCard}>
              <Text style={styles.formSectionTitle}>Notlar</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                placeholder="Personel hakkında notlar..."
                placeholderTextColor="#9CA3AF"
                value={newStaff.notes}
                onChangeText={(text) =>
                  setNewStaff((prev) => ({ ...prev, notes: text }))
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Bilgilendirme */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardText}>• Ad, soyad, e-posta ve pozisyon zorunlu alanlardır</Text>
                <Text style={styles.infoCardText}>• Çalışma saatleri daha sonra düzenlenebilir</Text>
                <Text style={styles.infoCardText}>• Giriş yetkisi verdiyseniz kullanıcı adı ve şifre girin</Text>
              </View>
            </View>
          </ScrollView>

          {/* Submit button */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleAddStaff}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="person-add" size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>Personel Ekle</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <PermissionGuard permissionKey="staff" pageName="Personel">
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Header
        title="Personel"
        subtitle={`${staff.length} personel kayıtlı`}
        onMenuPress={() => setDrawerOpen(true)}
        showSearch
        searchActive={showSearch}
        onSearchPress={() => setShowSearch(!showSearch)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="İsim, e-posta veya pozisyon ara..."
        gradientColors={['#163974', '#1e4a8f']}
        stats={[
          {
            icon: 'people-circle',
            iconColor: '#06B6D4',
            iconBg: '#ECFEFF',
            value: statusCounts.all,
            label: 'Toplam',
          },
          {
            icon: 'checkmark-circle',
            iconColor: '#059669',
            iconBg: '#D1FAE5',
            value: statusCounts.active,
            label: 'Aktif',
          },
          {
            icon: 'pause-circle',
            iconColor: '#DC2626',
            iconBg: '#FEE2E2',
            value: statusCounts.inactive,
            label: 'Pasif',
          },
          {
            icon: 'sunny',
            iconColor: '#D97706',
            iconBg: '#FEF3C7',
            value: statusCounts.vacation,
            label: 'İzinli',
          },
        ]}
      />

      {/* Filter tabs */}
      <View style={styles.filterTabs}>{renderFilterTabs()}</View>

      {/* Staff list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#163974" />
          <Text style={styles.loadingText}>Personel yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStaff}
          renderItem={renderStaff}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchStaff(true)}
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
    </PermissionGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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

  // Staff card
  staffCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
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
  cardContent: {
    flex: 1,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffInfo: {
    flex: 1,
    marginLeft: 12,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  positionText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  staffStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 6,
  },
  quickActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCardBtn: {
    backgroundColor: '#FEE2E2',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
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
    shadowColor: '#163974',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
  profileIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  profilePosition: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
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

  // Stats section
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statBoxIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statBoxValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Info section
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
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },

  // Working hours
  workingHoursContainer: {
    marginTop: 8,
  },
  workingHourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayLabel: {
    fontSize: 13,
    color: '#374151',
    width: 80,
  },
  dayHours: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  dayOff: {
    color: '#9CA3AF',
  },
  workingHourEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    gap: 8,
  },
  timeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    color: '#1F2937',
    width: 55,
    textAlign: 'center',
  },
  timeSeparator: {
    color: '#6B7280',
  },

  // Status change
  statusChangeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  statusChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  statusChangeBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Specialization tags
  specializationTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  specTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  specTagText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  specTagView: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specTagViewText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  specializationInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addSpecBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#163974',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal actions
  modalActions: {
    padding: 20,
    paddingTop: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
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
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
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

  // Add modal
  addModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
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

  // Form styles
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
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupFull: {
    marginBottom: 16,
  },
  formGroupHalf: {
    flex: 1,
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
    minHeight: 100,
    paddingTop: 14,
  },
  editFormContainer: {
    paddingBottom: 20,
  },

  // Status options
  statusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Switch row
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
    marginBottom: 16,
  },
  switchInfo: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  switchHint: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  // Info card
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

  // Permissions styles
  permissionsHint: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  permissionPageRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  permissionPageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  permissionTypesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  permissionCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 6,
  },
  permissionCheckboxActive: {
    backgroundColor: '#E0E7FF',
    borderColor: '#6366F1',
  },
  permissionTypeLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  permissionTypeLabelActive: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  permissionInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  permissionInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },

  // Submit button
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
});
