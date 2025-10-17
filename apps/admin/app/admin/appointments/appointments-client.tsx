"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from '@repo/ui';
import { Plus, Search, Calendar, Clock, User, Edit, Trash2, ArrowLeft } from 'lucide-react';
import AdminHeader from '../admin-header';
import type { AuthenticatedUser } from '../../../lib/auth-utils';

interface AppointmentsClientProps {
  initialAppointments: any[];
  tenantId?: string;
  user: AuthenticatedUser;
}

export default function AppointmentsClient({ initialAppointments, tenantId, user }: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const handleDelete = async (id: string) => {
    if (confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/appointments/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setAppointments(appointments.filter(app => app.id !== id));
        } else {
          alert('Randevu silinirken hata oluştu');
        }
      } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('Randevu silinirken hata oluştu');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Planlandı';
      case 'confirmed':
        return 'Tamamlandı';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      case 'pending':
        return 'Beklemede';
      default:
        return status;
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter((appointment: any) => {
    const matchesSearch = appointment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.serviceName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    const matchesDate = !dateFilter || appointment.date === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Randevu Yönetimi</h1>
              <p className="text-gray-600">Randevuları görüntüleyin ve yönetin</p>
            </div>
            <Link href="/admin/appointments/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Randevu
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Randevu</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredAppointments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Planlandı</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredAppointments.filter(a => a.status === 'scheduled').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <User className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Beklemede</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredAppointments.filter(a => a.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">İptal Edildi</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredAppointments.filter(a => a.status === 'cancelled').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Müşteri adı veya hizmet ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="scheduled">Planlandı</option>
                  <option value="pending">Beklemede</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>
              <div className="w-full md:w-48">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Randevu Listesi ({filteredAppointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredAppointments.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Randevu bulunamadı</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' || dateFilter 
                    ? 'Arama kriterlerinize uygun randevu bulunamadı.'
                    : 'Henüz randevu bulunmuyor.'}
                </p>
                <Link href="/admin/appointments/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    İlk Randevuyu Oluştur
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredAppointments.map((appointment: any) => (
                  <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {appointment.customerName}
                            </h3>
                            <Badge className={getStatusColor(appointment.status)}>
                              {getStatusText(appointment.status)}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2">{appointment.serviceName}</p>
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(appointment.date).toLocaleDateString('tr-TR')}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {appointment.time}
                            </div>
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {appointment.staffName}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right mr-4">
                          {appointment.packageInfo ? (
                            <>
                              <div className="text-sm font-semibold text-green-600 flex items-center justify-end">
                                <span className="mr-1">🎁</span>
                                Paket Kullanımı
                              </div>
                              <div className="text-xs text-gray-500">
                                {appointment.duration} dk
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-lg font-semibold text-gray-900">
                                {appointment.price}₺
                              </div>
                              <div className="text-sm text-gray-500">
                                {appointment.duration} dk
                              </div>
                            </>
                          )}
                        </div>
                        <Link href={`/admin/appointments/${appointment.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(appointment.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {appointment.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <strong>Notlar:</strong> {appointment.notes}
                        </p>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-400">
                      ID: {appointment.id} | Tenant: {appointment.tenantId} | Oluşturulma: {new Date(appointment.createdAt).toLocaleString('tr-TR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
