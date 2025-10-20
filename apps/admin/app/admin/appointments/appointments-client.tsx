"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from '@repo/ui';
import { Plus, Search, Calendar, Clock, User, Edit, Trash2, ArrowLeft } from 'lucide-react';
import AdminHeader from '../admin-header';
import { DataTable, Column } from '../../../components/DataTable';
import type { AuthenticatedUser } from '../../../lib/auth-utils';

interface AppointmentsClientProps {
  initialAppointments: any[];
  tenantId?: string;
  user: AuthenticatedUser;
}

export default function AppointmentsClient({ initialAppointments, tenantId, user }: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
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

  // Filter by status and date
  const filteredAppointments = appointments.filter((appointment: any) => {
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    const matchesDate = !dateFilter || appointment.date === dateFilter;
    return matchesStatus && matchesDate;
  });

  // Define table columns
  const columns: Column<any>[] = [
    {
      key: 'date',
      label: 'Tarih',
      sortable: true,
      filterable: true,
      getValue: (apt) => new Date(apt.date).getTime(),
      render: (apt) => (
        <div className="text-sm font-medium text-gray-900">
          {new Date(apt.date).toLocaleDateString('tr-TR')}
        </div>
      )
    },
    {
      key: 'time',
      label: 'Saat',
      sortable: true,
      filterable: true,
      render: (apt) => (
        <div className="text-sm text-gray-600 flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          {apt.time}
        </div>
      )
    },
    {
      key: 'customerName',
      label: 'Müşteri',
      sortable: true,
      filterable: true,
      render: (apt) => (
        <div className="flex items-center">
          <User className="w-4 h-4 mr-2 text-gray-400" />
          <div className="text-sm font-medium text-gray-900">{apt.customerName}</div>
        </div>
      )
    },
    {
      key: 'serviceName',
      label: 'Hizmet',
      sortable: true,
      filterable: true,
      render: (apt) => (
        <div className="text-sm text-gray-600">{apt.serviceName}</div>
      )
    },
    {
      key: 'staffName',
      label: 'Personel',
      sortable: true,
      filterable: true,
      render: (apt) => (
        <div className="text-sm text-gray-600">{apt.staffName}</div>
      )
    },
    {
      key: 'status',
      label: 'Durum',
      sortable: true,
      render: (apt) => (
        <Badge className={getStatusColor(apt.status)}>
          {getStatusText(apt.status)}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'İşlemler',
      render: (apt) => (
        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <Link href={`/admin/appointments/${apt.id}/edit`}>
            <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete(apt.id);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

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

        {/* Appointments List with DataTable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Randevu Listesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAppointments.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Randevu bulunamadı</h3>
                <p className="text-gray-600 mb-4">
                  {statusFilter !== 'all' || dateFilter 
                    ? 'Filtre kriterlerinize uygun randevu bulunamadı.'
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
              <>
                {/* Filters and Table Combined */}
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 pb-4 border-b border-gray-200">
                    <div className="flex-1 sm:max-w-xs">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Durum
                      </label>
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Tüm Durumlar</option>
                        <option value="scheduled">Planlandı</option>
                        <option value="pending">Beklemede</option>
                        <option value="completed">Tamamlandı</option>
                        <option value="cancelled">İptal Edildi</option>
                      </select>
                    </div>
                    <div className="flex-1 sm:max-w-xs">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Tarih
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          onClick={(e) => {
                            // Force open date picker
                            try {
                              (e.target as HTMLInputElement).showPicker?.();
                            } catch (err) {
                              // Fallback for browsers that don't support showPicker
                              console.log('showPicker not supported');
                            }
                          }}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          placeholder="Tarih seçin"
                          title="Tarih seçmek için tıklayın"
                        />
                        {dateFilter && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDateFilter('')}
                            className="px-2"
                            title="Filtreyi temizle"
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    </div>
                    {(statusFilter !== 'all' || dateFilter) && (
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setStatusFilter('all');
                            setDateFilter('');
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Filtreleri Temizle
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* DataTable */}
                  <DataTable
                    data={filteredAppointments}
                    columns={columns}
                    keyExtractor={(apt) => apt.id}
                    emptyMessage="Arama kriterlerinize uygun randevu bulunamadı"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
