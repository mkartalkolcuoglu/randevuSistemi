import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  isActive: boolean;
  categoryId?: string;
  categoryName?: string;
}

interface Category {
  id: string;
  name: string;
  services: Service[];
}

export default function ServicesScreen() {
  const router = useRouter();

  // State
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New service form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '30',
    isActive: true,
  });

  // Fetch services
  const fetchServices = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await api.get('/api/mobile/services');
      setServices(response.data.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      // Mock data for development
      setServices([
        { id: '1', name: 'Saç Kesimi', description: 'Erkek saç kesimi', price: 150, duration: 30, isActive: true },
        { id: '2', name: 'Sakal Traşı', description: 'Sakal düzeltme ve traş', price: 80, duration: 20, isActive: true },
        { id: '3', name: 'Saç + Sakal', description: 'Komple bakım', price: 200, duration: 45, isActive: true },
        { id: '4', name: 'Saç Boyama', description: 'Tek renk boya', price: 300, duration: 60, isActive: true },
        { id: '5', name: 'Keratin Bakım', description: 'Saç bakımı', price: 500, duration: 90, isActive: false },
      ]);
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

  // Filter services
  const filteredServices = services.filter((service) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      service.name.toLowerCase().includes(query) ||
      service.description?.toLowerCase().includes(query)
    );
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('tr-TR') + ' ₺';
  };

  // Handle add service
  const handleAddService = async () => {
    if (!formData.name.trim() || !formData.price) {
      Alert.alert('Hata', 'Hizmet adı ve fiyat zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      const newService: Service = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        isActive: formData.isActive,
      };

      // In production, this would be an API call
      setServices((prev) => [...prev, newService]);
      setShowAddModal(false);
      resetForm();
      Alert.alert('Başarılı', 'Hizmet eklendi');
    } catch (error) {
      Alert.alert('Hata', 'Hizmet eklenemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit service
  const handleEditService = async () => {
    if (!selectedService) return;
    if (!formData.name.trim() || !formData.price) {
      Alert.alert('Hata', 'Hizmet adı ve fiyat zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedService: Service = {
        ...selectedService,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        isActive: formData.isActive,
      };

      setServices((prev) =>
        prev.map((s) => (s.id === selectedService.id ? updatedService : s))
      );
      setShowEditModal(false);
      setSelectedService(null);
      resetForm();
      Alert.alert('Başarılı', 'Hizmet güncellendi');
    } catch (error) {
      Alert.alert('Hata', 'Hizmet güncellenemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete service
  const handleDeleteService = () => {
    if (!selectedService) return;

    Alert.alert(
      'Hizmeti Sil',
      `"${selectedService.name}" hizmetini silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            setServices((prev) => prev.filter((s) => s.id !== selectedService.id));
            setShowEditModal(false);
            setSelectedService(null);
            Alert.alert('Başarılı', 'Hizmet silindi');
          },
        },
      ]
    );
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '30',
      isActive: true,
    });
  };

  // Open edit modal
  const openEditModal = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration: service.duration.toString(),
      isActive: service.isActive,
    });
    setShowEditModal(true);
  };

  // Render service card
  const renderService = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => openEditModal(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.serviceIcon, !item.isActive && styles.serviceIconInactive]}>
        <Ionicons
          name="cut"
          size={20}
          color={item.isActive ? '#3B82F6' : '#9CA3AF'}
        />
      </View>
      <View style={styles.serviceInfo}>
        <View style={styles.serviceHeader}>
          <Text style={[styles.serviceName, !item.isActive && styles.serviceNameInactive]}>
            {item.name}
          </Text>
          <View style={[styles.statusBadge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={[styles.statusText, item.isActive ? styles.activeText : styles.inactiveText]}>
              {item.isActive ? 'Aktif' : 'Pasif'}
            </Text>
          </View>
        </View>
        {item.description && (
          <Text style={styles.serviceDescription} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <View style={styles.serviceDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{item.duration} dk</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={14} color="#059669" />
            <Text style={[styles.detailText, { color: '#059669', fontWeight: '600' }]}>
              {formatCurrency(item.price)}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );

  // Render form modal
  const renderFormModal = (isEdit: boolean) => (
    <Modal
      visible={isEdit ? showEditModal : showAddModal}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (isEdit) {
          setShowEditModal(false);
          setSelectedService(null);
        } else {
          setShowAddModal(false);
        }
        resetForm();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEdit ? 'Hizmeti Düzenle' : 'Yeni Hizmet'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                if (isEdit) {
                  setShowEditModal(false);
                  setSelectedService(null);
                } else {
                  setShowAddModal(false);
                }
                resetForm();
              }}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Service name */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Hizmet Adı *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ör: Saç Kesimi"
                placeholderTextColor="#9CA3AF"
                value={formData.name}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
              />
            </View>

            {/* Description */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Açıklama</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                placeholder="Hizmet açıklaması..."
                placeholderTextColor="#9CA3AF"
                value={formData.description}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Price and Duration */}
            <View style={styles.formRow}>
              <View style={[styles.formSection, { flex: 1 }]}>
                <Text style={styles.formLabel}>Fiyat *</Text>
                <View style={styles.priceInputWrapper}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    value={formData.price}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, price: text.replace(/[^0-9]/g, '') }))
                    }
                    keyboardType="numeric"
                  />
                  <Text style={styles.currencyLabel}>₺</Text>
                </View>
              </View>
              <View style={[styles.formSection, { flex: 1 }]}>
                <Text style={styles.formLabel}>Süre</Text>
                <View style={styles.durationInputWrapper}>
                  <TextInput
                    style={styles.durationInput}
                    placeholder="30"
                    placeholderTextColor="#9CA3AF"
                    value={formData.duration}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, duration: text.replace(/[^0-9]/g, '') }))
                    }
                    keyboardType="numeric"
                  />
                  <Text style={styles.durationLabel}>dk</Text>
                </View>
              </View>
            </View>

            {/* Active toggle */}
            <View style={styles.formSection}>
              <View style={styles.toggleRow}>
                <View>
                  <Text style={styles.formLabel}>Aktif</Text>
                  <Text style={styles.toggleDescription}>
                    Pasif hizmetler randevu oluştururken görünmez
                  </Text>
                </View>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, isActive: value }))}
                  trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                  thumbColor={formData.isActive ? '#3B82F6' : '#fff'}
                />
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.modalActions}>
            {isEdit && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteService}>
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
                <Text style={styles.deleteBtnText}>Sil</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled, isEdit && { flex: 1 }]}
              onPress={isEdit ? handleEditService : handleAddService}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name={isEdit ? 'checkmark' : 'add'} size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>
                    {isEdit ? 'Kaydet' : 'Hizmet Ekle'}
                  </Text>
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Hizmetler</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Hizmet ara..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{services.length}</Text>
          <Text style={styles.statLabel}>Toplam</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#059669' }]}>
            {services.filter((s) => s.isActive).length}
          </Text>
          <Text style={styles.statLabel}>Aktif</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#DC2626' }]}>
            {services.filter((s) => !s.isActive).length}
          </Text>
          <Text style={styles.statLabel}>Pasif</Text>
        </View>
      </View>

      {/* Services list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
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
              tintColor="#3B82F6"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrapper}>
                <Ionicons name="cut-outline" size={48} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Hizmet bulunamadı' : 'Henüz hizmet yok'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Farklı bir arama deneyin'
                  : 'Yeni hizmet eklemek için + butonuna basın'}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modals */}
      {renderFormModal(false)}
      {renderFormModal(true)}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Search
  searchContainer: {
    padding: 16,
    paddingBottom: 0,
    backgroundColor: '#fff',
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

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
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
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceIconInactive: {
    backgroundColor: '#F3F4F6',
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  serviceNameInactive: {
    color: '#9CA3AF',
  },
  serviceDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  serviceDetails: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  inactiveBadge: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeText: {
    color: '#059669',
  },
  inactiveText: {
    color: '#6B7280',
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
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
  formSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
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
    minHeight: 80,
    paddingTop: 14,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  priceInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    paddingVertical: 14,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  durationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  durationInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    paddingVertical: 14,
  },
  durationLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 12,
    gap: 12,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    gap: 6,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  submitBtn: {
    flex: 1,
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
