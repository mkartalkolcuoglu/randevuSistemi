'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@repo/ui';
import { Plus, Search, Edit3, Trash2, Clock, DollarSign, Eye, Briefcase } from 'lucide-react';
import { apiClient } from '../../../lib/api-client';
import AdminHeader from '../admin-header';
import type { ClientUser } from '../../../lib/client-permissions';

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  status: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface ServicesClientProps {
  user: ClientUser;
}

export default function ServicesClient({ user }: ServicesClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getServices();
      if (response.success) {
        setServices(response.data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteService = async (id: string) => {
    if (!window.confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await apiClient.deleteService(id);
      if (response.success) {
        setServices(services.filter(service => service.id !== id));
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Hizmet silinirken bir hata oluştu');
    }
  };

  const categories = [
    { value: 'all', label: 'Tüm Kategoriler' },
    { value: 'Saç Bakımı', label: 'Saç Bakımı' },
    { value: 'Cilt Bakımı', label: 'Cilt Bakımı' },
    { value: 'Makyaj', label: 'Makyaj' },
    { value: 'Masaj', label: 'Masaj' },
    { value: 'Diğer', label: 'Diğer' }
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || service.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader user={user} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Hizmetler yükleniyor...</p>
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="truncate">Hizmet Yönetimi</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">İşletmenizin sunduğu hizmetleri yönetin</p>
            </div>
            
            <Link href="/admin/services/new" className="w-full sm:w-auto flex-shrink-0">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Hizmet
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full md:w-48">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Link 
                key={service.id} 
                href={`/admin/services/${service.id}`}
                className="block"
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <Badge variant={service.status === 'active' ? "default" : "secondary"} className="mt-1">
                          {service.status === 'active' ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                      <div className="flex space-x-1">
                        <Link 
                          href={`/admin/services/${service.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="outline" size="sm">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteService(service.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span>₺{service.price}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{service.duration} dakika</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Kategori:</span> {service.category || 'Belirtilmemiş'}
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
              </Link>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || selectedCategory !== 'all' ? 'Arama kriterlerinize uygun hizmet bulunamadı' : 'Henüz hizmet eklenmemiş'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Farklı arama terimleri deneyebilir veya filtreleri temizleyebilirsiniz.'
                    : 'İşletmenize ait hizmetleri ekleyerek başlayın.'
                  }
                </p>
                {(!searchTerm && selectedCategory === 'all') && (
                  <Link href="/admin/services/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      İlk Hizmeti Ekle
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
