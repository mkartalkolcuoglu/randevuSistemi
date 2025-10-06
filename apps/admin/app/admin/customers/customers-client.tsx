"use client";

import { useState, useEffect } from 'react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge } from '@repo/ui';
import { Plus, Search, Edit, Trash2, Phone, Mail, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import AdminHeader from '../admin-header';
import type { AuthenticatedUser } from '../../../lib/auth-utils';

interface CustomersClientProps {
  initialCustomers: any[];
  tenantId?: string;
  user: AuthenticatedUser;
}

export default function CustomersClient({ initialCustomers, tenantId, user }: CustomersClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customers, setCustomers] = useState(initialCustomers);
  const [loading, setLoading] = useState(false);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm || statusFilter !== 'all') {
      fetchCustomers();
    }
  }, [searchTerm, statusFilter]);

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
          throw new Error('Silme işlemi başarısız');
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

  const filteredCustomers = customers.filter(customer => {
    const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
    const matchesSearch = 
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <User className="w-8 h-8 mr-3" />
                Müşteri Yönetimi
              </h1>
              <p className="text-gray-600 mt-2">Müşterilerinizi görüntüleyin ve yönetin</p>
            </div>
            
            <Link href="/admin/customers/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Müşteri Ekle
              </Button>
            </Link>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <User className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Toplam Müşteri</p>
                    <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Bu Ay Yeni</p>
                    <p className="text-2xl font-bold text-gray-900">
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
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Mail className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">E-posta Olan</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {customers.filter(c => c.email).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Phone className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Telefon Olan</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {customers.filter(c => c.phone).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtreler */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Müşteri adı, e-posta veya telefon ile ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="w-full md:w-48">
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
              </div>
            </CardContent>
          </Card>

          {/* Müşteri Listesi */}
          <Card>
            <CardHeader>
              <CardTitle>Müşteri Listesi ({filteredCustomers.length} müşteri)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Yükleniyor...</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">
                    {searchTerm || statusFilter !== 'all' ? 'Arama kriterlerinize uygun müşteri bulunamadı' : 'Henüz müşteri eklenmemiş'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <p className="text-gray-400">İlk müşterinizi eklemek için yukarıdaki butonu kullanın</p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Müşteri</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">İletişim</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Kayıt Tarihi</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Durum</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
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
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              {customer.email && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Mail className="w-4 h-4 mr-1" />
                                  {customer.email}
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="w-4 h-4 mr-1" />
                                  {customer.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-900">
                              {new Date(customer.createdAt).toLocaleDateString('tr-TR')}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(customer.status)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
