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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../../src/services/api';
import DrawerMenu from '../../../src/components/DrawerMenu';
import Header from '../../../src/components/Header';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Product type
interface Product {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  cost?: number;
  stock: number;
  minStock: number;
  barcode?: string;
  sku?: string;
  supplier?: string;
  status: string;
  stockStatus: string;
  createdAt: string;
  updatedAt: string;
}

// Status configuration with gradients
const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: string; gradient: [string, string] }> = {
  all: { bg: '#F3F4F6', text: '#374151', label: 'Tümü', icon: 'cube', gradient: ['#6B7280', '#4B5563'] },
  inStock: { bg: '#D1FAE5', text: '#059669', label: 'Stokta', icon: 'checkmark-circle', gradient: ['#10B981', '#059669'] },
  lowStock: { bg: '#FEF3C7', text: '#D97706', label: 'Az Stok', icon: 'warning', gradient: ['#F59E0B', '#D97706'] },
  outOfStock: { bg: '#FEE2E2', text: '#DC2626', label: 'Tükendi', icon: 'close-circle', gradient: ['#EF4444', '#DC2626'] },
};

const FILTER_TABS = ['all', 'inStock', 'lowStock', 'outOfStock'];

export default function StockScreen() {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    barcode: '',
    sku: '',
    supplier: '',
    status: 'active',
  });

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editProduct, setEditProduct] = useState<typeof newProduct | null>(null);

  // Stock adjustment states
  const [stockAction, setStockAction] = useState<'add' | 'remove' | 'set'>('add');
  const [stockQuantity, setStockQuantity] = useState('');

  // Fetch products
  const fetchProducts = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await api.get('/api/mobile/products');
      setProducts(response.data.data || []);
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  // Filter and search products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Apply stock status filter
    if (activeFilter !== 'all') {
      result = result.filter((p) => p.stockStatus === activeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((product) => {
        return (
          product.name.toLowerCase().includes(query) ||
          product.barcode?.toLowerCase().includes(query) ||
          product.sku?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [products, activeFilter, searchQuery]);

  // Get product counts by stock status
  const statusCounts = useMemo(() => {
    return {
      all: products.length,
      inStock: products.filter((p) => p.stockStatus === 'inStock').length,
      lowStock: products.filter((p) => p.stockStatus === 'lowStock').length,
      outOfStock: products.filter((p) => p.stockStatus === 'outOfStock').length,
    };
  }, [products]);

  // Reset form helper
  const resetNewProductForm = () => {
    setNewProduct({
      name: '',
      description: '',
      category: '',
      price: '',
      cost: '',
      stock: '',
      minStock: '',
      barcode: '',
      sku: '',
      supplier: '',
      status: 'active',
    });
  };

  // Start edit mode
  const startEditMode = () => {
    if (!selectedProduct) return;
    setEditProduct({
      name: selectedProduct.name || '',
      description: selectedProduct.description || '',
      category: selectedProduct.category || '',
      price: selectedProduct.price?.toString() || '',
      cost: selectedProduct.cost?.toString() || '',
      stock: selectedProduct.stock?.toString() || '',
      minStock: selectedProduct.minStock?.toString() || '',
      barcode: selectedProduct.barcode || '',
      sku: selectedProduct.sku || '',
      supplier: selectedProduct.supplier || '',
      status: selectedProduct.status || 'active',
    });
    setIsEditMode(true);
  };

  // Handle add product
  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.stock || !newProduct.price) {
      Alert.alert('Hata', 'Ürün adı, stok ve fiyat zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/mobile/products', {
        name: newProduct.name.trim(),
        description: newProduct.description.trim() || null,
        category: newProduct.category.trim() || null,
        price: parseFloat(newProduct.price) || 0,
        cost: parseFloat(newProduct.cost) || 0,
        stock: parseInt(newProduct.stock) || 0,
        minStock: parseInt(newProduct.minStock) || 0,
        barcode: newProduct.barcode.trim() || null,
        sku: newProduct.sku.trim() || null,
        supplier: newProduct.supplier.trim() || null,
        status: newProduct.status,
      });

      if (response.data.success) {
        Alert.alert('Başarılı', 'Ürün eklendi');
        setShowAddModal(false);
        resetNewProductForm();
        fetchProducts();
      } else {
        Alert.alert('Hata', response.data.message || 'Ürün eklenemedi');
      }
    } catch (error: any) {
      console.error('Add product error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update product
  const handleUpdateProduct = async () => {
    if (!selectedProduct || !editProduct) return;
    if (!editProduct.name.trim() || !editProduct.stock || !editProduct.price) {
      Alert.alert('Hata', 'Ürün adı, stok ve fiyat zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.put(`/api/mobile/products/${selectedProduct.id}`, {
        name: editProduct.name.trim(),
        description: editProduct.description.trim() || null,
        category: editProduct.category.trim() || null,
        price: parseFloat(editProduct.price) || 0,
        cost: parseFloat(editProduct.cost) || 0,
        stock: parseInt(editProduct.stock) || 0,
        minStock: parseInt(editProduct.minStock) || 0,
        barcode: editProduct.barcode.trim() || null,
        sku: editProduct.sku.trim() || null,
        supplier: editProduct.supplier.trim() || null,
        status: editProduct.status,
      });

      if (response.data.success) {
        Alert.alert('Başarılı', 'Ürün güncellendi');
        setIsEditMode(false);
        setShowDetailModal(false);
        fetchProducts();
      } else {
        Alert.alert('Hata', response.data.message || 'Ürün güncellenemedi');
      }
    } catch (error: any) {
      console.error('Update product error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete product
  const handleDeleteProduct = (product?: Product) => {
    const productToDelete = product || selectedProduct;
    if (!productToDelete) return;

    Alert.alert(
      'Ürünü Sil',
      `${productToDelete.name} ürününü silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/api/mobile/products/${productToDelete.id}`);
              if (response.data.success) {
                Alert.alert('Başarılı', 'Ürün silindi');
                setShowDetailModal(false);
                fetchProducts();
              } else {
                Alert.alert('Hata', response.data.message || 'Ürün silinemedi');
              }
            } catch (error: any) {
              console.error('Delete product error:', error);
              Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  // Handle stock adjustment
  const handleStockAdjustment = async () => {
    if (!selectedProduct || !stockQuantity) {
      Alert.alert('Hata', 'Miktar giriniz');
      return;
    }

    setIsSubmitting(true);
    try {
      const action = stockAction === 'add' ? 'addStock' : stockAction === 'remove' ? 'removeStock' : 'setStock';
      const response = await api.patch(`/api/mobile/products/${selectedProduct.id}`, {
        action,
        quantity: parseInt(stockQuantity),
      });

      if (response.data.success) {
        Alert.alert('Başarılı', response.data.message);
        setShowStockModal(false);
        setStockQuantity('');
        fetchProducts();
        // Update selected product
        if (selectedProduct) {
          setSelectedProduct({
            ...selectedProduct,
            stock: response.data.data.stock,
            stockStatus: response.data.data.stockStatus,
          });
        }
      } else {
        Alert.alert('Hata', response.data.message || 'Stok güncellenemedi');
      }
    } catch (error: any) {
      console.error('Stock adjustment error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (product: Product) => {
    try {
      const response = await api.patch(`/api/mobile/products/${product.id}`, {
        action: 'toggleStatus',
      });

      if (response.data.success) {
        fetchProducts();
        if (selectedProduct?.id === product.id) {
          setSelectedProduct({
            ...selectedProduct,
            status: response.data.data.status,
          });
        }
      }
    } catch (error: any) {
      console.error('Toggle status error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
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

  // Render product card
  const renderProduct = ({ item }: { item: Product }) => {
    const stockConfig = STATUS_CONFIG[item.stockStatus] || STATUS_CONFIG.inStock;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => {
          setSelectedProduct(item);
          setShowDetailModal(true);
        }}
        activeOpacity={0.7}
      >
        {/* Left accent bar */}
        <LinearGradient
          colors={stockConfig.gradient}
          style={styles.cardAccent}
        />

        <View style={styles.cardContent}>
          {/* Top Row: Icon + Name + Status */}
          <View style={styles.cardTopRow}>
            {/* Product Icon */}
            <View style={styles.productIcon}>
              <Ionicons name="cube" size={18} color="#fff" />
            </View>

            {/* Product Info */}
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.category && (
                <View style={styles.categoryRow}>
                  <Ionicons name="pricetag-outline" size={12} color="#9CA3AF" />
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              )}
            </View>

            {/* Stock Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: stockConfig.bg }]}>
              <Ionicons name={stockConfig.icon as any} size={12} color={stockConfig.text} />
            </View>
          </View>

          {/* Middle Row: Stock & Price Info */}
          <View style={styles.cardMiddleRow}>
            <View style={styles.stockInfo}>
              <Text style={styles.stockLabel}>Stok</Text>
              <Text style={[
                styles.stockValue,
                item.stockStatus === 'outOfStock' && styles.stockValueDanger,
                item.stockStatus === 'lowStock' && styles.stockValueWarning,
              ]}>
                {item.stock}
              </Text>
            </View>
            <View style={styles.priceInfo}>
              <Text style={styles.priceLabel}>Fiyat</Text>
              <Text style={styles.priceValue}>
                {item.price ? `₺${item.price.toLocaleString('tr-TR')}` : '-'}
              </Text>
            </View>
            {item.minStock > 0 && (
              <View style={styles.minStockInfo}>
                <Text style={styles.minStockLabel}>Min</Text>
                <Text style={styles.minStockValue}>{item.minStock}</Text>
              </View>
            )}
          </View>

          {/* Bottom Row: Quick Actions */}
          <View style={styles.cardBottomRow}>
            {item.barcode && (
              <View style={styles.barcodeRow}>
                <Ionicons name="barcode-outline" size={12} color="#9CA3AF" />
                <Text style={styles.barcodeText} numberOfLines={1}>{item.barcode}</Text>
              </View>
            )}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedProduct(item);
                  setStockAction('add');
                  setStockQuantity('');
                  setShowStockModal(true);
                }}
              >
                <Ionicons name="add" size={16} color="#059669" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionBtn, styles.removeStockBtn]}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedProduct(item);
                  setStockAction('remove');
                  setStockQuantity('');
                  setShowStockModal(true);
                }}
              >
                <Ionicons name="remove" size={16} color="#D97706" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionBtn, styles.deleteBtn]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteProduct(item);
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
        <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery
          ? 'Ürün bulunamadı'
          : activeFilter !== 'all'
          ? `${STATUS_CONFIG[activeFilter].label} ürün yok`
          : 'Henüz ürün yok'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Farklı bir arama terimi deneyin'
          : 'Yeni ürün eklemek için + butonuna basın'}
      </Text>
    </View>
  );

  // Close detail modal and reset edit mode
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setIsEditMode(false);
    setEditProduct(null);
  };

  // Render detail modal
  const renderDetailModal = () => {
    if (!selectedProduct) return null;
    const stockConfig = STATUS_CONFIG[selectedProduct.stockStatus] || STATUS_CONFIG.inStock;

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

              {/* Product Icon */}
              <View style={styles.profileIconWrapper}>
                <Ionicons name="cube" size={32} color="#fff" />
              </View>

              <Text style={styles.profileName}>{selectedProduct.name}</Text>
              <View style={[styles.profileStatusBadge, { backgroundColor: stockConfig.bg }]}>
                <Ionicons name={stockConfig.icon as any} size={14} color={stockConfig.text} />
                <Text style={[styles.profileStatusText, { color: stockConfig.text }]}>
                  {stockConfig.label}
                </Text>
              </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollContent}>
              {isEditMode && editProduct ? (
                // Edit Mode - Show edit form
                <View style={styles.editFormContainer}>
                  {/* Ürün Bilgileri */}
                  <View style={styles.formSectionCard}>
                    <Text style={styles.formSectionTitle}>Ürün Bilgileri</Text>

                    <View style={styles.formGroupFull}>
                      <Text style={styles.formLabel}>Ürün Adı *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Ürün adı"
                        placeholderTextColor="#9CA3AF"
                        value={editProduct.name}
                        onChangeText={(text) =>
                          setEditProduct((prev) => prev ? { ...prev, name: text } : null)
                        }
                      />
                    </View>

                    <View style={styles.formGroupFull}>
                      <Text style={styles.formLabel}>Açıklama</Text>
                      <TextInput
                        style={[styles.formInput, styles.formTextarea]}
                        placeholder="Ürün açıklaması"
                        placeholderTextColor="#9CA3AF"
                        value={editProduct.description}
                        onChangeText={(text) =>
                          setEditProduct((prev) => prev ? { ...prev, description: text } : null)
                        }
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>

                    <View style={styles.formGroupFull}>
                      <Text style={styles.formLabel}>Kategori</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Kategori"
                        placeholderTextColor="#9CA3AF"
                        value={editProduct.category}
                        onChangeText={(text) =>
                          setEditProduct((prev) => prev ? { ...prev, category: text } : null)
                        }
                      />
                    </View>
                  </View>

                  {/* Fiyat Bilgileri */}
                  <View style={styles.formSectionCard}>
                    <Text style={styles.formSectionTitle}>Fiyat Bilgileri</Text>

                    <View style={styles.formRow}>
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Satış Fiyatı *</Text>
                        <TextInput
                          style={styles.formInput}
                          placeholder="0.00"
                          placeholderTextColor="#9CA3AF"
                          value={editProduct.price}
                          onChangeText={(text) =>
                            setEditProduct((prev) => prev ? { ...prev, price: text } : null)
                          }
                          keyboardType="decimal-pad"
                        />
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Maliyet</Text>
                        <TextInput
                          style={styles.formInput}
                          placeholder="0.00"
                          placeholderTextColor="#9CA3AF"
                          value={editProduct.cost}
                          onChangeText={(text) =>
                            setEditProduct((prev) => prev ? { ...prev, cost: text } : null)
                          }
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Stok Bilgileri */}
                  <View style={styles.formSectionCard}>
                    <Text style={styles.formSectionTitle}>Stok Bilgileri</Text>

                    <View style={styles.formRow}>
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Stok Miktarı *</Text>
                        <TextInput
                          style={styles.formInput}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          value={editProduct.stock}
                          onChangeText={(text) =>
                            setEditProduct((prev) => prev ? { ...prev, stock: text } : null)
                          }
                          keyboardType="number-pad"
                        />
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Min. Stok</Text>
                        <TextInput
                          style={styles.formInput}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          value={editProduct.minStock}
                          onChangeText={(text) =>
                            setEditProduct((prev) => prev ? { ...prev, minStock: text } : null)
                          }
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Diğer Bilgiler */}
                  <View style={styles.formSectionCard}>
                    <Text style={styles.formSectionTitle}>Diğer Bilgiler</Text>

                    <View style={styles.formGroupFull}>
                      <Text style={styles.formLabel}>Barkod</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Barkod numarası"
                        placeholderTextColor="#9CA3AF"
                        value={editProduct.barcode}
                        onChangeText={(text) =>
                          setEditProduct((prev) => prev ? { ...prev, barcode: text } : null)
                        }
                      />
                    </View>

                    <View style={styles.formGroupFull}>
                      <Text style={styles.formLabel}>SKU</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Stok kodu"
                        placeholderTextColor="#9CA3AF"
                        value={editProduct.sku}
                        onChangeText={(text) =>
                          setEditProduct((prev) => prev ? { ...prev, sku: text } : null)
                        }
                      />
                    </View>

                    <View style={styles.formGroupFull}>
                      <Text style={styles.formLabel}>Tedarikçi</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Tedarikçi adı"
                        placeholderTextColor="#9CA3AF"
                        value={editProduct.supplier}
                        onChangeText={(text) =>
                          setEditProduct((prev) => prev ? { ...prev, supplier: text } : null)
                        }
                      />
                    </View>
                  </View>

                  {/* Durum */}
                  <View style={styles.formSectionCard}>
                    <Text style={styles.formSectionTitle}>Ürün Durumu</Text>
                    <View style={styles.statusSelector}>
                      <TouchableOpacity
                        style={[
                          styles.statusOption,
                          editProduct.status === 'active' && {
                            backgroundColor: '#D1FAE520',
                            borderColor: '#059669',
                          },
                        ]}
                        onPress={() =>
                          setEditProduct((prev) => prev ? { ...prev, status: 'active' } : null)
                        }
                      >
                        <View style={[styles.statusDot, { backgroundColor: '#059669' }]} />
                        <Text
                          style={[
                            styles.statusOptionText,
                            editProduct.status === 'active' && { color: '#059669' },
                          ]}
                        >
                          Aktif
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.statusOption,
                          editProduct.status === 'inactive' && {
                            backgroundColor: '#FEE2E220',
                            borderColor: '#DC2626',
                          },
                        ]}
                        onPress={() =>
                          setEditProduct((prev) => prev ? { ...prev, status: 'inactive' } : null)
                        }
                      >
                        <View style={[styles.statusDot, { backgroundColor: '#DC2626' }]} />
                        <Text
                          style={[
                            styles.statusOptionText,
                            editProduct.status === 'inactive' && { color: '#DC2626' },
                          ]}
                        >
                          Pasif
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                // View Mode - Show product details
                <>
                  {/* Stock Quick Actions */}
                  <View style={styles.stockActions}>
                    <TouchableOpacity
                      style={styles.stockAction}
                      onPress={() => {
                        setStockAction('add');
                        setStockQuantity('');
                        setShowStockModal(true);
                      }}
                    >
                      <View style={[styles.stockActionIcon, { backgroundColor: '#D1FAE5' }]}>
                        <Ionicons name="add" size={24} color="#059669" />
                      </View>
                      <Text style={styles.stockActionLabel}>Stok Ekle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stockAction}
                      onPress={() => {
                        setStockAction('remove');
                        setStockQuantity('');
                        setShowStockModal(true);
                      }}
                    >
                      <View style={[styles.stockActionIcon, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="remove" size={24} color="#D97706" />
                      </View>
                      <Text style={styles.stockActionLabel}>Stok Düş</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stockAction}
                      onPress={() => {
                        setStockAction('set');
                        setStockQuantity('');
                        setShowStockModal(true);
                      }}
                    >
                      <View style={[styles.stockActionIcon, { backgroundColor: '#EFF6FF' }]}>
                        <Ionicons name="create" size={24} color="#3B82F6" />
                      </View>
                      <Text style={styles.stockActionLabel}>Stok Ayarla</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Stock Info Section */}
                  <View style={styles.stockInfoSection}>
                    <View style={styles.stockInfoItem}>
                      <Text style={styles.stockInfoLabel}>Mevcut Stok</Text>
                      <Text style={[
                        styles.stockInfoValue,
                        selectedProduct.stockStatus === 'outOfStock' && styles.stockValueDanger,
                        selectedProduct.stockStatus === 'lowStock' && styles.stockValueWarning,
                      ]}>
                        {selectedProduct.stock}
                      </Text>
                    </View>
                    <View style={styles.stockInfoDivider} />
                    <View style={styles.stockInfoItem}>
                      <Text style={styles.stockInfoLabel}>Min. Stok</Text>
                      <Text style={styles.stockInfoValue}>{selectedProduct.minStock}</Text>
                    </View>
                  </View>

                  {/* Price Info */}
                  <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                      <View style={styles.infoIconWrapper}>
                        <Ionicons name="cash" size={18} color="#3B82F6" />
                      </View>
                      <View>
                        <Text style={styles.infoLabel}>Satış Fiyatı</Text>
                        <Text style={styles.infoValue}>
                          {selectedProduct.price ? `₺${selectedProduct.price.toLocaleString('tr-TR')}` : '-'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {selectedProduct.cost ? (
                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                          <Ionicons name="wallet" size={18} color="#3B82F6" />
                        </View>
                        <View>
                          <Text style={styles.infoLabel}>Maliyet</Text>
                          <Text style={styles.infoValue}>₺{selectedProduct.cost.toLocaleString('tr-TR')}</Text>
                        </View>
                      </View>
                    </View>
                  ) : null}

                  {selectedProduct.category && (
                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                          <Ionicons name="pricetag" size={18} color="#3B82F6" />
                        </View>
                        <View>
                          <Text style={styles.infoLabel}>Kategori</Text>
                          <Text style={styles.infoValue}>{selectedProduct.category}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {selectedProduct.barcode && (
                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                          <Ionicons name="barcode" size={18} color="#3B82F6" />
                        </View>
                        <View>
                          <Text style={styles.infoLabel}>Barkod</Text>
                          <Text style={styles.infoValue}>{selectedProduct.barcode}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {selectedProduct.sku && (
                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                          <Ionicons name="qr-code" size={18} color="#3B82F6" />
                        </View>
                        <View>
                          <Text style={styles.infoLabel}>SKU</Text>
                          <Text style={styles.infoValue}>{selectedProduct.sku}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {selectedProduct.supplier && (
                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                          <Ionicons name="business" size={18} color="#3B82F6" />
                        </View>
                        <View>
                          <Text style={styles.infoLabel}>Tedarikçi</Text>
                          <Text style={styles.infoValue}>{selectedProduct.supplier}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {selectedProduct.description && (
                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                          <Ionicons name="document-text" size={18} color="#3B82F6" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.infoLabel}>Açıklama</Text>
                          <Text style={styles.infoValue}>{selectedProduct.description}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Status Section */}
                  <View style={styles.statusSection}>
                    <Text style={styles.statusSectionTitle}>Ürün Durumu</Text>
                    <TouchableOpacity
                      style={[
                        styles.statusToggle,
                        selectedProduct.status === 'active'
                          ? styles.statusToggleActive
                          : styles.statusToggleInactive,
                      ]}
                      onPress={() => handleToggleStatus(selectedProduct)}
                    >
                      <View
                        style={[
                          styles.statusToggleDot,
                          selectedProduct.status === 'active'
                            ? styles.statusToggleDotActive
                            : styles.statusToggleDotInactive,
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusToggleText,
                          selectedProduct.status === 'active'
                            ? styles.statusToggleTextActive
                            : styles.statusToggleTextInactive,
                        ]}
                      >
                        {selectedProduct.status === 'active' ? 'Aktif' : 'Pasif'}
                      </Text>
                    </TouchableOpacity>
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
                      setEditProduct(null);
                    }}
                  >
                    <Text style={styles.cancelEditBtnText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveEditBtn, isSubmitting && styles.submitBtnDisabled]}
                    onPress={handleUpdateProduct}
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
                    style={styles.deleteActionBtn}
                    onPress={() => handleDeleteProduct()}
                  >
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                    <Text style={styles.deleteActionBtnText}>Sil</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Render add product modal
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
            <Text style={styles.addModalTitle}>Yeni Ürün</Text>
            <TouchableOpacity
              style={styles.addModalCloseBtn}
              onPress={() => {
                setShowAddModal(false);
                resetNewProductForm();
              }}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.addModalScroll}>
            {/* Ürün Bilgileri */}
            <View style={styles.formSectionCard}>
              <Text style={styles.formSectionTitle}>Ürün Bilgileri</Text>

              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>Ürün Adı *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ürün adı"
                  placeholderTextColor="#9CA3AF"
                  value={newProduct.name}
                  onChangeText={(text) =>
                    setNewProduct((prev) => ({ ...prev, name: text }))
                  }
                />
              </View>

              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>Açıklama</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea]}
                  placeholder="Ürün açıklaması"
                  placeholderTextColor="#9CA3AF"
                  value={newProduct.description}
                  onChangeText={(text) =>
                    setNewProduct((prev) => ({ ...prev, description: text }))
                  }
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>Kategori</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Kategori"
                  placeholderTextColor="#9CA3AF"
                  value={newProduct.category}
                  onChangeText={(text) =>
                    setNewProduct((prev) => ({ ...prev, category: text }))
                  }
                />
              </View>
            </View>

            {/* Fiyat Bilgileri */}
            <View style={styles.formSectionCard}>
              <Text style={styles.formSectionTitle}>Fiyat Bilgileri</Text>

              <View style={styles.formRow}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Satış Fiyatı *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    value={newProduct.price}
                    onChangeText={(text) =>
                      setNewProduct((prev) => ({ ...prev, price: text }))
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Maliyet</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    value={newProduct.cost}
                    onChangeText={(text) =>
                      setNewProduct((prev) => ({ ...prev, cost: text }))
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            {/* Stok Bilgileri */}
            <View style={styles.formSectionCard}>
              <Text style={styles.formSectionTitle}>Stok Bilgileri</Text>

              <View style={styles.formRow}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Stok Miktarı *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    value={newProduct.stock}
                    onChangeText={(text) =>
                      setNewProduct((prev) => ({ ...prev, stock: text }))
                    }
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Min. Stok</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    value={newProduct.minStock}
                    onChangeText={(text) =>
                      setNewProduct((prev) => ({ ...prev, minStock: text }))
                    }
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>

            {/* Diğer Bilgiler */}
            <View style={styles.formSectionCard}>
              <Text style={styles.formSectionTitle}>Diğer Bilgiler</Text>

              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>Barkod</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Barkod numarası"
                  placeholderTextColor="#9CA3AF"
                  value={newProduct.barcode}
                  onChangeText={(text) =>
                    setNewProduct((prev) => ({ ...prev, barcode: text }))
                  }
                />
              </View>

              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>SKU</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Stok kodu"
                  placeholderTextColor="#9CA3AF"
                  value={newProduct.sku}
                  onChangeText={(text) =>
                    setNewProduct((prev) => ({ ...prev, sku: text }))
                  }
                />
              </View>

              <View style={styles.formGroupFull}>
                <Text style={styles.formLabel}>Tedarikçi</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Tedarikçi adı"
                  placeholderTextColor="#9CA3AF"
                  value={newProduct.supplier}
                  onChangeText={(text) =>
                    setNewProduct((prev) => ({ ...prev, supplier: text }))
                  }
                />
              </View>
            </View>

            {/* Bilgilendirme */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardText}>• Ürün adı, stok ve fiyat zorunludur</Text>
                <Text style={styles.infoCardText}>• Min. stok seviyesi uyarı için kullanılır</Text>
                <Text style={styles.infoCardText}>• Barkod ile hızlı ürün arama yapılabilir</Text>
              </View>
            </View>
          </ScrollView>

          {/* Submit button */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleAddProduct}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>Ürün Ekle</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Render stock adjustment modal
  const renderStockModal = () => (
    <Modal
      visible={showStockModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowStockModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.stockModalContent}>
          <LinearGradient
            colors={['#163974', '#0F2A52']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.stockModalHeader}
          >
            <Text style={styles.stockModalTitle}>
              {stockAction === 'add' ? 'Stok Ekle' : stockAction === 'remove' ? 'Stok Düş' : 'Stok Ayarla'}
            </Text>
            <TouchableOpacity
              style={styles.stockModalCloseBtn}
              onPress={() => setShowStockModal(false)}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.stockModalBody}>
            {selectedProduct && (
              <View style={styles.stockModalProductInfo}>
                <Text style={styles.stockModalProductName}>{selectedProduct.name}</Text>
                <Text style={styles.stockModalCurrentStock}>
                  Mevcut Stok: <Text style={styles.stockModalCurrentStockValue}>{selectedProduct.stock}</Text>
                </Text>
              </View>
            )}

            {/* Stock Action Tabs */}
            <View style={styles.stockActionTabs}>
              <TouchableOpacity
                style={[styles.stockActionTab, stockAction === 'add' && styles.stockActionTabActive]}
                onPress={() => setStockAction('add')}
              >
                <Ionicons name="add" size={18} color={stockAction === 'add' ? '#059669' : '#6B7280'} />
                <Text style={[styles.stockActionTabText, stockAction === 'add' && styles.stockActionTabTextActive]}>
                  Ekle
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stockActionTab, stockAction === 'remove' && styles.stockActionTabActiveWarning]}
                onPress={() => setStockAction('remove')}
              >
                <Ionicons name="remove" size={18} color={stockAction === 'remove' ? '#D97706' : '#6B7280'} />
                <Text style={[styles.stockActionTabText, stockAction === 'remove' && styles.stockActionTabTextWarning]}>
                  Düş
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stockActionTab, stockAction === 'set' && styles.stockActionTabActiveBlue]}
                onPress={() => setStockAction('set')}
              >
                <Ionicons name="create" size={18} color={stockAction === 'set' ? '#3B82F6' : '#6B7280'} />
                <Text style={[styles.stockActionTabText, stockAction === 'set' && styles.stockActionTabTextBlue]}>
                  Ayarla
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quantity Input */}
            <View style={styles.stockQuantityInput}>
              <Text style={styles.stockQuantityLabel}>
                {stockAction === 'set' ? 'Yeni Stok Miktarı' : 'Miktar'}
              </Text>
              <TextInput
                style={styles.stockQuantityTextInput}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                value={stockQuantity}
                onChangeText={setStockQuantity}
                keyboardType="number-pad"
                autoFocus
              />
            </View>

            {/* Preview */}
            {stockQuantity && selectedProduct && (
              <View style={styles.stockPreview}>
                <Text style={styles.stockPreviewLabel}>Sonuç:</Text>
                <Text style={styles.stockPreviewValue}>
                  {stockAction === 'add'
                    ? selectedProduct.stock + parseInt(stockQuantity || '0')
                    : stockAction === 'remove'
                    ? Math.max(0, selectedProduct.stock - parseInt(stockQuantity || '0'))
                    : parseInt(stockQuantity || '0')}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.stockModalActions}>
            <TouchableOpacity
              style={styles.stockModalCancelBtn}
              onPress={() => setShowStockModal(false)}
            >
              <Text style={styles.stockModalCancelBtnText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stockModalSubmitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleStockAdjustment}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.stockModalSubmitBtnText}>Uygula</Text>
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
      <Header
        title="Stok"
        subtitle={`${products.length} ürün kayıtlı`}
        onMenuPress={() => setDrawerOpen(true)}
        showSearch
        searchActive={showSearch}
        onSearchPress={() => setShowSearch(!showSearch)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Ürün adı, barkod veya SKU ara..."
        gradientColors={['#163974', '#1e4a8f']}
        stats={[
          { icon: 'cube', iconColor: '#6366F1', iconBg: '#EEF2FF', value: statusCounts.all, label: 'Toplam' },
          { icon: 'checkmark-circle', iconColor: '#059669', iconBg: '#D1FAE5', value: statusCounts.inStock, label: 'Stokta' },
          { icon: 'warning', iconColor: '#D97706', iconBg: '#FEF3C7', value: statusCounts.lowStock, label: 'Az Stok' },
          { icon: 'close-circle', iconColor: '#DC2626', iconBg: '#FEE2E2', value: statusCounts.outOfStock, label: 'Tükendi' },
        ]}
      />

      {/* Filter tabs */}
      <View style={styles.filterTabs}>{renderFilterTabs()}</View>

      {/* Product list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#163974" />
          <Text style={styles.loadingText}>Ürünler yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchProducts(true)}
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
      {renderStockModal()}

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

  // Product card
  productCard: {
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
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#163974',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#9CA3AF',
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
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 16,
  },
  stockInfo: {
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  stockValueDanger: {
    color: '#DC2626',
  },
  stockValueWarning: {
    color: '#D97706',
  },
  priceInfo: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  minStockInfo: {
    alignItems: 'center',
  },
  minStockLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  minStockValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
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
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  barcodeText: {
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
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeStockBtn: {
    backgroundColor: '#FEF3C7',
  },
  deleteBtn: {
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
    borderRadius: 20,
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
  },
  modalScrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },

  // Stock actions
  stockActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stockAction: {
    alignItems: 'center',
    gap: 8,
  },
  stockActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockActionLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Stock info section
  stockInfoSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginHorizontal: 20,
  },
  stockInfoItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  stockInfoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  stockInfoValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#059669',
  },
  stockInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },

  // Info sections
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

  // Status section
  statusSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statusSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  statusToggleActive: {
    backgroundColor: '#D1FAE5',
  },
  statusToggleInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusToggleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusToggleDotActive: {
    backgroundColor: '#059669',
  },
  statusToggleDotInactive: {
    backgroundColor: '#DC2626',
  },
  statusToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusToggleTextActive: {
    color: '#059669',
  },
  statusToggleTextInactive: {
    color: '#DC2626',
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
  deleteActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteActionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Edit form
  editFormContainer: {
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 46,
  },
  formTextarea: {
    minHeight: 80,
    paddingTop: 14,
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

  // Edit actions
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
  submitBtnDisabled: {
    opacity: 0.7,
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
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#163974',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Stock modal
  stockModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  stockModalHeader: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  stockModalCloseBtn: {
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
  stockModalBody: {
    padding: 20,
  },
  stockModalProductInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stockModalProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  stockModalCurrentStock: {
    fontSize: 14,
    color: '#6B7280',
  },
  stockModalCurrentStockValue: {
    fontWeight: '700',
    color: '#1F2937',
  },
  stockActionTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  stockActionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  stockActionTabActive: {
    backgroundColor: '#D1FAE5',
  },
  stockActionTabActiveWarning: {
    backgroundColor: '#FEF3C7',
  },
  stockActionTabActiveBlue: {
    backgroundColor: '#EFF6FF',
  },
  stockActionTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  stockActionTabTextActive: {
    color: '#059669',
  },
  stockActionTabTextWarning: {
    color: '#D97706',
  },
  stockActionTabTextBlue: {
    color: '#3B82F6',
  },
  stockQuantityInput: {
    marginBottom: 16,
  },
  stockQuantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  stockQuantityTextInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  stockPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
  },
  stockPreviewLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  stockPreviewValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#163974',
  },
  stockModalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  stockModalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
  },
  stockModalCancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  stockModalSubmitBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#163974',
    paddingVertical: 14,
    borderRadius: 12,
  },
  stockModalSubmitBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
