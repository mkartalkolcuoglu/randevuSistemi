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

interface Package {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice: number;
  sessions: number;
  validityDays: number;
  isActive: boolean;
  services: string[];
}

export default function PackagesScreen() {
  const router = useRouter();

  // State
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    sessions: '5',
    validityDays: '30',
    isActive: true,
  });

  // Fetch packages
  const fetchPackages = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // In production, this would be an API call
      // const response = await api.get('/api/mobile/packages');
      // setPackages(response.data.data || []);

      // Mock data
      setPackages([
        {
          id: '1',
          name: 'Erkek Bakım Paketi',
          description: '5 seans saç kesimi + sakal',
          price: 800,
          originalPrice: 1000,
          sessions: 5,
          validityDays: 90,
          isActive: true,
          services: ['Saç Kesimi', 'Sakal Traşı'],
        },
        {
          id: '2',
          name: 'VIP Paket',
          description: '10 seans komple bakım',
          price: 1800,
          originalPrice: 2500,
          sessions: 10,
          validityDays: 180,
          isActive: true,
          services: ['Saç Kesimi', 'Sakal Traşı', 'Yüz Bakımı'],
        },
        {
          id: '3',
          name: 'Saç Bakım Paketi',
          description: '3 seans keratin bakımı',
          price: 1200,
          originalPrice: 1500,
          sessions: 3,
          validityDays: 60,
          isActive: false,
          services: ['Keratin Bakım'],
        },
      ]);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages([]);
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('tr-TR') + ' ₺';
  };

  // Calculate discount percentage
  const calculateDiscount = (original: number, current: number) => {
    return Math.round(((original - current) / original) * 100);
  };

  // Handle add package
  const handleAddPackage = async () => {
    if (!formData.name.trim() || !formData.price || !formData.sessions) {
      Alert.alert('Hata', 'Paket adı, fiyat ve seans sayısı zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      const newPackage: Package = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        originalPrice: parseFloat(formData.originalPrice) || parseFloat(formData.price),
        sessions: parseInt(formData.sessions),
        validityDays: parseInt(formData.validityDays),
        isActive: formData.isActive,
        services: [],
      };

      setPackages((prev) => [...prev, newPackage]);
      setShowAddModal(false);
      resetForm();
      Alert.alert('Başarılı', 'Paket eklendi');
    } catch (error) {
      Alert.alert('Hata', 'Paket eklenemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit package
  const handleEditPackage = async () => {
    if (!selectedPackage) return;
    if (!formData.name.trim() || !formData.price || !formData.sessions) {
      Alert.alert('Hata', 'Paket adı, fiyat ve seans sayısı zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedPackage: Package = {
        ...selectedPackage,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        originalPrice: parseFloat(formData.originalPrice) || parseFloat(formData.price),
        sessions: parseInt(formData.sessions),
        validityDays: parseInt(formData.validityDays),
        isActive: formData.isActive,
      };

      setPackages((prev) =>
        prev.map((p) => (p.id === selectedPackage.id ? updatedPackage : p))
      );
      setShowEditModal(false);
      setSelectedPackage(null);
      resetForm();
      Alert.alert('Başarılı', 'Paket güncellendi');
    } catch (error) {
      Alert.alert('Hata', 'Paket güncellenemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete package
  const handleDeletePackage = () => {
    if (!selectedPackage) return;

    Alert.alert(
      'Paketi Sil',
      `"${selectedPackage.name}" paketini silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            setPackages((prev) => prev.filter((p) => p.id !== selectedPackage.id));
            setShowEditModal(false);
            setShowDetailModal(false);
            setSelectedPackage(null);
            Alert.alert('Başarılı', 'Paket silindi');
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
      originalPrice: '',
      sessions: '5',
      validityDays: '30',
      isActive: true,
    });
  };

  // Open edit modal
  const openEditModal = (pkg: Package) => {
    setSelectedPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price.toString(),
      originalPrice: pkg.originalPrice.toString(),
      sessions: pkg.sessions.toString(),
      validityDays: pkg.validityDays.toString(),
      isActive: pkg.isActive,
    });
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  // Render package card
  const renderPackage = ({ item }: { item: Package }) => {
    const discount = calculateDiscount(item.originalPrice, item.price);

    return (
      <TouchableOpacity
        style={[styles.packageCard, !item.isActive && styles.packageCardInactive]}
        onPress={() => {
          setSelectedPackage(item);
          setShowDetailModal(true);
        }}
        activeOpacity={0.7}
      >
        {/* Discount badge */}
        {discount > 0 && item.isActive && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>%{discount}</Text>
          </View>
        )}

        <View style={styles.packageHeader}>
          <View style={[styles.packageIcon, !item.isActive && styles.packageIconInactive]}>
            <Ionicons
              name="gift"
              size={24}
              color={item.isActive ? '#8B5CF6' : '#9CA3AF'}
            />
          </View>
          <View style={styles.packageTitleSection}>
            <Text style={[styles.packageName, !item.isActive && styles.packageNameInactive]}>
              {item.name}
            </Text>
            <View style={[styles.statusBadge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
              <Text style={[styles.statusText, item.isActive ? styles.activeText : styles.inactiveText]}>
                {item.isActive ? 'Aktif' : 'Pasif'}
              </Text>
            </View>
          </View>
        </View>

        {item.description && (
          <Text style={styles.packageDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.packageDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="repeat-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.sessions} Seans</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.validityDays} Gün</Text>
          </View>
        </View>

        <View style={styles.priceSection}>
          {item.originalPrice > item.price && (
            <Text style={styles.originalPrice}>{formatCurrency(item.originalPrice)}</Text>
          )}
          <Text style={[styles.currentPrice, !item.isActive && { color: '#9CA3AF' }]}>
            {formatCurrency(item.price)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render detail modal
  const renderDetailModal = () => {
    if (!selectedPackage) return null;
    const discount = calculateDiscount(selectedPackage.originalPrice, selectedPackage.price);

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
              <Text style={styles.modalTitle}>Paket Detayı</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetailModal(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Package info */}
              <View style={styles.detailSection}>
                <View style={styles.detailIconLarge}>
                  <Ionicons name="gift" size={40} color="#8B5CF6" />
                  {discount > 0 && (
                    <View style={styles.detailDiscountBadge}>
                      <Text style={styles.detailDiscountText}>%{discount}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.detailName}>{selectedPackage.name}</Text>
                {selectedPackage.description && (
                  <Text style={styles.detailDescription}>{selectedPackage.description}</Text>
                )}
              </View>

              {/* Price */}
              <View style={styles.detailPriceSection}>
                {selectedPackage.originalPrice > selectedPackage.price && (
                  <Text style={styles.detailOriginalPrice}>
                    {formatCurrency(selectedPackage.originalPrice)}
                  </Text>
                )}
                <Text style={styles.detailCurrentPrice}>
                  {formatCurrency(selectedPackage.price)}
                </Text>
                <Text style={styles.detailPriceNote}>
                  Seans başı: {formatCurrency(selectedPackage.price / selectedPackage.sessions)}
                </Text>
              </View>

              {/* Stats */}
              <View style={styles.detailStats}>
                <View style={styles.detailStatItem}>
                  <Ionicons name="repeat" size={24} color="#8B5CF6" />
                  <Text style={styles.detailStatValue}>{selectedPackage.sessions}</Text>
                  <Text style={styles.detailStatLabel}>Seans</Text>
                </View>
                <View style={styles.detailStatDivider} />
                <View style={styles.detailStatItem}>
                  <Ionicons name="calendar" size={24} color="#8B5CF6" />
                  <Text style={styles.detailStatValue}>{selectedPackage.validityDays}</Text>
                  <Text style={styles.detailStatLabel}>Gün Geçerlilik</Text>
                </View>
              </View>

              {/* Services */}
              {selectedPackage.services.length > 0 && (
                <View style={styles.servicesSection}>
                  <Text style={styles.servicesSectionTitle}>Dahil Hizmetler</Text>
                  {selectedPackage.services.map((service, index) => (
                    <View key={index} style={styles.serviceItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#059669" />
                      <Text style={styles.serviceItemText}>{service}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View style={styles.detailActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => openEditModal(selectedPackage)}
              >
                <Ionicons name="create-outline" size={20} color="#3B82F6" />
                <Text style={styles.editBtnText}>Düzenle</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sellBtn} onPress={() => {
                setShowDetailModal(false);
                Alert.alert('Paket Sat', 'Bu özellik yakında eklenecek');
              }}>
                <Ionicons name="cart" size={20} color="#fff" />
                <Text style={styles.sellBtnText}>Paket Sat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render form modal
  const renderFormModal = (isEdit: boolean) => (
    <Modal
      visible={isEdit ? showEditModal : showAddModal}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (isEdit) {
          setShowEditModal(false);
          setSelectedPackage(null);
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
              {isEdit ? 'Paketi Düzenle' : 'Yeni Paket'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                if (isEdit) {
                  setShowEditModal(false);
                  setSelectedPackage(null);
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
            {/* Package name */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Paket Adı *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ör: VIP Bakım Paketi"
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
                placeholder="Paket açıklaması..."
                placeholderTextColor="#9CA3AF"
                value={formData.description}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Price row */}
            <View style={styles.formRow}>
              <View style={[styles.formSection, { flex: 1 }]}>
                <Text style={styles.formLabel}>Normal Fiyat</Text>
                <View style={styles.priceInputWrapper}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    value={formData.originalPrice}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, originalPrice: text.replace(/[^0-9]/g, '') }))
                    }
                    keyboardType="numeric"
                  />
                  <Text style={styles.currencyLabel}>₺</Text>
                </View>
              </View>
              <View style={[styles.formSection, { flex: 1 }]}>
                <Text style={styles.formLabel}>İndirimli Fiyat *</Text>
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
            </View>

            {/* Sessions and validity */}
            <View style={styles.formRow}>
              <View style={[styles.formSection, { flex: 1 }]}>
                <Text style={styles.formLabel}>Seans Sayısı *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="5"
                  placeholderTextColor="#9CA3AF"
                  value={formData.sessions}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, sessions: text.replace(/[^0-9]/g, '') }))
                  }
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formSection, { flex: 1 }]}>
                <Text style={styles.formLabel}>Geçerlilik (Gün)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="30"
                  placeholderTextColor="#9CA3AF"
                  value={formData.validityDays}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, validityDays: text.replace(/[^0-9]/g, '') }))
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Active toggle */}
            <View style={styles.formSection}>
              <View style={styles.toggleRow}>
                <View>
                  <Text style={styles.formLabel}>Aktif</Text>
                  <Text style={styles.toggleDescription}>
                    Pasif paketler satışa kapalıdır
                  </Text>
                </View>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, isActive: value }))}
                  trackColor={{ false: '#E5E7EB', true: '#C4B5FD' }}
                  thumbColor={formData.isActive ? '#8B5CF6' : '#fff'}
                />
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.modalActions}>
            {isEdit && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDeletePackage}>
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
                <Text style={styles.deleteBtnText}>Sil</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.submitBtn, styles.submitBtnPurple, isSubmitting && styles.submitBtnDisabled, isEdit && { flex: 1 }]}
              onPress={isEdit ? handleEditPackage : handleAddPackage}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name={isEdit ? 'checkmark' : 'add'} size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>
                    {isEdit ? 'Kaydet' : 'Paket Ekle'}
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
        <Text style={styles.title}>Paketler</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{packages.length}</Text>
          <Text style={styles.statLabel}>Toplam</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#8B5CF6' }]}>
            {packages.filter((p) => p.isActive).length}
          </Text>
          <Text style={styles.statLabel}>Aktif</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#9CA3AF' }]}>
            {packages.filter((p) => !p.isActive).length}
          </Text>
          <Text style={styles.statLabel}>Pasif</Text>
        </View>
      </View>

      {/* Packages list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
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
              tintColor="#8B5CF6"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrapper}>
                <Ionicons name="gift-outline" size={48} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>Henüz paket yok</Text>
              <Text style={styles.emptySubtitle}>
                Yeni paket eklemek için + butonuna basın
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: '#8B5CF6' }]}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modals */}
      {renderDetailModal()}
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

  // Package card
  packageCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  packageCardInactive: {
    opacity: 0.7,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageIconInactive: {
    backgroundColor: '#F3F4F6',
  },
  packageTitleSection: {
    flex: 1,
    marginLeft: 12,
  },
  packageName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  packageNameInactive: {
    color: '#9CA3AF',
  },
  packageDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  packageDetails: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  currentPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  activeBadge: {
    backgroundColor: '#F3E8FF',
  },
  inactiveBadge: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeText: {
    color: '#8B5CF6',
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
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
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
  detailModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
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

  // Detail modal
  detailSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  detailIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  detailDiscountBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  detailDiscountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  detailName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  detailDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  detailPriceSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    borderRadius: 16,
  },
  detailOriginalPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  detailCurrentPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#8B5CF6',
    marginTop: 4,
  },
  detailPriceNote: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  detailStats: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  detailStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  detailStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  detailStatDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  servicesSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  servicesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  serviceItemText: {
    fontSize: 15,
    color: '#4B5563',
  },
  detailActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    gap: 6,
  },
  editBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  sellBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    gap: 8,
  },
  sellBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Form
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
  submitBtnPurple: {
    backgroundColor: '#8B5CF6',
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
