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
import PermissionGuard from '../../../src/components/PermissionGuard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Transaction type
interface Transaction {
  id: string;
  tenantId: string;
  type: string;
  amount: number;
  description: string;
  paymentType?: string;
  customerId?: string;
  customerName?: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  cost?: number;
  profit?: number;
  appointmentId?: string;
  packageId?: string;
  staffId?: string;
  staffName?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  cost?: number;
  stock: number;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
}

// Type configuration
const TYPE_CONFIG: Record<string, { bg: string; text: string; label: string; icon: string; gradient: [string, string] }> = {
  all: { bg: '#F3F4F6', text: '#374151', label: 'Tümü', icon: 'list', gradient: ['#6B7280', '#4B5563'] },
  income: { bg: '#D1FAE5', text: '#059669', label: 'Gelir', icon: 'trending-up', gradient: ['#10B981', '#059669'] },
  expense: { bg: '#FEE2E2', text: '#DC2626', label: 'Gider', icon: 'trending-down', gradient: ['#EF4444', '#DC2626'] },
  sale: { bg: '#DBEAFE', text: '#2563EB', label: 'Satış', icon: 'cart', gradient: ['#3B82F6', '#2563EB'] },
};

// Date filter options
const DATE_FILTERS = [
  { value: 'today', label: 'Bugün' },
  { value: 'week', label: 'Bu Hafta' },
  { value: 'month', label: 'Bu Ay' },
  { value: 'all', label: 'Tümü' },
];

// Payment type labels
const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Nakit',
  card: 'Kart',
  transfer: 'Havale',
};

