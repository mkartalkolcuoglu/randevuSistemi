import { useState, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';

// Transaction type configuration
const TRANSACTION_TYPES: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  income: { bg: '#D1FAE5', text: '#059669', label: 'Gelir', icon: 'arrow-down-circle' },
  expense: { bg: '#FEE2E2', text: '#DC2626', label: 'Gider', icon: 'arrow-up-circle' },
};

// Payment method configuration
const PAYMENT_METHODS: Record<string, { label: string; icon: string }> = {
  cash: { label: 'Nakit', icon: 'cash-outline' },
  card: { label: 'Kart', icon: 'card-outline' },
  transfer: { label: 'Havale', icon: 'swap-horizontal-outline' },
};

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  paymentMethod: string;
  date: string;
  customerName?: string;
  appointmentId?: string;
}

interface DailySummary {
  date: string;
  totalIncome: number;
  totalExpense: number;
  transactions: Transaction[];
}

export default function CashierScreen() {
  const router = useRouter();

  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense'>('all');

  // New transaction form state
  const [newTransaction, setNewTransaction] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    description: '',
    category: '',
    paymentMethod: 'cash',
  });

  // Fetch transactions (mock data for now)
  const fetchTransactions = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // Mock data - in production, this would be an API call
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'income',
          amount: 250,
          description: 'Saç kesimi + Sakal',
          category: 'Hizmet',
          paymentMethod: 'cash',
          date: new Date().toISOString().split('T')[0],
          customerName: 'Ahmet Yılmaz',
        },
        {
          id: '2',
          type: 'income',
          amount: 180,
          description: 'Saç boyama',
          category: 'Hizmet',
          paymentMethod: 'card',
          date: new Date().toISOString().split('T')[0],
          customerName: 'Mehmet Demir',
        },
        {
          id: '3',
          type: 'expense',
          amount: 500,
          description: 'Malzeme alımı',
          category: 'Malzeme',
          paymentMethod: 'transfer',
          date: new Date().toISOString().split('T')[0],
        },
        {
          id: '4',
          type: 'income',
          amount: 150,
          description: 'Saç kesimi',
          category: 'Hizmet',
          paymentMethod: 'cash',
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          customerName: 'Ali Kaya',
        },
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [])
  );

  // Calculate summary
  const summary = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter((t) => t.date === today);

    const todayIncome = todayTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const todayExpense = todayTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      todayIncome,
      todayExpense,
      todayNet: todayIncome - todayExpense,
      totalIncome,
      totalExpense,
      totalNet: totalIncome - totalExpense,
    };
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (activeFilter !== 'all') {
      result = result.filter((t) => t.type === activeFilter);
    }

    // Sort by date (newest first)
    result.sort((a, b) => b.date.localeCompare(a.date));

    return result;
  }, [transactions, activeFilter]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: DailySummary[] = [];
    const dateMap = new Map<string, Transaction[]>();

    filteredTransactions.forEach((t) => {
      const existing = dateMap.get(t.date) || [];
      dateMap.set(t.date, [...existing, t]);
    });

    dateMap.forEach((trans, date) => {
      const income = trans.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = trans.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      groups.push({ date, totalIncome: income, totalExpense: expense, transactions: trans });
    });

    return groups.sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTransactions]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('tr-TR') + ' ₺';
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'Bugün';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Dün';

    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  // Handle add transaction
  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description) {
      Alert.alert('Hata', 'Tutar ve açıklama zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      // In production, this would be an API call
      const transaction: Transaction = {
        id: Date.now().toString(),
        type: newTransaction.type,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        category: newTransaction.category || 'Diğer',
        paymentMethod: newTransaction.paymentMethod,
        date: new Date().toISOString().split('T')[0],
      };

      setTransactions((prev) => [transaction, ...prev]);
      setShowAddModal(false);
      setNewTransaction({
        type: 'income',
        amount: '',
        description: '',
        category: '',
        paymentMethod: 'cash',
      });
      Alert.alert('Başarılı', 'İşlem eklendi');
    } catch (error) {
      Alert.alert('Hata', 'İşlem eklenemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render transaction item
  const renderTransaction = ({ item }: { item: Transaction }) => {
    const typeConfig = TRANSACTION_TYPES[item.type];
    const paymentConfig = PAYMENT_METHODS[item.paymentMethod];

    return (
      <TouchableOpacity style={styles.transactionCard} activeOpacity={0.7}>
        <View style={[styles.transactionIcon, { backgroundColor: typeConfig.bg }]}>
          <Ionicons name={typeConfig.icon as any} size={20} color={typeConfig.text} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDesc} numberOfLines={1}>
            {item.description}
          </Text>
          <View style={styles.transactionMeta}>
            {item.customerName && (
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={12} color="#9CA3AF" />
                <Text style={styles.metaText}>{item.customerName}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name={paymentConfig.icon as any} size={12} color="#9CA3AF" />
              <Text style={styles.metaText}>{paymentConfig.label}</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.transactionAmount, { color: typeConfig.text }]}>
          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render date group
  const renderDateGroup = ({ item }: { item: DailySummary }) => (
    <View style={styles.dateGroup}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateTitle}>{formatDate(item.date)}</Text>
        <View style={styles.dateSummary}>
          <Text style={styles.dateSummaryIncome}>+{formatCurrency(item.totalIncome)}</Text>
          {item.totalExpense > 0 && (
            <Text style={styles.dateSummaryExpense}>-{formatCurrency(item.totalExpense)}</Text>
          )}
        </View>
      </View>
      {item.transactions.map((t) => (
        <View key={t.id}>{renderTransaction({ item: t })}</View>
      ))}
    </View>
  );

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
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Yeni İşlem</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Type selector */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>İşlem Tipi</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newTransaction.type === 'income' && styles.typeButtonActiveIncome,
                  ]}
                  onPress={() => setNewTransaction((prev) => ({ ...prev, type: 'income' }))}
                >
                  <Ionicons
                    name="arrow-down-circle"
                    size={20}
                    color={newTransaction.type === 'income' ? '#059669' : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      newTransaction.type === 'income' && styles.typeButtonTextActiveIncome,
                    ]}
                  >
                    Gelir
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newTransaction.type === 'expense' && styles.typeButtonActiveExpense,
                  ]}
                  onPress={() => setNewTransaction((prev) => ({ ...prev, type: 'expense' }))}
                >
                  <Ionicons
                    name="arrow-up-circle"
                    size={20}
                    color={newTransaction.type === 'expense' ? '#DC2626' : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      newTransaction.type === 'expense' && styles.typeButtonTextActiveExpense,
                    ]}
                  >
                    Gider
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Tutar *</Text>
              <View style={styles.amountInputWrapper}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={newTransaction.amount}
                  onChangeText={(text) =>
                    setNewTransaction((prev) => ({ ...prev, amount: text.replace(/[^0-9.]/g, '') }))
                  }
                  keyboardType="decimal-pad"
                />
                <Text style={styles.currencyLabel}>₺</Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Açıklama *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="İşlem açıklaması..."
                placeholderTextColor="#9CA3AF"
                value={newTransaction.description}
                onChangeText={(text) =>
                  setNewTransaction((prev) => ({ ...prev, description: text }))
                }
              />
            </View>

            {/* Category */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Kategori</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ör: Hizmet, Malzeme, Fatura..."
                placeholderTextColor="#9CA3AF"
                value={newTransaction.category}
                onChangeText={(text) =>
                  setNewTransaction((prev) => ({ ...prev, category: text }))
                }
              />
            </View>

            {/* Payment method */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Ödeme Yöntemi</Text>
              <View style={styles.paymentMethods}>
                {Object.entries(PAYMENT_METHODS).map(([key, config]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.paymentMethod,
                      newTransaction.paymentMethod === key && styles.paymentMethodActive,
                    ]}
                    onPress={() => setNewTransaction((prev) => ({ ...prev, paymentMethod: key }))}
                  >
                    <Ionicons
                      name={config.icon as any}
                      size={20}
                      color={newTransaction.paymentMethod === key ? '#3B82F6' : '#9CA3AF'}
                    />
                    <Text
                      style={[
                        styles.paymentMethodText,
                        newTransaction.paymentMethod === key && styles.paymentMethodTextActive,
                      ]}
                    >
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Submit button */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleAddTransaction}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>İşlem Ekle</Text>
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
        <Text style={styles.title}>Kasa</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary Cards */}
      <View style={styles.summarySection}>
        <View style={styles.mainSummaryCard}>
          <Text style={styles.mainSummaryLabel}>Bugünkü Net</Text>
          <Text
            style={[
              styles.mainSummaryValue,
              { color: summary.todayNet >= 0 ? '#059669' : '#DC2626' },
            ]}
          >
            {summary.todayNet >= 0 ? '+' : ''}{formatCurrency(summary.todayNet)}
          </Text>
          <View style={styles.mainSummaryDetails}>
            <View style={styles.summaryDetail}>
              <Ionicons name="arrow-down-circle" size={14} color="#059669" />
              <Text style={styles.summaryDetailText}>
                Gelir: {formatCurrency(summary.todayIncome)}
              </Text>
            </View>
            <View style={styles.summaryDetail}>
              <Ionicons name="arrow-up-circle" size={14} color="#DC2626" />
              <Text style={styles.summaryDetailText}>
                Gider: {formatCurrency(summary.todayExpense)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'income', 'expense'] as const).map((filter) => {
          const isActive = activeFilter === filter;
          const config =
            filter === 'all'
              ? { bg: '#F3F4F6', text: '#374151', label: 'Tümü' }
              : TRANSACTION_TYPES[filter];

          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterTab, isActive && { backgroundColor: config.bg }]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterTabText, isActive && { color: config.text }]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Transactions list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={groupedTransactions}
          renderItem={renderDateGroup}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchTransactions(true)}
              tintColor="#3B82F6"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrapper}>
                <Ionicons name="wallet-outline" size={48} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>Henüz işlem yok</Text>
              <Text style={styles.emptySubtitle}>
                İşlem eklemek için + butonuna basın
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

      {/* Add Modal */}
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

  // Summary
  summarySection: {
    padding: 16,
    backgroundColor: '#fff',
  },
  mainSummaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  mainSummaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  mainSummaryValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  mainSummaryDetails: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
  },
  summaryDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryDetailText: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Filter tabs
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
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

  // Date group
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  dateSummary: {
    flexDirection: 'row',
    gap: 12,
  },
  dateSummaryIncome: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  dateSummaryExpense: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Transaction card
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionDesc: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  transactionMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
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
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  typeButtonActiveIncome: {
    backgroundColor: '#D1FAE5',
  },
  typeButtonActiveExpense: {
    backgroundColor: '#FEE2E2',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  typeButtonTextActiveIncome: {
    color: '#059669',
  },
  typeButtonTextActiveExpense: {
    color: '#DC2626',
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    paddingVertical: 14,
  },
  currencyLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentMethod: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  paymentMethodActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  paymentMethodTextActive: {
    color: '#3B82F6',
  },
  modalActions: {
    padding: 20,
    paddingTop: 12,
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
