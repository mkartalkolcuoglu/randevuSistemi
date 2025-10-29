"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@repo/ui';
import { AlertTriangle, UserX, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AdminHeader from '../admin-header';
import { DataTable, Column } from '../../../components/DataTable';

export default function BlacklistPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlacklistedCustomers();
  }, []);

  const fetchBlacklistedCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customers?blacklisted=true');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching blacklisted customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromBlacklist = async (customerId: string, customerName: string) => {
    if (!confirm(`${customerName} kişisini kara listeden çıkarmak istediğinizden emin misiniz?\n\nNot: Gelmedi sayısı sıfırlanmayacaktır.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${customerId}/blacklist`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Müşteri kara listeden çıkarıldı!');
        fetchBlacklistedCustomers();
      } else {
        const data = await response.json();
        alert(data.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Error removing from blacklist:', error);
      alert('Kara listeden çıkarılırken hata oluştu');
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'name',
      label: 'Müşteri',
      sortable: true,
      filterable: true,
      render: (customer) => (
        <div>
          <div className="font-medium text-gray-900">
            {customer.firstName} {customer.lastName}
          </div>
          <div className="text-sm text-gray-500">{customer.phone}</div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'E-posta',
      sortable: true,
      filterable: true,
      render: (customer) => (
        <span className="text-sm text-gray-700">{customer.email || '-'}</span>
      )
    },
    {
      key: 'noShowCount',
      label: 'Gelmedi Sayısı',
      sortable: true,
      getValue: (customer) => customer.noShowCount,
      render: (customer) => (
        <Badge className="bg-orange-100 text-orange-800">
          {customer.noShowCount} defa
        </Badge>
      )
    },
    {
      key: 'blacklistedAt',
      label: 'Kara Liste Tarihi',
      sortable: true,
      getValue: (customer) => customer.blacklistedAt ? new Date(customer.blacklistedAt).getTime() : 0,
      render: (customer) => (
        <span className="text-sm text-gray-700">
          {customer.blacklistedAt ? new Date(customer.blacklistedAt).toLocaleDateString('tr-TR') : '-'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'İşlemler',
      sortable: false,
      filterable: false,
      render: (customer) => (
        <div className="flex gap-2">
          <Link href={`/admin/customers/${customer.id}`}>
            <Button variant="outline" size="sm">
              Detay
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRemoveFromBlacklist(customer.id, `${customer.firstName} ${customer.lastName}`)}
            className="text-green-600 hover:text-green-700 border-green-300 hover:border-green-400"
          >
            <Check className="w-4 h-4 mr-1" />
            Çıkar
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader user={{ businessName: 'Yükleniyor...' } as any} />
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={{ businessName: 'Admin' } as any} />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Dashboard'a Dön
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <UserX className="w-8 h-8 mr-3 text-red-600" />
                Kara Liste
              </h1>
              <p className="text-gray-600 mt-1">
                Randevularına gelmeyen müşterileri görüntüleyin ve yönetin
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <UserX className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Kara Listede</p>
                  <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Gelmedi</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.reduce((sum, c) => sum + c.noShowCount, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Check className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ortalama Gelmedi</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.length > 0 
                      ? (customers.reduce((sum, c) => sum + c.noShowCount, 0) / customers.length).toFixed(1)
                      : '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blacklist Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Kara Listedeki Müşteriler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <div className="text-center py-12">
                <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Kara listede müşteri yok
                </h3>
                <p className="text-gray-600">
                  Randevularına gelmeyen müşteriler otomatik olarak bu listeye eklenecektir.
                </p>
              </div>
            ) : (
              <DataTable
                data={customers}
                columns={columns}
                keyExtractor={(customer) => customer.id}
                emptyMessage="Kara listede müşteri bulunamadı"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

