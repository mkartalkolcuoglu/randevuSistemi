'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
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

export default function KasaClient() {
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

  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;

  useEffect(() => {
    if (tenantId) {
      fetchTransactions();
    }
  }, [tenantId, dateFilter, customStartDate, customEndDate]);

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
        tenantId: tenantId!,
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
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sale':
      case 'income':
      case 'appointment':
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

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  return (
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tarih</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tip</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Açıklama</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ödeme</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Tutar</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Kâr</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      Henüz işlem bulunmuyor
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">
                        {new Date(transaction.date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                          {getTypeLabel(transaction.type)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        <div>
                          {transaction.description}
                          {transaction.customerName && (
                            <div className="text-xs text-gray-500">Müşteri: {transaction.customerName}</div>
                          )}
                          {transaction.productName && (
                            <div className="text-xs text-gray-500">
                              Ürün: {transaction.productName} {transaction.quantity && `(${transaction.quantity} adet)`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {getPaymentTypeLabel(transaction.paymentType)}
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'expense' ? '-' : '+'}₺{transaction.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {transaction.profit ? `₺${transaction.profit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingTransaction(transaction);
                              if (transaction.type === 'sale') setShowSaleModal(true);
                              else if (transaction.type === 'income' || transaction.type === 'appointment') setShowIncomeModal(true);
                              else setShowExpenseModal(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
          tenantId={tenantId!}
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
          tenantId={tenantId!}
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
          tenantId={tenantId!}
          editingTransaction={editingTransaction}
        />
      )}
    </div>
  );
}

// Modal components will be imported from separate files
import SaleModal from './modals/SaleModal';
import IncomeModal from './modals/IncomeModal';
import ExpenseModal from './modals/ExpenseModal';

