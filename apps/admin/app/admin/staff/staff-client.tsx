"use client";

import { useState, useEffect } from 'react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge } from '@repo/ui';
import { Plus, Search, Edit, Trash2, Phone, Mail, Calendar, User, Star, Clock, Users, Scissors } from 'lucide-react';
import Link from 'next/link';
import AdminHeader from '../admin-header';
import type { ClientUser } from '../../../lib/client-permissions';

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  status: string;
  avatar?: string;
  salary?: number;
  hireDate?: string;
  specializations?: string;
  experience?: number;
  rating?: number;
  workingHours?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface StaffClientProps {
  user: ClientUser;
}

export default function StaffClient({ user }: StaffClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStaff, setTotalStaff] = useState(0);

  // Fetch staff from API
  useEffect(() => {
    fetchStaff();
  }, [searchTerm, statusFilter, specializationFilter]);

  // Auto-refresh when component mounts or page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchStaff();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial load
    fetchStaff();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '20',
        search: searchTerm,
        status: statusFilter
      });
      
      const response = await fetch(`/api/staff?${params}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setStaff(result.data);
        setTotalStaff(result.total);
      } else {
        console.error('Failed to fetch staff:', result.error);
        setStaff([]);
        setTotalStaff(0);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      setStaff([]);
      setTotalStaff(0);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aktif' },
      inactive: { bg: 'bg-red-100', text: 'text-red-800', label: 'Pasif' },
      vacation: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'İzinli' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return (
      <Badge className={`${config.bg} ${config.text}`}>
        {config.label}
      </Badge>
    );
  };

  const getExperienceLevel = (experience?: number) => {
    if (!experience) return 'Belirtilmemiş';
    if (experience < 1) return 'Yeni Başlayan';
    if (experience < 3) return 'Tecrübeli';
    if (experience < 5) return 'Uzman';
    return 'Kıdemli Uzman';
  };

  const formatSalary = (salary?: number) => {
    if (!salary) return 'Belirtilmemiş';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(salary);
  };

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">Değerlendirilmemiş</span>;
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  // Filter staff based on search and filters
  const filteredStaff = staff.filter(member => {
    const matchesSearch = `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    const matchesSpecialization = specializationFilter === 'all' || 
                                 (member.specializations && member.specializations.toLowerCase().includes(specializationFilter.toLowerCase()));
    
    return matchesSearch && matchesStatus && matchesSpecialization;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader user={user} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Personel bilgileri yükleniyor...</p>
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
                <Users className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="truncate">Personel Yönetimi</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">Personel bilgilerini görüntüleyin ve yönetin</p>
            </div>
            
            <Link href="/admin/staff/new" className="w-full sm:w-auto flex-shrink-0">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Personel Ekle
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Personel ara (isim, email, pozisyon)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                  <option value="vacation">İzinli</option>
                </select>
                
                <select
                  value={specializationFilter}
                  onChange={(e) => setSpecializationFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">Tüm Uzmanlıklar</option>
                  <option value="kuaför">Kuaför</option>
                  <option value="berber">Berber</option>
                  <option value="estetisyen">Estetisyen</option>
                  <option value="masaj">Masaj</option>
                  <option value="nail">Nail Art</option>
                  <option value="güzellik">Güzellik Uzmanı</option>
                </select>
              </div>
              
              {/* Results count */}
              <div className="mt-4 text-sm text-gray-600">
                {searchTerm || statusFilter !== 'all' || specializationFilter !== 'all' ? (
                  <span>{filteredStaff.length} personel bulundu (Toplam: {totalStaff})</span>
                ) : (
                  <span>Toplam {totalStaff} personel</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Staff Grid */}
          {filteredStaff.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  {staff.length === 0 ? (
                    <>
                      <p className="text-gray-500 text-lg mb-2">Henüz personel eklenmemiş</p>
                      <p className="text-gray-400">İlk personeli eklemek için yukarıdaki butonu kullanın</p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-500 text-lg mb-2">Arama kriterlerinize uygun personel bulunamadı</p>
                      <p className="text-gray-400">Farklı arama terimleri deneyebilir veya filtreleri temizleyebilirsiniz</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStaff.map((member) => (
                <Card key={member.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <h3 className="font-semibold text-gray-900">
                            {member.firstName} {member.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{member.position}</p>
                        </div>
                      </div>
                      {getStatusBadge(member.status)}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{member.phone}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Deneyim</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {getExperienceLevel(member.experience)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Maaş</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatSalary(member.salary)}
                        </p>
                      </div>
                    </div>

                    {/* Specializations */}
                    {member.specializations && member.specializations.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Uzmanlık</p>
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(member.specializations) 
                            ? member.specializations 
                            : typeof member.specializations === 'string' 
                              ? member.specializations.split(',').map(s => s.trim())
                              : []
                          ).map((spec, index) => (
                            <Badge key={index} className="text-xs bg-blue-100 text-blue-800">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2 pt-4 border-t border-gray-100">
                      <Link href={`/admin/staff/${member.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Görüntüle
                        </Button>
                      </Link>
                      <Link href={`/admin/staff/${member.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="w-4 h-4 mr-1" />
                          Düzenle
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Summary Stats */}
          {filteredStaff.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Personel Özeti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{filteredStaff.length}</p>
                    <p className="text-sm text-blue-800">Toplam Personel</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <User className="w-8 h-8 mx-auto text-green-600 mb-2" />
                    <p className="text-2xl font-bold text-green-600">
                      {filteredStaff.filter(s => s.status === 'active').length}
                    </p>
                    <p className="text-sm text-green-800">Aktif Personel</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
