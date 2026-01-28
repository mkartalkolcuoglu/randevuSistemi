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

// Service interface
interface Service {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  category: string | null;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Status configuration
const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: string; gradient: [string, string] }> = {
  all: { bg: '#F3F4F6', text: '#374151', label: 'Tümü', icon: 'apps', gradient: ['#6B7280', '#4B5563'] },
  active: { bg: '#D1FAE5', text: '#059669', label: 'Aktif', icon: 'checkmark-circle', gradient: ['#10B981', '#059669'] },
  inactive: { bg: '#FEE2E2', text: '#DC2626', label: 'Pasif', icon: 'pause-circle', gradient: ['#EF4444', '#DC2626'] },
};

const FILTER_TABS = ['all', 'active', 'inactive'];


export default function StaffServicesScreen() {
  // State
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // New service form state
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    isActive: true,
  });

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editService, setEditService] = useState<typeof newService | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Fetch services
  const fetchServices = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await api.get('/api/mobile/services?includeInactive=true');
      setServices(response.data.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchServices();
    }, [])
  );

  // Filter and search services
  const filteredServices = useMemo(() => {
    let result = [...services];

    // Apply status filter
    if (activeFilter !== 'all') {
      result = result.filter((s) => s.status === activeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((service) => {
        return (
          service.name.toLowerCase().includes(query) ||
          service.description?.toLowerCase().includes(query) ||
          service.category?.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [services, activeFilter, searchQuery]);

  // Get service counts by status
  const statusCounts = useMemo(() => {
    return {
      all: services.length,
      active: services.filter((s) => s.status === 'active').length,
      inactive: services.filter((s) => s.status === 'inactive').length,
    };
  }, [services]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = services
      .map((s) => s.category)
      .filter((c): c is string => c !== null && c !== '');
    return [...new Set(cats)];
  }, [services]);

  // Reset form helper
  const resetNewServiceForm = () => {
    setNewService({
      name: '',
      description: '',
      price: '',
      duration: '',
      category: '',
      isActive: true,
    });
  };

  // Start edit mode
  const startEditMode = () => {
    if (!selectedService) return;
    setEditService({
      name: selectedService.name || '',
      description: selectedService.description || '',
      price: selectedService.price?.toString() || '',
      duration: selectedService.duration?.toString() || '',
      category: selectedService.category || '',
      isActive: selectedService.status === 'active',
    });
    setIsEditMode(true);
  };

  // Handle update service
  const handleUpdateService = async () => {
    if (!selectedService || !editService) return;
    if (!editService.name.trim() || !editService.price || !editService.duration) {
      Alert.alert('Hata', 'Hizmet adı, fiyat ve süre zorunludur');
      return;
    }

    const price = parseFloat(editService.price);
    if (isNaN(price) || price < 0) {
      Alert.alert('Hata', 'Geçersiz fiyat değeri');
      return;
    }

    const duration = parseInt(editService.duration);
    if (isNaN(duration) || duration < 5) {
      Alert.alert('Hata', 'Süre en az 5 dakika olmalıdır');
      return;
    }

    setIsSubmitting(true);
    try {
      const serviceData = {
        name: editService.name.trim(),
        description: editService.description?.trim() || null,
        price,
        duration,
        category: editService.category?.trim() || null,
        isActive: editService.isActive,
      };

      const response = await api.put(`/api/mobile/services/${selectedService.id}`, serviceData);
      if (response.data.success) {
        Alert.alert('Başarılı', 'Hizmet güncellendi');
        setIsEditMode(false);
        setShowDetailModal(false);
        fetchServices();
      } else {
        Alert.alert('Hata', response.data.message || 'Hizmet güncellenemedi');
      }
    } catch (error: any) {
      console.error('Update service error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggle service status
  const handleToggleStatus = async (service?: Service) => {
    const targetService = service || selectedService;
    if (!targetService) return;

    setIsToggling(true);
    try {
      const response = await api.patch(`/api/mobile/services/${targetService.id}`);
      if (response.data.success) {
        fetchServices();
        if (selectedService && selectedService.id === targetService.id) {
          setSelectedService({
            ...selectedService,
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

  // Handle delete service
  const handleDeleteService = (service?: Service) => {
    const serviceToDelete = service || selectedService;
    if (!serviceToDelete) return;

    Alert.alert(
      'Hizmeti Sil',
      `"${serviceToDelete.name}" hizmetini silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const response = await api.delete(`/api/mobile/services/${serviceToDelete.id}`);
              if (response.data.success) {
                Alert.alert('Başarılı', 'Hizmet silindi');
                setShowDetailModal(false);
                fetchServices();
              } else {
                Alert.alert('Hata', response.data.message || 'Hizmet silinemedi');
              }
            } catch (error: any) {
              console.error('Delete service error:', error);
              Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Handle add service
  const handleAddService = async () => {
    if (!newService.name.trim() || !newService.price || !newService.duration) {
      Alert.alert('Hata', 'Hizmet adı, fiyat ve süre zorunludur');
      return;
    }

    const price = parseFloat(newService.price);
    if (isNaN(price) || price < 0) {
      Alert.alert('Hata', 'Geçersiz fiyat değeri');
      return;
    }

    const duration = parseInt(newService.duration);
    if (isNaN(duration) || duration < 5) {
      Alert.alert('Hata', 'Süre en az 5 dakika olmalıdır');
      return;
    }

    setIsSubmitting(true);
    try {
      const serviceData = {
        name: newService.name.trim(),
        description: newService.description?.trim() || null,
        price,
        duration,
        category: newService.category?.trim() || null,
        isActive: newService.isActive,
      };

      const response = await api.post('/api/mobile/services', serviceData);
      if (response.data.success) {
        Alert.alert('Başarılı', 'Hizmet eklendi');
        setShowAddModal(false);
        resetNewServiceForm();
        fetchServices();
      } else {
        Alert.alert('Hata', response.data.message || 'Hizmet eklenemedi');
      }
    } catch (error: any) {
      console.error('Add service error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} dk`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} saat`;
    return `${hours} saat ${mins} dk`;
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

  // Render service card
  const renderService = ({ item }: { item: Service }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;

    return (
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={() => {
          setSelectedService(item);
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
          {/* Top Row: Name + Status */}
          <View style={styles.cardTopRow}>
            {/* Service icon */}
            <View style={[styles.serviceIcon, { backgroundColor: status.bg }]}>
              <Ionicons name="cut" size={20} color={status.text} />
            </View>

            {/* Name & Category */}
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.category && (
                <View style={styles.categoryRow}>
                  <Ionicons name="folder-outline" size={12} color="#9CA3AF" />
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              )}
            </View>

            {/* Status toggle */}
            <TouchableOpacity
              style={[styles.statusToggle, item.isActive && styles.statusToggleActive]}
              onPress={(e) => {
                e.stopPropagation();
                handleToggleStatus(item);
              }}
              disabled={isToggling}
            >
              <Ionicons
                name={item.isActive ? 'checkmark-circle' : 'close-circle'}
                size={22}
                color={item.isActive ? '#059669' : '#DC2626'}
              />
            </TouchableOpacity>
          </View>

          {/* Bottom Row: Price + Duration + Actions */}
          <View style={styles.cardBottomRow}>
            <View style={styles.serviceStats}>
              <View style={styles.statItem}>
                <Ionicons name="cash-outline" size={14} color="#3B82F6" />
                <Text style={styles.statText}>{formatPrice(item.price)}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={14} color="#8B5CF6" />
                <Text style={styles.statText}>{formatDuration(item.duration)}</Text>
              </View>
            </View>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedService(item);
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
                  handleDeleteService(item);
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
        <Ionicons name="cut-outline" size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery
          ? 'Hizmet bulunamadı'
          : activeFilter !== 'all'
          ? `${STATUS_CONFIG[activeFilter].label} hizmet yok`
          : 'Henüz hizmet yok'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Farklı bir arama terimi deneyin'
          : 'Yeni hizmet eklemek için + butonuna basın'}
      </Text>
    </View>
  );

  // Close detail modal and reset edit mode
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setIsEditMode(false);
    setEditService(null);
  };

  // Render detail modal
  const renderDetailModal = () => {
    if (!selectedService) return null;
    const status = STATUS_CONFIG[selectedService.status] || STATUS_CONFIG.active;

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

              {/* Service Icon */}
              <View style={styles.profileIconWrapper}>
                <Ionicons name="cut" size={32} color="#fff" />
              </View>

              <Text style={styles.profileName}>{selectedService.name}</Text>
              <View style={[styles.profileStatusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name={status.icon as any} size={14} color="#fff" />
                <Text style={styles.profileStatusText}>{status.label}</Text>
              </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollContent}>
              {isEditMode && editService ? (
                // Edit Mode
                <View style={styles.editFormContainer}>
                  {/* Hizmet Bilgileri */}
                  <View style={styles.formSectionCard}>
                    <Text style={styles.formSectionTitle}>Hizmet Bilgileri</Text>

                    <View style={styles.formGroupFull}>
                      <Text style={styles.formLabel}>Hizmet Adı *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Hizmet adı"
                        placeholderTextColor="#9CA3AF"
                        value={editService.name}
                        onChangeText={(text) =>
                          setEditService((prev) => prev ? { ...prev, name: text } : null)
                        }
                      />
                    </View>

                    <View style={styles.formGroupFull}>
                      <Text style={styles.formLabel}>Kategori</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Örn: Saç Bakımı, Cilt Bakımı"
                        placeholderTextColor="#9CA3AF"
                        value={editService.category}
                        onChangeText={(text) =>
                          setEditService((prev) => prev ? { ...prev, category: text } : null)
                        }
                      />
                    </View>

                    <View style={styles.formGroupFull}>
                      <Text style={styles.formLabel}>Fiyat (₺) *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="0"
                        placeholderTextColor="#9CA3AF"
                        value={editService.price}
                        onChangeText={(text) =>
                          setEditService((prev) => prev ? { ...prev, price: text } : null)
                        }
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.formGroupFull}>
                      <Text style={styles.formLabel}>Süre (Dakika) *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="60"
                        placeholderTextColor="#9CA3AF"
                        value={editService.duration}
                        onChangeText={(text) =>
                          setEditService((prev) => prev ? { ...prev, duration: text } : null)
                        }
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.formGroupFull}>
                      <Text style={styles.formLabel}>Açıklama</Text>
                      <TextInput
                        style={[styles.formInput, styles.formTextarea]}
                        placeholder="Hizmet hakkında açıklama..."
                        placeholderTextColor="#9CA3AF"
                        value={editService.description}
                        onChangeText={(text) =>
                          setEditService((prev) => prev ? { ...prev, description: text } : null)
                        }
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                    </View>
                  </View>

                  {/* Durum */}
                  <View style={styles.formSectionCard}>
                    <Text style={styles.formSectionTitle}>Hizmet Durumu</Text>
                    <View style={styles.switchRow}>
                      <View style={styles.switchInfo}>
                        <Text style={styles.switchLabel}>Hizmet Aktif</Text>
                        <Text style={styles.switchHint}>
                          Pasif hizmetler randevu oluştururken görünmez
                        </Text>
                      </View>
                      <Switch
                        value={editService.isActive}
                        onValueChange={(value) =>
                          setEditService((prev) => prev ? { ...prev, isActive: value } : null)
                        }
                        trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
                        thumbColor={editService.isActive ? '#059669' : '#9CA3AF'}
                      />
                    </View>
                  </View>
                </View>
              ) : (
                // View Mode
                <>
                  {/* Stats */}
                  <View style={styles.statsSection}>
                    <View style={styles.statsGrid}>
                      <View style={styles.statBox}>
                        <View style={[styles.statBoxIcon, { backgroundColor: '#EFF6FF' }]}>
                          <Ionicons name="cash" size={24} color="#3B82F6" />
                        </View>
                        <Text style={styles.statBoxValue}>{formatPrice(selectedService.price)}</Text>
                        <Text style={styles.statBoxLabel}>Fiyat</Text>
                      </View>
                      <View style={styles.statBox}>
                        <View style={[styles.statBoxIcon, { backgroundColor: '#F3E8FF' }]}>
                          <Ionicons name="time" size={24} color="#8B5CF6" />
                        </View>
                        <Text style={styles.statBoxValue}>{formatDuration(selectedService.duration)}</Text>
                        <Text style={styles.statBoxLabel}>Süre</Text>
                      </View>
                    </View>
                  </View>

                  {/* Category */}
                  {selectedService.category && (
                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                          <Ionicons name="folder" size={18} color="#3B82F6" />
                        </View>
                        <View>
                          <Text style={styles.infoLabel}>Kategori</Text>
                          <Text style={styles.infoValue}>{selectedService.category}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Description */}
                  {selectedService.description && (
                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                          <Ionicons name="document-text" size={18} color="#3B82F6" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.infoLabel}>Açıklama</Text>
                          <Text style={styles.infoValue}>{selectedService.description}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Status */}
                  <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                      <View style={styles.infoIconWrapper}>
                        <Ionicons name={status.icon as any} size={18} color={status.text} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.infoLabel}>Durum</Text>
                        <View style={styles.statusInfoRow}>
                          <View style={[styles.statusInfoBadge, { backgroundColor: status.bg }]}>
                            <Text style={[styles.statusInfoText, { color: status.text }]}>
                              {status.label}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.toggleStatusBtn}
                            onPress={() => handleToggleStatus()}
                            disabled={isToggling}
                          >
                            {isToggling ? (
                              <ActivityIndicator size="small" color="#3B82F6" />
                            ) : (
                              <Text style={styles.toggleStatusBtnText}>
                                {selectedService.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                              </Text>
                            )}
                          </TouchableOpacity>
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
                      setEditService(null);
                    }}
                  >
                    <Text style={styles.cancelEditBtnText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveEditBtn, isSubmitting && styles.submitBtnDisabled]}
                    onPress={handleUpdateService}
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
                    onPress={() => handleDeleteService()}
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
            <Text style={styles.addModalTitle}>Yeni Hizmet</Text>
            <TouchableOpacity
              style={styles.addModalCloseBtn}
              onPress={() => {
                setShowAddModal(false);
                resetNewServiceForm();
              }}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.addModalScroll}>
            {/* Hizmet Bilgileri */}
            <View style={styles.formSectionCard}>
              <Text style={styles.formSectionTitle}>Hizmet Bilgileri</Text>

              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>Hizmet Adı *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Hizmet adı"
                  placeholderTextColor="#9CA3AF"
                  value={newService.name}
                  onChangeText={(text) =>
                    setNewService((prev) => ({ ...prev, name: text }))
                  }
                />
              </View>

              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>Kategori</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Örn: Saç Bakımı, Cilt Bakımı"
                  placeholderTextColor="#9CA3AF"
                  value={newService.category}
                  onChangeText={(text) =>
                    setNewService((prev) => ({ ...prev, category: text }))
                  }
                />
                {categories.length > 0 && (
                  <View style={styles.categorySuggestions}>
                    <Text style={styles.categorySuggestionsTitle}>Mevcut kategoriler:</Text>
                    <View style={styles.categorySuggestionsList}>
                      {categories.slice(0, 5).map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={styles.categorySuggestionChip}
                          onPress={() => setNewService((prev) => ({ ...prev, category: cat }))}
                        >
                          <Text style={styles.categorySuggestionText}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>Fiyat (₺) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={newService.price}
                  onChangeText={(text) =>
                    setNewService((prev) => ({ ...prev, price: text }))
                  }
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>Süre (Dakika) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="60"
                  placeholderTextColor="#9CA3AF"
                  value={newService.duration}
                  onChangeText={(text) =>
                    setNewService((prev) => ({ ...prev, duration: text }))
                  }
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>Açıklama</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea]}
                  placeholder="Hizmet hakkında açıklama..."
                  placeholderTextColor="#9CA3AF"
                  value={newService.description}
                  onChangeText={(text) =>
                    setNewService((prev) => ({ ...prev, description: text }))
                  }
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Durum */}
            <View style={styles.formSectionCard}>
              <Text style={styles.formSectionTitle}>Hizmet Durumu</Text>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Hizmet Aktif</Text>
                  <Text style={styles.switchHint}>
                    Pasif hizmetler randevu oluştururken görünmez
                  </Text>
                </View>
                <Switch
                  value={newService.isActive}
                  onValueChange={(value) =>
                    setNewService((prev) => ({ ...prev, isActive: value }))
                  }
                  trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
                  thumbColor={newService.isActive ? '#059669' : '#9CA3AF'}
                />
              </View>
            </View>

            {/* Bilgilendirme */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardText}>• Hizmet adı ve fiyat zorunlu alanlardır</Text>
                <Text style={styles.infoCardText}>• Kategori, hizmetleri gruplamak için kullanılır</Text>
                <Text style={styles.infoCardText}>• Süre, randevu oluştururken kullanılır</Text>
              </View>
            </View>
          </ScrollView>

          {/* Submit button */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleAddService}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>Hizmet Ekle</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <PermissionGuard permissionKey="services" pageName="Hizmetler">
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <Header
        title="Hizmetler"
        subtitle={`${services.length} hizmet kayıtlı`}
        onMenuPress={() => setDrawerOpen(true)}
        showSearch
        searchActive={showSearch}
        onSearchPress={() => setShowSearch(!showSearch)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Hizmet adı veya kategori ara..."
        gradientColors={['#163974', '#1e4a8f']}
        stats={[
          {
            icon: 'cut',
            iconColor: '#EC4899',
            iconBg: '#FCE7F3',
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
        ]}
      />

      {/* Filter tabs */}
      <View style={styles.filterTabs}>{renderFilterTabs()}</View>

      {/* Service list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#163974" />
          <Text style={styles.loadingText}>Hizmetler yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          renderItem={renderService}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchServices(true)}
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
          <Ionicons name="add" size={28} color="#fff" />
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

  // Service card
  serviceCard: {
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
  cardContent: {
    flex: 1,
    padding: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusToggleActive: {
    backgroundColor: '#D1FAE5',
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
  serviceStats: {
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
    marginBottom: 8,
    textAlign: 'center',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
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
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  statusInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusInfoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusInfoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleStatusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  toggleStatusBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3B82F6',
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
    minHeight: 100,
    paddingTop: 14,
  },
  editFormContainer: {
    paddingBottom: 20,
  },

  // Switch row
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
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

  // Category suggestions
  categorySuggestions: {
    marginTop: 8,
  },
  categorySuggestionsTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  categorySuggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categorySuggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  categorySuggestionText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
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
