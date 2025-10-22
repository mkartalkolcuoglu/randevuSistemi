"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from '@repo/ui';
import { Plus, Search, Calendar, Clock, User, Edit, Trash2, ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

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
      filterable: false, // Removed from filter inputs, use date filter below table instead
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
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowCalendar(true)}
                variant="outline"
                className="border-2"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Takvim Görünümü
              </Button>
              <Link href="/admin/appointments/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Randevu
                </Button>
              </Link>
            </div>
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

        {/* Calendar Modal */}
        {showCalendar && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Takvim Görünümü</h2>
                  <p className="text-gray-600 text-sm mt-1">Randevularınızı takvim üzerinde görün</p>
                </div>
                <button 
                  onClick={() => setShowCalendar(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Calendar Controls */}
              <div className="p-6 border-b bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* View Switcher */}
                  <div className="flex bg-white rounded-lg p-1 shadow-sm border">
                    <button
                      onClick={() => setCalendarView('day')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                        calendarView === 'day'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Günlük
                    </button>
                    <button
                      onClick={() => setCalendarView('week')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                        calendarView === 'week'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Haftalık
                    </button>
                    <button
                      onClick={() => setCalendarView('month')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                        calendarView === 'month'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Aylık
                    </button>
                  </div>

                  {/* Date Navigation */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        const newDate = new Date(currentDate);
                        if (calendarView === 'day') newDate.setDate(newDate.getDate() - 1);
                        else if (calendarView === 'week') newDate.setDate(newDate.getDate() - 7);
                        else newDate.setMonth(newDate.getMonth() - 1);
                        setCurrentDate(newDate);
                      }}
                      className="p-2 hover:bg-white rounded-full transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="text-lg font-semibold min-w-[200px] text-center">
                      {calendarView === 'month' ? (
                        new Date(currentDate).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
                      ) : calendarView === 'week' ? (
                        `${new Date(currentDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}`
                      ) : (
                        new Date(currentDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const newDate = new Date(currentDate);
                        if (calendarView === 'day') newDate.setDate(newDate.getDate() + 1);
                        else if (calendarView === 'week') newDate.setDate(newDate.getDate() + 7);
                        else newDate.setMonth(newDate.getMonth() + 1);
                        setCurrentDate(newDate);
                      }}
                      className="p-2 hover:bg-white rounded-full transition"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <Button
                      onClick={() => setCurrentDate(new Date())}
                      variant="outline"
                      size="sm"
                      className="ml-2"
                    >
                      Bugün
                    </Button>
                  </div>
                </div>
              </div>

              {/* Calendar Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {calendarView === 'day' && (
                  <DayView appointments={filteredAppointments} date={currentDate} />
                )}
                {calendarView === 'week' && (
                  <WeekView appointments={filteredAppointments} date={currentDate} />
                )}
                {calendarView === 'month' && (
                  <MonthView appointments={filteredAppointments} date={currentDate} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Day View Component
function DayView({ appointments, date }: { appointments: any[]; date: Date }) {
  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 - 21:00
  const dayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate.toDateString() === date.toDateString();
  });

  return (
    <div className="space-y-2">
      <div className="font-semibold text-lg mb-4 pb-2 border-b">
        {date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
      {hours.map(hour => {
        const hourAppointments = dayAppointments.filter(apt => {
          const time = apt.time.split(':')[0];
          return parseInt(time) === hour;
        });

        return (
          <div key={hour} className="flex border-b border-gray-100">
            <div className="w-20 flex-shrink-0 text-sm text-gray-600 py-3">
              {hour.toString().padStart(2, '0')}:00
            </div>
            <div className="flex-1 min-h-[60px] py-2">
              {hourAppointments.length > 0 ? (
                <div className="space-y-2">
                  {hourAppointments.map(apt => (
                    <div 
                      key={apt.id}
                      className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r hover:bg-blue-100 transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{apt.time} - {apt.customerName}</div>
                          <div className="text-sm text-gray-600 mt-1">{apt.serviceName}</div>
                          <div className="text-xs text-gray-500 mt-1">👤 {apt.staffName}</div>
                        </div>
                        <Badge className={getStatusColorForBadge(apt.status)}>
                          {getStatusTextForBadge(apt.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center text-gray-400 text-sm">-</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Week View Component
function WeekView({ appointments, date }: { appointments: any[]; date: Date }) {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-7 gap-2 min-w-[800px]">
        {weekDays.map((day, index) => {
          const dayAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate.toDateString() === day.toDateString();
          });

          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div 
              key={index} 
              className={`border rounded-lg p-3 ${
                isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
              }`}
            >
              <div className="text-center mb-3 pb-2 border-b">
                <div className="text-xs text-gray-600">
                  {day.toLocaleDateString('tr-TR', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {day.getDate()}
                </div>
              </div>
              <div className="space-y-2">
                {dayAppointments.length > 0 ? (
                  dayAppointments.slice(0, 5).map(apt => (
                    <div 
                      key={apt.id}
                      className="bg-white border border-blue-200 p-2 rounded text-xs hover:bg-blue-50 transition cursor-pointer"
                    >
                      <div className="font-semibold text-gray-900">{apt.time}</div>
                      <div className="text-gray-600 truncate">{apt.customerName}</div>
                      <Badge className={`${getStatusColorForBadge(apt.status)} text-xs mt-1`}>
                        {getStatusTextForBadge(apt.status)}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-xs text-center py-4">Randevu yok</div>
                )}
                {dayAppointments.length > 5 && (
                  <div className="text-xs text-gray-500 text-center">+{dayAppointments.length - 5} daha</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Month View Component
function MonthView({ appointments, date }: { appointments: any[]; date: Date }) {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0
  
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
          <div key={day} className="text-center font-semibold text-sm text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="aspect-square"></div>;
          }

          const currentDay = new Date(year, month, day);
          const dayAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate.toDateString() === currentDay.toDateString();
          });

          const isToday = currentDay.toDateString() === new Date().toDateString();

          return (
            <div 
              key={index}
              className={`aspect-square border rounded-lg p-2 ${
                isToday ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
              } transition cursor-pointer`}
            >
              <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                {day}
              </div>
              {dayAppointments.length > 0 && (
                <div className="space-y-1">
                  {dayAppointments.slice(0, 2).map(apt => (
                    <div 
                      key={apt.id}
                      className="bg-blue-100 text-xs p-1 rounded truncate"
                      title={`${apt.time} - ${apt.customerName}`}
                    >
                      {apt.time}
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayAppointments.length - 2}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper functions for calendar views
function getStatusColorForBadge(status: string) {
  switch (status) {
    case 'scheduled': case 'pending': return 'bg-blue-100 text-blue-800';
    case 'confirmed': case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getStatusTextForBadge(status: string) {
  switch (status) {
    case 'scheduled': return 'Planlandı';
    case 'pending': return 'Bekliyor';
    case 'confirmed': return 'Onaylandı';
    case 'completed': return 'Tamamlandı';
    case 'cancelled': return 'İptal';
    default: return status;
  }
}
