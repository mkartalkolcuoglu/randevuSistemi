'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@repo/ui';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  ShoppingCart,
  Receipt,
  Wallet
} from 'lucide-react';
import AdminHeader from '../admin-header';
import type { AuthenticatedUser } from '../../../lib/auth-utils';
import { DataTable, Column } from '../../../components/DataTable';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  paymentType?: string;
  customerName?: string;
  productName?: string;
  quantity?: number;
  profit?: number;
  date: string;
  createdAt: string;
}

interface Summary {
  income: number;
  expense: number;
  profit: number;
  totalProfit: number;
}

interface KasaClientProps {
  tenantId: string;
  user: AuthenticatedUser;
}

export default function KasaClient({ tenantId, user }: KasaClientProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({
    income: 0,
    expense: 0,
    profit: 0,
    totalProfit: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Modals
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [dateFilter, customStartDate, customEndDate]);

  const getDateRange = () => {
    const today = new Date();
    let startDate = '';
    let endDate = today.toISOString().split('T')[0];

    switch (dateFilter) {
      case 'today':
        startDate = endDate;
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      case 'custom':
        startDate = customStartDate;
        endDate = customEndDate;
        break;
      default:
        startDate = '';
        endDate = '';
    }

    return { startDate, endDate };
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      
      const params = new URLSearchParams({
        tenantId: tenantId,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      const response = await fetch(`/api/transactions?${params}`);
      const data = await response.json();

      if (data.success) {
        setTransactions(data.data);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) return;

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchTransactions();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sale': return 'Satış';
      case 'income': return 'Gelir';
      case 'expense': return 'Gider';
      case 'appointment': return 'Randevu';
      case 'package': return 'Paket Satışı';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sale':
      case 'income':
      case 'appointment':
      case 'package':
        return 'text-green-600 bg-green-50';
      case 'expense':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPaymentTypeLabel = (type?: string) => {
    switch (type) {
      case 'cash': return 'Nakit';
      case 'card': return 'Kart';
      case 'transfer': return 'Havale';
      default: return '-';
    }
  };

  // Define table columns
  const columns: Column<Transaction>[] = [
    {
      key: 'date',
      label: 'Tarih',
      sortable: true,
      filterable: true,
      getValue: (transaction) => new Date(transaction.date).getTime(),
      render: (transaction) => (
        <div className="text-sm text-gray-900">
          {new Date(transaction.date).toLocaleDateString('tr-TR')}
        </div>
      )
    },
    {
      key: 'type',
      label: 'Tip',
      sortable: true,
      filterable: true,
      getValue: (transaction) => getTypeLabel(transaction.type),
      render: (transaction) => (
        <Badge className={getTypeColor(transaction.type)}>
          {getTypeLabel(transaction.type)}
        </Badge>
      )
    },
    {
      key: 'description',
      label: 'Açıklama',
      sortable: true,
      filterable: true,
      render: (transaction) => (
        <div>
          <div className="text-sm text-gray-900">{transaction.description}</div>
          {transaction.customerName && (
            <div className="text-xs text-gray-500">Müşteri: {transaction.customerName}</div>
          )}
          {transaction.productName && (
            <div className="text-xs text-gray-500">
              Ürün: {transaction.productName} {transaction.quantity && `(${transaction.quantity} adet)`}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'paymentType',
      label: 'Ödeme',
      sortable: true,
      filterable: true,
      getValue: (transaction) => getPaymentTypeLabel(transaction.paymentType),
      render: (transaction) => (
        <div className="text-sm text-gray-600">
          {getPaymentTypeLabel(transaction.paymentType)}
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Tutar',
      sortable: true,
      render: (transaction) => (
        <div className={`text-sm font-semibold text-right ${
          transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
        }`}>
          {transaction.type === 'expense' ? '-' : '+'}₺{transaction.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'İşlemler',
      render: (transaction) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingTransaction(transaction);
              if (transaction.type === 'sale') setShowSaleModal(true);
              else if (transaction.type === 'income' || transaction.type === 'appointment') setShowIncomeModal(true);
              else setShowExpenseModal(true);
            }}
            className="text-blue-600 hover:bg-blue-50"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(transaction.id)}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <>
      <AdminHeader user={user} />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">Yükleniyor...</div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Kasa Yönetimi</h1>
                <p className="text-gray-600 mt-1">Gelir, gider ve satışlarınızı yönetin</p>
              </div>
            </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarih Filtresi
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Bugün</option>
                <option value="week">Bu Hafta</option>
                <option value="month">Bu Ay</option>
                <option value="all">Tüm Zamanlar</option>
                <option value="custom">Özel Tarih</option>
              </select>
            </div>

            {dateFilter === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlangıç
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bitiş
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  ₺{summary.income.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Gider</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  ₺{summary.expense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Kâr</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  ₺{summary.profit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={() => setShowSaleModal(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Satış Ekle
        </Button>
        <Button
          onClick={() => setShowIncomeModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Gelir Ekle
        </Button>
        <Button
          onClick={() => setShowExpenseModal(true)}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Gider Ekle
        </Button>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>İşlem Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">Henüz işlem bulunmuyor</p>
            </div>
          ) : (
            <DataTable
              data={transactions}
              columns={columns}
              keyExtractor={(transaction) => transaction.id}
              emptyMessage="Arama kriterlerinize uygun işlem bulunamadı"
            />
          )}
        </CardContent>
      </Card>

      {/* Modals will be added in separate files */}
      {showSaleModal && (
        <SaleModal
          isOpen={showSaleModal}
          onClose={() => {
            setShowSaleModal(false);
            setEditingTransaction(null);
          }}
          onSuccess={fetchTransactions}
          tenantId={tenantId}
          editingTransaction={editingTransaction}
        />
      )}

      {showIncomeModal && (
        <IncomeModal
          isOpen={showIncomeModal}
          onClose={() => {
            setShowIncomeModal(false);
            setEditingTransaction(null);
          }}
          onSuccess={fetchTransactions}
          tenantId={tenantId}
          editingTransaction={editingTransaction}
        />
      )}

      {showExpenseModal && (
        <ExpenseModal
          isOpen={showExpenseModal}
          onClose={() => {
            setShowExpenseModal(false);
            setEditingTransaction(null);
          }}
          onSuccess={fetchTransactions}
          tenantId={tenantId}
          editingTransaction={editingTransaction}
        />
      )}
          </div>
        )}
      </div>
    </>
  );
}

// Modal components will be imported from separate files
import SaleModal from './modals/SaleModal';
import IncomeModal from './modals/IncomeModal';
import ExpenseModal from './modals/ExpenseModal';