export default function CashierScreen() {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, profit: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState('today');
  const [typeFilter, setTypeFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Modal states
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states - Income/Expense
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPaymentType, setFormPaymentType] = useState('cash');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  // Form states - Sale
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saleQuantity, setSaleQuantity] = useState('1');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Fetch transactions
  const fetchTransactions = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('dateFilter', dateFilter);
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      const response = await api.get(`/api/mobile/transactions?${params.toString()}`);
      setTransactions(response.data.data || []);
      setSummary(response.data.summary || { income: 0, expense: 0, profit: 0 });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch products and customers for sale modal
  const fetchProductsAndCustomers = async () => {
    try {
      const [productsRes, customersRes] = await Promise.all([
        api.get('/api/mobile/products'),
        api.get('/api/mobile/customers'),
      ]);
      setProducts(productsRes.data.data || []);
      setCustomers(customersRes.data.data || []);
    } catch (error) {
      console.error('Error fetching products/customers:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [dateFilter, typeFilter])
  );

  // Reset form
  const resetForm = () => {
    setFormAmount('');
    setFormDescription('');
    setFormPaymentType('cash');
    setFormDate(new Date().toISOString().split('T')[0]);
    setSelectedProduct(null);
    setSelectedCustomer(null);
    setSaleQuantity('1');
    setProductSearch('');
    setCustomerSearch('');
  };

  // Handle add income
  const handleAddIncome = async () => {
    if (!formAmount || !formDescription) {
      Alert.alert('Hata', 'Tutar ve açıklama zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/mobile/transactions', {
        type: 'income',
        amount: parseFloat(formAmount),
        description: formDescription.trim(),
        paymentType: formPaymentType,
        date: formDate,
      });

      if (response.data.success) {
        Alert.alert('Başarılı', 'Gelir eklendi');
        setShowIncomeModal(false);
        resetForm();
        fetchTransactions();
      } else {
        Alert.alert('Hata', response.data.message || 'Gelir eklenemedi');
      }
    } catch (error: any) {
      console.error('Add income error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle add expense
  const handleAddExpense = async () => {
    if (!formAmount || !formDescription) {
      Alert.alert('Hata', 'Tutar ve açıklama zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/mobile/transactions', {
        type: 'expense',
        amount: parseFloat(formAmount),
        description: formDescription.trim(),
        paymentType: formPaymentType,
        date: formDate,
      });

      if (response.data.success) {
        Alert.alert('Başarılı', 'Gider eklendi');
        setShowExpenseModal(false);
        resetForm();
        fetchTransactions();
      } else {
        Alert.alert('Hata', response.data.message || 'Gider eklenemedi');
      }
    } catch (error: any) {
      console.error('Add expense error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle add sale
  const handleAddSale = async () => {
    if (!selectedProduct) {
      Alert.alert('Hata', 'Ürün seçiniz');
      return;
    }

    const qty = parseInt(saleQuantity) || 1;
    if (qty > selectedProduct.stock) {
      Alert.alert('Hata', 'Yetersiz stok');
      return;
    }

    setIsSubmitting(true);
    try {
      const totalAmount = (selectedProduct.price || 0) * qty;
      const response = await api.post('/api/mobile/transactions', {
        type: 'sale',
        amount: totalAmount,
        description: `${selectedProduct.name} satışı`,
        paymentType: formPaymentType,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: qty,
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : null,
        date: formDate,
      });

      if (response.data.success) {
        Alert.alert('Başarılı', 'Satış eklendi');
        setShowSaleModal(false);
        resetForm();
        fetchTransactions();
      } else {
        Alert.alert('Hata', response.data.message || 'Satış eklenemedi');
      }
    } catch (error: any) {
      console.error('Add sale error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete transaction
  const handleDeleteTransaction = (transaction: Transaction) => {
    Alert.alert(
      'İşlemi Sil',
      `Bu işlemi silmek istediğinize emin misiniz?\n\n${transaction.description}`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/api/mobile/transactions/${transaction.id}`);
              if (response.data.success) {
                Alert.alert('Başarılı', 'İşlem silindi');
                setShowDetailModal(false);
                fetchTransactions();
              } else {
                Alert.alert('Hata', response.data.message || 'İşlem silinemedi');
              }
            } catch (error: any) {
              console.error('Delete transaction error:', error);
              Alert.alert('Hata', error.response?.data?.message || 'Bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.filter((p) => p.stock > 0);
    const query = productSearch.toLowerCase();
    return products.filter(
      (p) => p.stock > 0 && p.name.toLowerCase().includes(query)
    );
  }, [products, productSearch]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const query = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.firstName.toLowerCase().includes(query) ||
        c.lastName.toLowerCase().includes(query)
    );
  }, [customers, customerSearch]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  // Render date filter tabs
  const renderDateFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.dateFiltersContent}
    >
      {DATE_FILTERS.map((filter) => {
        const isActive = dateFilter === filter.value;
        return (
          <TouchableOpacity
            key={filter.value}
            style={[styles.dateFilterTab, isActive && styles.dateFilterTabActive]}
            onPress={() => setDateFilter(filter.value)}
          >
            <Text style={[styles.dateFilterText, isActive && styles.dateFilterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // Render summary cards
  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <View style={[styles.summaryCard, styles.incomeCard]}>
        <View style={styles.summaryIconWrapper}>
          <Ionicons name="trending-up" size={20} color="#059669" />
        </View>
        <Text style={styles.summaryLabel}>Gelir</Text>
        <Text style={[styles.summaryValue, { color: '#059669' }]}>
          {formatCurrency(summary.income)}
        </Text>
      </View>

      <View style={[styles.summaryCard, styles.expenseCard]}>
        <View style={styles.summaryIconWrapper}>
          <Ionicons name="trending-down" size={20} color="#DC2626" />
        </View>
        <Text style={styles.summaryLabel}>Gider</Text>
        <Text style={[styles.summaryValue, { color: '#DC2626' }]}>
          {formatCurrency(summary.expense)}
        </Text>
      </View>

      <View style={[styles.summaryCard, styles.profitCard]}>
        <View style={styles.summaryIconWrapper}>
          <Ionicons name="wallet" size={20} color="#2563EB" />
        </View>
        <Text style={styles.summaryLabel}>Net</Text>
        <Text style={[styles.summaryValue, { color: summary.profit >= 0 ? '#059669' : '#DC2626' }]}>
          {formatCurrency(summary.profit)}
        </Text>
      </View>
    </View>
  );

  // Render action buttons
  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={[styles.actionButton, styles.saleButton]}
        onPress={() => {
          fetchProductsAndCustomers();
          resetForm();
          setShowSaleModal(true);
        }}
      >
        <Ionicons name="cart" size={18} color="#fff" />
        <Text style={styles.actionButtonText}>Satış</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.incomeButton]}
        onPress={() => {
          resetForm();
          setShowIncomeModal(true);
        }}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.actionButtonText}>Gelir</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.expenseButton]}
        onPress={() => {
          resetForm();
          setShowExpenseModal(true);
        }}
      >
        <Ionicons name="remove" size={18} color="#fff" />
        <Text style={styles.actionButtonText}>Gider</Text>
      </TouchableOpacity>
    </View>
  );

  // Render transaction card
  const renderTransaction = ({ item }: { item: Transaction }) => {
    const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.income;
    const isExpense = item.type === 'expense';

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onPress={() => {
          setSelectedTransaction(item);
          setShowDetailModal(true);
        }}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={typeConfig.gradient}
          style={styles.cardAccent}
        />

        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <View style={[styles.typeIcon, { backgroundColor: typeConfig.bg }]}>
              <Ionicons name={typeConfig.icon as any} size={16} color={typeConfig.text} />
            </View>

            <View style={styles.transactionInfo}>
              <Text style={styles.transactionDesc} numberOfLines={1}>
                {item.description}
              </Text>
              <View style={styles.transactionMeta}>
                <Text style={styles.transactionDate}>
                  {new Date(item.date).toLocaleDateString('tr-TR')}
                </Text>
                {item.paymentType && (
                  <View style={styles.paymentBadge}>
                    <Text style={styles.paymentBadgeText}>
                      {PAYMENT_LABELS[item.paymentType] || item.paymentType}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={[
              styles.transactionAmount,
              isExpense ? styles.amountExpense : styles.amountIncome,
            ]}>
              {isExpense ? '-' : '+'}{formatCurrency(item.amount)}
            </Text>
          </View>

          {(item.customerName || item.productName) && (
            <View style={styles.cardBottomRow}>
              {item.customerName && (
                <View style={styles.detailChip}>
                  <Ionicons name="person-outline" size={12} color="#6B7280" />
                  <Text style={styles.detailChipText}>{item.customerName}</Text>
                </View>
              )}
              {item.productName && (
                <View style={styles.detailChip}>
                  <Ionicons name="cube-outline" size={12} color="#6B7280" />
                  <Text style={styles.detailChipText}>
                    {item.productName} {item.quantity && `(${item.quantity})`}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>İşlem bulunamadı</Text>
      <Text style={styles.emptySubtitle}>
        Bu dönemde kayıtlı işlem yok
      </Text>
    </View>
  );

  // Render income/expense modal
  const renderIncomeExpenseModal = (isExpense: boolean) => {
    const visible = isExpense ? showExpenseModal : showIncomeModal;
    const setVisible = isExpense ? setShowExpenseModal : setShowIncomeModal;
    const handleSubmit = isExpense ? handleAddExpense : handleAddIncome;
    const title = isExpense ? 'Yeni Gider' : 'Yeni Gelir';
    const buttonColor = isExpense ? '#DC2626' : '#059669';

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#163974', '#0F2A52']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  setVisible(false);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tutar (₺) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  value={formAmount}
                  onChangeText={setFormAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Açıklama *</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea]}
                  placeholder={isExpense ? 'Gider açıklaması...' : 'Gelir açıklaması...'}
                  placeholderTextColor="#9CA3AF"
                  value={formDescription}
                  onChangeText={setFormDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ödeme Tipi</Text>
                <View style={styles.paymentSelector}>
                  {['cash', 'card', 'transfer'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.paymentOption,
                        formPaymentType === type && styles.paymentOptionActive,
                      ]}
                      onPress={() => setFormPaymentType(type)}
                    >
                      <Ionicons
                        name={type === 'cash' ? 'cash' : type === 'card' ? 'card' : 'swap-horizontal'}
                        size={18}
                        color={formPaymentType === type ? '#fff' : '#6B7280'}
                      />
                      <Text
                        style={[
                          styles.paymentOptionText,
                          formPaymentType === type && styles.paymentOptionTextActive,
                        ]}
                      >
                        {PAYMENT_LABELS[type]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tarih</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  value={formDate}
                  onChangeText={setFormDate}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: buttonColor }, isSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name={isExpense ? 'remove' : 'add'} size={20} color="#fff" />
                    <Text style={styles.submitBtnText}>{isExpense ? 'Gider Ekle' : 'Gelir Ekle'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Render sale modal
  const renderSaleModal = () => (
    <Modal
      visible={showSaleModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSaleModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#163974', '#0F2A52']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Yeni Satış</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                setShowSaleModal(false);
                resetForm();
              }}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalBody}>
            {/* Product Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Ürün Seçin *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowProductPicker(true)}
              >
                <Ionicons name="cube-outline" size={20} color="#6B7280" />
                <Text style={[styles.pickerButtonText, selectedProduct && styles.pickerButtonTextSelected]}>
                  {selectedProduct ? `${selectedProduct.name} - ${formatCurrency(selectedProduct.price)}` : 'Ürün seçin'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
              {selectedProduct && (
                <Text style={styles.stockInfo}>Mevcut Stok: {selectedProduct.stock} adet</Text>
              )}
            </View>

            {/* Customer Selection (Optional) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Müşteri (Opsiyonel)</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowCustomerPicker(true)}
              >
                <Ionicons name="person-outline" size={20} color="#6B7280" />
                <Text style={[styles.pickerButtonText, selectedCustomer && styles.pickerButtonTextSelected]}>
                  {selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : 'Müşteri seçin'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Quantity */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Adet</Text>
              <TextInput
                style={styles.formInput}
                placeholder="1"
                placeholderTextColor="#9CA3AF"
                value={saleQuantity}
                onChangeText={setSaleQuantity}
                keyboardType="number-pad"
              />
            </View>

            {/* Payment Type */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Ödeme Tipi</Text>
              <View style={styles.paymentSelector}>
                {['cash', 'card', 'transfer'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.paymentOption,
                      formPaymentType === type && styles.paymentOptionActive,
                    ]}
                    onPress={() => setFormPaymentType(type)}
                  >
                    <Ionicons
                      name={type === 'cash' ? 'cash' : type === 'card' ? 'card' : 'swap-horizontal'}
                      size={18}
                      color={formPaymentType === type ? '#fff' : '#6B7280'}
                    />
                    <Text
                      style={[
                        styles.paymentOptionText,
                        formPaymentType === type && styles.paymentOptionTextActive,
                      ]}
                    >
                      {PAYMENT_LABELS[type]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Summary */}
            {selectedProduct && (
              <View style={styles.saleSummary}>
                <Text style={styles.saleSummaryTitle}>Özet</Text>
                <View style={styles.saleSummaryRow}>
                  <Text style={styles.saleSummaryLabel}>Birim Fiyat:</Text>
                  <Text style={styles.saleSummaryValue}>{formatCurrency(selectedProduct.price)}</Text>
                </View>
                <View style={styles.saleSummaryRow}>
                  <Text style={styles.saleSummaryLabel}>Adet:</Text>
                  <Text style={styles.saleSummaryValue}>{saleQuantity || 1}</Text>
                </View>
                <View style={[styles.saleSummaryRow, styles.saleSummaryTotal]}>
                  <Text style={styles.saleSummaryTotalLabel}>Toplam:</Text>
                  <Text style={styles.saleSummaryTotalValue}>
                    {formatCurrency(selectedProduct.price * (parseInt(saleQuantity) || 1))}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#059669' }, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleAddSale}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cart" size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>Satışı Kaydet</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Product Picker Modal */}
      <Modal
        visible={showProductPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProductPicker(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Ürün Seçin</Text>
              <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.pickerSearch}
              placeholder="Ürün ara..."
              placeholderTextColor="#9CA3AF"
              value={productSearch}
              onChangeText={setProductSearch}
            />
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedProduct(item);
                    setShowProductPicker(false);
                  }}
                >
                  <View>
                    <Text style={styles.pickerItemTitle}>{item.name}</Text>
                    <Text style={styles.pickerItemSubtitle}>
                      {formatCurrency(item.price)} • Stok: {item.stock}
                    </Text>
                  </View>
                  {selectedProduct?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#059669" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.pickerEmpty}>Ürün bulunamadı</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Customer Picker Modal */}
      <Modal
        visible={showCustomerPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomerPicker(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Müşteri Seçin</Text>
              <TouchableOpacity onPress={() => setShowCustomerPicker(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.pickerSearch}
              placeholder="Müşteri ara..."
              placeholderTextColor="#9CA3AF"
              value={customerSearch}
              onChangeText={setCustomerSearch}
            />
            <FlatList
              data={filteredCustomers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedCustomer(item);
                    setShowCustomerPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemTitle}>
                    {item.firstName} {item.lastName}
                  </Text>
                  {selectedCustomer?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#059669" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.pickerEmpty}>Müşteri bulunamadı</Text>
              }
            />
            {selectedCustomer && (
              <TouchableOpacity
                style={styles.clearSelection}
                onPress={() => {
                  setSelectedCustomer(null);
                  setShowCustomerPicker(false);
                }}
              >
                <Text style={styles.clearSelectionText}>Seçimi Temizle</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </Modal>
  );

  // Render detail modal
  const renderDetailModal = () => {
    if (!selectedTransaction) return null;
    const typeConfig = TYPE_CONFIG[selectedTransaction.type] || TYPE_CONFIG.income;
    const isExpense = selectedTransaction.type === 'expense';

    return (
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            <LinearGradient
              colors={typeConfig.gradient}
              style={styles.detailModalHeader}
            >
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowDetailModal(false)}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={styles.detailIconWrapper}>
                <Ionicons name={typeConfig.icon as any} size={32} color="#fff" />
              </View>
              <Text style={styles.detailAmount}>
                {isExpense ? '-' : '+'}{formatCurrency(selectedTransaction.amount)}
              </Text>
              <View style={styles.detailTypeBadge}>
                <Text style={styles.detailTypeBadgeText}>{typeConfig.label}</Text>
              </View>
            </LinearGradient>

            <ScrollView style={styles.detailBody}>
              <View style={styles.detailSection}>
                <View style={styles.detailRow}>
                  <Ionicons name="document-text" size={20} color="#6B7280" />
                  <View style={styles.detailRowContent}>
                    <Text style={styles.detailRowLabel}>Açıklama</Text>
                    <Text style={styles.detailRowValue}>{selectedTransaction.description}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={20} color="#6B7280" />
                  <View style={styles.detailRowContent}>
                    <Text style={styles.detailRowLabel}>Tarih</Text>
                    <Text style={styles.detailRowValue}>
                      {new Date(selectedTransaction.date).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>

                {selectedTransaction.paymentType && (
                  <View style={styles.detailRow}>
                    <Ionicons name="card" size={20} color="#6B7280" />
                    <View style={styles.detailRowContent}>
                      <Text style={styles.detailRowLabel}>Ödeme Tipi</Text>
                      <Text style={styles.detailRowValue}>
                        {PAYMENT_LABELS[selectedTransaction.paymentType] || selectedTransaction.paymentType}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedTransaction.customerName && (
                  <View style={styles.detailRow}>
                    <Ionicons name="person" size={20} color="#6B7280" />
                    <View style={styles.detailRowContent}>
                      <Text style={styles.detailRowLabel}>Müşteri</Text>
                      <Text style={styles.detailRowValue}>{selectedTransaction.customerName}</Text>
                    </View>
                  </View>
                )}

                {selectedTransaction.productName && (
                  <View style={styles.detailRow}>
                    <Ionicons name="cube" size={20} color="#6B7280" />
                    <View style={styles.detailRowContent}>
                      <Text style={styles.detailRowLabel}>Ürün</Text>
                      <Text style={styles.detailRowValue}>
                        {selectedTransaction.productName}
                        {selectedTransaction.quantity && ` (${selectedTransaction.quantity} adet)`}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedTransaction.profit !== undefined && selectedTransaction.profit !== null && (
                  <View style={styles.detailRow}>
                    <Ionicons name="analytics" size={20} color="#6B7280" />
                    <View style={styles.detailRowContent}>
                      <Text style={styles.detailRowLabel}>Kâr</Text>
                      <Text style={[styles.detailRowValue, { color: '#059669' }]}>
                        {formatCurrency(selectedTransaction.profit)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.detailFooter}>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteTransaction(selectedTransaction)}
              >
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
                <Text style={styles.deleteBtnText}>İşlemi Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <PermissionGuard permissionKey="kasa" pageName="Kasa">
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Header
        title="Kasa"
        subtitle="Gelir & Gider Yönetimi"
        onMenuPress={() => setDrawerOpen(true)}
        gradientColors={['#163974', '#1e4a8f']}
        stats={[
          { icon: 'trending-up', iconColor: '#059669', iconBg: '#D1FAE5', value: `₺${summary.income.toLocaleString('tr-TR')}`, label: 'Gelir' },
          { icon: 'trending-down', iconColor: '#DC2626', iconBg: '#FEE2E2', value: `₺${summary.expense.toLocaleString('tr-TR')}`, label: 'Gider' },
          { icon: 'wallet', iconColor: summary.profit >= 0 ? '#059669' : '#DC2626', iconBg: summary.profit >= 0 ? '#D1FAE5' : '#FEE2E2', value: `₺${summary.profit.toLocaleString('tr-TR')}`, label: 'Net' },
        ]}
      />

      {/* Date filters */}
      <View style={styles.dateFilters}>{renderDateFilters()}</View>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Action Buttons */}
      {renderActionButtons()}

      {/* Transaction list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#163974" />
          <Text style={styles.loadingText}>İşlemler yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchTransactions(true)}
              tintColor="#163974"
              colors={['#163974']}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Modals */}
      {renderIncomeExpenseModal(false)}
      {renderIncomeExpenseModal(true)}
      {renderSaleModal()}
      {renderDetailModal()}

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
  headerRight: {
    width: 40,
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

  // Date filters
  dateFilters: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateFiltersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  dateFilterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  dateFilterTabActive: {
    backgroundColor: '#163974',
  },
  dateFilterText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  dateFilterTextActive: {
    color: '#fff',
  },

  // Summary cards
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  incomeCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
  },
  expenseCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  profitCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  summaryIconWrapper: {
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  saleButton: {
    backgroundColor: '#059669',
  },
  incomeButton: {
    backgroundColor: '#2563EB',
  },
  expenseButton: {
    backgroundColor: '#DC2626',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
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

  // Transaction card
  transactionCard: {
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
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 10,
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  paymentBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paymentBadgeText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  amountIncome: {
    color: '#059669',
  },
  amountExpense: {
    color: '#DC2626',
  },
  cardBottomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 6,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  detailChipText: {
    fontSize: 11,
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
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
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },

  // Form styles
  formGroup: {
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
    textAlignVertical: 'top',
  },

  // Payment selector
  paymentSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  paymentOptionActive: {
    backgroundColor: '#163974',
  },
  paymentOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  paymentOptionTextActive: {
    color: '#fff',
  },

  // Submit button
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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

  // Picker button
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#9CA3AF',
  },
  pickerButtonTextSelected: {
    color: '#1F2937',
  },
  stockInfo: {
    fontSize: 12,
    color: '#059669',
    marginTop: 6,
    marginLeft: 4,
  },

  // Sale summary
  saleSummary: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  saleSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  saleSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  saleSummaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  saleSummaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  saleSummaryTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saleSummaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  saleSummaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },

  // Picker modal
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  pickerSearch: {
    margin: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  pickerItemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  pickerEmpty: {
    textAlign: 'center',
    padding: 40,
    color: '#9CA3AF',
  },
  clearSelection: {
    margin: 16,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    alignItems: 'center',
  },
  clearSelectionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },

  // Detail modal
  detailModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  detailModalHeader: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  detailIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  detailAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  detailTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  detailTypeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  detailBody: {
    padding: 20,
  },
  detailSection: {},
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  detailRowContent: {
    flex: 1,
  },
  detailRowLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  detailRowValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  detailFooter: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    gap: 8,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
});
