"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@repo/ui';
import { ArrowLeft, ChevronLeft, ChevronRight, X, Calendar, Clock, User, MapPin, DollarSign, Package } from 'lucide-react';
import AdminHeader from '../../admin-header';
import type { AuthenticatedUser } from '../../../../lib/auth-utils';

interface CalendarClientProps {
  initialAppointments: any[];
  tenantId?: string;
  user: AuthenticatedUser;
}

export default function CalendarClient({ initialAppointments, tenantId, user }: CalendarClientProps) {
  const router = useRouter();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Planlandı';
      case 'pending':
        return 'Bekliyor';
      case 'confirmed':
        return 'Onaylandı';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin/appointments">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Takvim Görünümü</h1>
                <p className="text-gray-600 text-sm">Randevularınızı takvim üzerinde görün</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* View Switcher */}
              <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                <button
                  onClick={() => setCalendarView('day')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition ${
                    calendarView === 'day'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-white'
                  }`}
                >
                  Günlük
                </button>
                <button
                  onClick={() => setCalendarView('week')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition ${
                    calendarView === 'week'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-white'
                  }`}
                >
                  Haftalık
                </button>
                <button
                  onClick={() => setCalendarView('month')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition ${
                    calendarView === 'month'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-white'
                  }`}
                >
                  Aylık
                </button>
              </div>

              {/* Date Navigation */}
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between">
                <button
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    if (calendarView === 'day') newDate.setDate(newDate.getDate() - 1);
                    else if (calendarView === 'week') newDate.setDate(newDate.getDate() - 7);
                    else newDate.setMonth(newDate.getMonth() - 1);
                    setCurrentDate(newDate);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="text-base sm:text-lg font-semibold text-center min-w-[140px] sm:min-w-[200px]">
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
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <Button
                  onClick={() => setCurrentDate(new Date())}
                  variant="outline"
                  size="sm"
                  className="hidden sm:block"
                >
                  Bugün
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Content */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            {calendarView === 'day' && (
              <DayView appointments={appointments} date={currentDate} onAppointmentClick={setSelectedAppointment} />
            )}
            {calendarView === 'week' && (
              <WeekView appointments={appointments} date={currentDate} onAppointmentClick={setSelectedAppointment} />
            )}
            {calendarView === 'month' && (
              <MonthView appointments={appointments} date={currentDate} onAppointmentClick={setSelectedAppointment} />
            )}
          </CardContent>
        </Card>

        {/* Appointment Detail Modal */}
        {selectedAppointment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-900">Randevu Detayı</h2>
                <button 
                  onClick={() => setSelectedAppointment(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <Badge className={`${getStatusColor(selectedAppointment.status)} text-sm px-3 py-1`}>
                    {getStatusText(selectedAppointment.status)}
                  </Badge>
                  <div className="text-sm text-gray-500">
                    #{selectedAppointment.id.substring(0, 8)}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-500">Tarih</div>
                      <div className="font-semibold">
                        {new Date(selectedAppointment.date).toLocaleDateString('tr-TR', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric',
                          weekday: 'long'
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-500">Saat</div>
                      <div className="font-semibold">{selectedAppointment.time}</div>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <div className="text-sm font-semibold text-gray-700">Müşteri Bilgileri</div>
                  </div>
                  <div className="ml-6 space-y-1">
                    <div className="font-semibold text-gray-900">{selectedAppointment.customerName}</div>
                    <div className="text-sm text-gray-600">{selectedAppointment.customerPhone}</div>
                    {selectedAppointment.customerEmail && (
                      <div className="text-sm text-gray-600">{selectedAppointment.customerEmail}</div>
                    )}
                  </div>
                </div>

                {/* Service Info */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Hizmet</div>
                  <div className="font-semibold text-gray-900">{selectedAppointment.serviceName}</div>
                </div>

                {/* Staff Info */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Personel</div>
                  <div className="font-semibold text-gray-900">{selectedAppointment.staffName}</div>
                </div>

                {/* Payment Info */}
                {selectedAppointment.isPaid !== undefined && (
                  <div className="flex items-center gap-3 text-gray-700">
                    {selectedAppointment.packageName ? (
                      <>
                        <Package className="w-5 h-5 text-purple-600" />
                        <div>
                          <div className="text-sm text-gray-500">Paket Kullanıldı</div>
                          <div className="font-semibold text-purple-700">{selectedAppointment.packageName}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="text-sm text-gray-500">Ödeme Durumu</div>
                          <div className={`font-semibold ${selectedAppointment.isPaid ? 'text-green-700' : 'text-orange-700'}`}>
                            {selectedAppointment.isPaid ? 'Ödendi' : 'Ödenmedi'}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Notes */}
                {selectedAppointment.notes && (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">Notlar</div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-gray-700">
                      {selectedAppointment.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 p-6 border-t bg-gray-50">
                <Button
                  onClick={() => {
                    setSelectedAppointment(null);
                    router.push(`/admin/appointments/${selectedAppointment.id}/edit`);
                  }}
                  className="flex-1"
                  variant="outline"
                >
                  Düzenle
                </Button>
                <Button
                  onClick={() => setSelectedAppointment(null)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Kapat
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Day View Component
function DayView({ appointments, date, onAppointmentClick }: { appointments: any[]; date: Date; onAppointmentClick: (apt: any) => void }) {
  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 - 21:00
  const dayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate.toDateString() === date.toDateString();
  });

  return (
    <div className="space-y-1">
      <div className="font-semibold text-base sm:text-lg mb-4 pb-2 border-b">
        {date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
      {hours.map(hour => {
        const hourAppointments = dayAppointments.filter(apt => {
          const time = apt.time.split(':')[0];
          return parseInt(time) === hour;
        });

        return (
          <div key={hour} className="flex border-b border-gray-100">
            <div className="w-16 sm:w-20 flex-shrink-0 text-xs sm:text-sm text-gray-600 py-2 sm:py-3">
              {hour.toString().padStart(2, '0')}:00
            </div>
            <div className="flex-1 min-h-[50px] sm:min-h-[60px] py-2">
              {hourAppointments.length > 0 ? (
                <div className="space-y-2">
                  {hourAppointments.map(apt => (
                    <div 
                      key={apt.id}
                      onClick={() => onAppointmentClick(apt)}
                      className="bg-blue-50 border-l-4 border-blue-500 p-2 sm:p-3 rounded-r hover:bg-blue-100 transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                            {apt.time} - {apt.customerName}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 mt-1 truncate">{apt.serviceName}</div>
                          <div className="text-xs text-gray-500 mt-1">👤 {apt.staffName}</div>
                        </div>
                        <Badge className={`${getStatusColorForBadge(apt.status)} text-xs flex-shrink-0`}>
                          {getStatusTextForBadge(apt.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center text-gray-400 text-xs sm:text-sm">-</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Week View Component
function WeekView({ appointments, date, onAppointmentClick }: { appointments: any[]; date: Date; onAppointmentClick: (apt: any) => void }) {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[700px] px-4 sm:px-0">
        {weekDays.map((day, index) => {
          const dayAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate.toDateString() === day.toDateString();
          });

          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div 
              key={index} 
              className={`border rounded-lg p-2 sm:p-3 ${
                isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
              }`}
            >
              <div className="text-center mb-2 sm:mb-3 pb-2 border-b">
                <div className="text-xs text-gray-600">
                  {day.toLocaleDateString('tr-TR', { weekday: 'short' })}
                </div>
                <div className={`text-base sm:text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {day.getDate()}
                </div>
              </div>
              <div className="space-y-1 sm:space-y-2">
                {dayAppointments.length > 0 ? (
                  dayAppointments.slice(0, 5).map(apt => (
                    <div 
                      key={apt.id}
                      onClick={() => onAppointmentClick(apt)}
                      className="bg-white border border-blue-200 p-1.5 sm:p-2 rounded text-xs hover:bg-blue-50 transition cursor-pointer"
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
function MonthView({ appointments, date, onAppointmentClick }: { appointments: any[]; date: Date; onAppointmentClick: (apt: any) => void }) {
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
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
          <div key={day} className="text-center font-semibold text-xs sm:text-sm text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
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
              className={`aspect-square border rounded-lg p-1 sm:p-2 ${
                isToday ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
              } transition`}
            >
              <div className={`text-xs sm:text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                {day}
              </div>
              {dayAppointments.length > 0 && (
                <div className="space-y-0.5 sm:space-y-1">
                  {dayAppointments.slice(0, 2).map(apt => (
                    <div 
                      key={apt.id}
                      onClick={() => onAppointmentClick(apt)}
                      className="bg-blue-100 text-xs p-0.5 sm:p-1 rounded truncate cursor-pointer hover:bg-blue-200 transition"
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

