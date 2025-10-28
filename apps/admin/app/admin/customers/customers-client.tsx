"use client";

import { useState, useEffect } from 'react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge } from '@repo/ui';
import { Plus, Search, Edit, Trash2, Phone, Mail, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import AdminHeader from '../admin-header';
import { DataTable, Column } from '../../../components/DataTable';
import type { ClientUser } from '../../../lib/client-permissions';

interface CustomersClientProps {
  initialCustomers: any[];
  tenantId?: string;
  user: ClientUser;
}

export default function CustomersClient({ initialCustomers, tenantId, user }: CustomersClientProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [customers, setCustomers] = useState(initialCustomers);
  const [loading, setLoading] = useState(false);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
        setTotalCustomers(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/customers/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('Müşteri başarıyla silindi!');
          await fetchCustomers();
        } else {
          const errorData = await response.json();
          
          // Check for permission denied error
          if (response.status === 403 && errorData.code === 'INSUFFICIENT_PERMISSIONS') {
            alert('⛔ Yetki Hatası: Müşteri silme yetkiniz bulunmamaktadır.\n\nLütfen yöneticiniz ile iletişime geçin.');
            return;
          }
          
          throw new Error(errorData.error || 'Silme işlemi başarısız');
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Müşteri silinirken bir hata oluştu.');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Aktif</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Pasif</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Bilinmiyor</Badge>;
    }
  };

  // Filter by status
  const statusFilteredCustomers = statusFilter === 'all' 
    ? customers 
    : customers.filter(c => c.status === statusFilter);

  // Define table columns
  const columns: Column<any>[] = [
    {
      key: 'name',
      label: 'Müşteri',
      sortable: true,
      filterable: true,
      getValue: (customer) => `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
      render: (customer) => (
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => window.location.href = `/admin/customers/${customer.id}`}
        >
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <div className="font-medium text-gray-900">
              {`${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'İsimsiz'}
            </div>
            {customer.notes && (
              <div className="text-sm text-gray-500 truncate max-w-xs">{customer.notes}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'E-posta',
      sortable: true,
      filterable: true,
      render: (customer) => customer.email ? (
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="w-4 h-4 mr-1 flex-shrink-0" />
          {customer.email}
        </div>
      ) : '-'
    },
    {
      key: 'phone',
      label: 'Telefon',
      sortable: true,
      filterable: true,
      render: (customer) => customer.phone ? (
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="w-4 h-4 mr-1 flex-shrink-0" />
          {customer.phone}
        </div>
      ) : '-'
    },
    {
      key: 'createdAt',
      label: 'Kayıt Tarihi',
      sortable: true,
      getValue: (customer) => new Date(customer.createdAt).getTime(),
      render: (customer) => (
        <div className="text-sm text-gray-900">
          {new Date(customer.createdAt).toLocaleDateString('tr-TR')}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Durum',
      sortable: true,
      render: (customer) => getStatusBadge(customer.status)
    },
    {
      key: 'actions',
      label: 'İşlemler',
      render: (customer) => (
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          <Link href={`/admin/customers/${customer.id}/edit`}>
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 hover:bg-blue-50"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(customer.id)}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading && customers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader user={user} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Müşteriler yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                <User className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="truncate">Müşteri Yönetimi</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">Müşterilerinizi görüntüleyin ve yönetin</p>
            </div>
            
            <Link href="/admin/customers/new" className="w-full sm:w-auto flex-shrink-0">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Müşteri Ekle
              </Button>
            </Link>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mb-2 sm:mb-0">
                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Toplam Müşteri</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalCustomers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="p-2 bg-green-100 rounded-lg mb-2 sm:mb-0">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div className="sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Bu Ay Yeni</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {customers.filter(c => {
                        const customerDate = new Date(c.createdAt);
                        const now = new Date();
                        return customerDate.getMonth() === now.getMonth() && 
                               customerDate.getFullYear() === now.getFullYear();
                      }).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="p-2 bg-purple-100 rounded-lg mb-2 sm:mb-0">
                    <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <div className="sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">E-posta Olan</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {customers.filter(c => c.email).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="p-2 bg-orange-100 rounded-lg mb-2 sm:mb-0">
                    <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  </div>
                  <div className="sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Telefon Olan</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {customers.filter(c => c.phone).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Filter */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="w-full md:w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durum Filtresi
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Müşteri Listesi with DataTable */}
          <Card>
            <CardHeader>
              <CardTitle>Müşteri Listesi</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Yükleniyor...</p>
                </div>
              ) : statusFilteredCustomers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">
                    {statusFilter !== 'all' ? 'Bu durumda müşteri bulunamadı' : 'Henüz müşteri eklenmemiş'}
                  </p>
                  {statusFilter === 'all' && (
                    <p className="text-gray-400">İlk müşterinizi eklemek için yukarıdaki butonu kullanın</p>
                  )}
                </div>
              ) : (
                <DataTable
                  data={statusFilteredCustomers}
                  columns={columns}
                  keyExtractor={(customer) => customer.id}
                  emptyMessage="Arama kriterlerinize uygun müşteri bulunamadı"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
