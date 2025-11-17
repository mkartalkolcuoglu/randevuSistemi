"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { DollarSign, Calendar, Building2, Package, ShoppingCart, User } from 'lucide-react';
import AdminHeader from '../admin-header';
import { DataTable, Column } from '../../../components/DataTable';

interface Payment {
  id: string;
  tenantId: string | null;
  tenantName: string;
  customerName: string | null;
  amount: number;
  paymentType: string | null;
  status: string;
  paidAt: Date | null;
  createdAt: Date;
  serviceName: string | null;
  packageName: string | null;
  productName: string | null;
}

interface PaymentFlowClientProps {
  payments: Payment[];
}

export default function PaymentFlowClient({ payments }: PaymentFlowClientProps) {
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tenantFilter, setTenantFilter] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');

  // Filtreleme
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesDate = !dateFilter || (payment.paidAt && new Date(payment.paidAt).toISOString().split('T')[0] === dateFilter);
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      const matchesTenant = !tenantFilter || payment.tenantName.toLowerCase().includes(tenantFilter.toLowerCase());
      const matchesPaymentType = paymentTypeFilter === 'all' || payment.paymentType === paymentTypeFilter;

      return matchesDate && matchesStatus && matchesTenant && matchesPaymentType;
    });
  }, [payments, dateFilter, statusFilter, tenantFilter, paymentTypeFilter]);

  // Unique tenant listesi
  const uniqueTenants = useMemo(() => {
    const tenants = new Set(payments.map(p => p.tenantName));
    return Array.from(tenants).sort();
  }, [payments]);

  // İstatistikler
  const stats = useMemo(() => {
    const total = filteredPayments.length;
    const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const cardPayments = filteredPayments.filter(p => p.paymentType === 'card').length;
    const eftPayments = filteredPayments.filter(p => p.paymentType === 'eft').length;

    return { total, totalAmount, cardPayments, eftPayments };
  }, [filteredPayments]);

  const getPaymentTypeColor = (type: string | null) => {
    switch (type) {
      case 'card':
        return 'bg-blue-100 text-blue-800';
      case 'eft':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentTypeText = (type: string | null) => {
    switch (type) {
      case 'card':
        return 'Kredi Kartı';
      case 'eft':
        return 'Havale/EFT';
      default:
        return 'Bilinmiyor';
    }
  };

  const getItemName = (payment: Payment) => {
    if (payment.serviceName) return payment.serviceName;
    if (payment.packageName) return payment.packageName;
    if (payment.productName) return payment.productName;
    return 'Bilinmiyor';
  };

  const getItemType = (payment: Payment) => {
    if (payment.serviceName) return 'Hizmet';
    if (payment.packageName) return 'Paket';
    if (payment.productName) return 'Ürün';
    return '-';
  };

  // Tablo kolonları
  const columns: Column<Payment>[] = [
    {
      key: 'paidAt',
      label: 'Tarih/Saat',
      sortable: true,
      getValue: (payment) => payment.paidAt ? new Date(payment.paidAt).getTime() : 0,
      render: (payment) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('tr-TR') : '-'}
          </div>
          <div className="text-gray-500 text-xs">
            {payment.paidAt ? new Date(payment.paidAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'}
          </div>
        </div>
      )
    },
    {
      key: 'tenantName',
      label: 'İşletme',
      sortable: true,
      filterable: true,
      render: (payment) => (
        <div className="flex items-center">
          <Building2 className="w-4 h-4 mr-2 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">{payment.tenantName}</span>
        </div>
      )
    },
    {
      key: 'customerName',
      label: 'Müşteri',
      sortable: true,
      filterable: true,
      render: (payment) => (
        <div className="flex items-center">
          <User className="w-4 h-4 mr-2 text-gray-400" />
          <span className="text-sm text-gray-900">{payment.customerName || 'Bilinmiyor'}</span>
        </div>
      )
    },
    {
      key: 'item',
      label: 'Ürün/Hizmet',
      sortable: true,
      getValue: (payment) => getItemName(payment),
      render: (payment) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{getItemName(payment)}</div>
          <div className="text-xs text-gray-500">{getItemType(payment)}</div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Tutar',
      sortable: true,
      getValue: (payment) => payment.amount,
      render: (payment) => (
        <div className="text-sm font-semibold text-gray-900">
          {payment.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
        </div>
      )
    },
    {
      key: 'paymentType',
      label: 'Ödeme Tipi',
      sortable: true,
      render: (payment) => (
        <Badge className={getPaymentTypeColor(payment.paymentType)}>
          {getPaymentTypeText(payment.paymentType)}
        </Badge>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={{
        id: 'project-admin',
        username: 'project-admin',
        tenantId: 'project-admin',
        businessName: 'Project Admin',
        role: 'project_admin',
        permissions: {} as any
      }} />

      <div className="container mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Ödeme Akışı</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Tüm kredi kartı ve havale ödemelerini görüntüleyin
          </p>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Ödeme</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Tutar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Kredi Kartı</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.cardPayments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Havale/EFT</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.eftPayments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtreler ve Tablo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Ödeme Listesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filtreler */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 pb-6 border-b">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Tarih
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {dateFilter && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDateFilter('')}
                      className="px-2"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Ödeme Tipi
                </label>
                <select
                  value={paymentTypeFilter}
                  onChange={(e) => setPaymentTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tümü</option>
                  <option value="card">Kredi Kartı</option>
                  <option value="eft">Havale/EFT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  İşletme Ara
                </label>
                <input
                  type="text"
                  value={tenantFilter}
                  onChange={(e) => setTenantFilter(e.target.value)}
                  placeholder="İşletme adı..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateFilter('');
                    setStatusFilter('all');
                    setTenantFilter('');
                    setPaymentTypeFilter('all');
                  }}
                  className="w-full text-gray-600 hover:text-gray-900"
                >
                  Filtreleri Temizle
                </Button>
              </div>
            </div>

            {/* Tablo */}
            {filteredPayments.length === 0 ? (
              <div className="p-8 text-center">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ödeme bulunamadı</h3>
                <p className="text-gray-600">
                  {dateFilter || tenantFilter || paymentTypeFilter !== 'all'
                    ? 'Filtre kriterlerinize uygun ödeme bulunamadı.'
                    : 'Henüz ödeme kaydı bulunmuyor.'}
                </p>
              </div>
            ) : (
              <DataTable
                data={filteredPayments}
                columns={columns}
                keyExtractor={(payment) => payment.id}
                emptyMessage="Ödeme bulunamadı"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
