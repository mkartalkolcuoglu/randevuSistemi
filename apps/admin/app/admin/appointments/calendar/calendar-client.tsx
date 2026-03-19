"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { ArrowLeft, ChevronLeft, ChevronRight, X, Calendar, Clock, User, MapPin, DollarSign, Package } from 'lucide-react';
import AdminHeader from '../../admin-header';
import type { ClientUser } from '../../../../lib/client-permissions';
import { getServiceColor } from '../../../../lib/service-colors';

interface CalendarClientProps {
  initialAppointments: any[];
  tenantId?: string;
  user: ClientUser;
}

export default function CalendarClient({ initialAppointments, tenantId, user }: CalendarClientProps) {
  const router = useRouter();
  // Ensure appointments is always an array
  const [appointments, setAppointments] = useState(Array.isArray(initialAppointments) ? initialAppointments : []);
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month' | 'staff'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');

  // Get unique staff members from appointments
  const staffList = Array.from(
    new Map(
      appointments
        .filter(apt => apt.staffId && apt.staffName)
        .map(apt => [apt.staffId, { id: apt.staffId, name: apt.staffName }])
    ).values()
  );

  // Filter appointments by selected staff
  const filteredAppointments = selectedStaffId === 'all' 
    ? appointments 
    : appointments.filter(apt => apt.staffId === selectedStaffId);

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
      case 'no_show':
        return 'bg-orange-100 text-orange-800';
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
      case 'no_show':
        return 'Gelmedi';
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
            <div className="flex flex-col gap-4">
              {/* Top Row: View Switcher and Staff Filter */}
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
                <button
                  onClick={() => setCalendarView('staff')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition ${
                    calendarView === 'staff'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-white'
                  }`}
                >
                  Personel
                </button>
              </div>

              {/* Staff Filter - Hide in staff view since all staff are shown */}
              {calendarView !== 'staff' && (
                <div className="w-full sm:w-auto sm:min-w-[200px]">
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tüm Personeller</option>
                    {staffList.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Bottom Row: Date Navigation */}
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center">
                <button
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    if (calendarView === 'day' || calendarView === 'staff') newDate.setDate(newDate.getDate() - 1);
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
                    new Date(currentDate).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  )}
                </div>

                <button
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    if (calendarView === 'day' || calendarView === 'staff') newDate.setDate(newDate.getDate() + 1);
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
              <DayView appointments={filteredAppointments} date={currentDate} onAppointmentClick={setSelectedAppointment} />
            )}
            {calendarView === 'week' && (
              <WeekView appointments={filteredAppointments} date={currentDate} onAppointmentClick={setSelectedAppointment} />
            )}
            {calendarView === 'month' && (
              <MonthView appointments={filteredAppointments} date={currentDate} onAppointmentClick={setSelectedAppointment} />
            )}
            {calendarView === 'staff' && (
              <StaffView appointments={appointments} date={currentDate} onAppointmentClick={setSelectedAppointment} />
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
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const dayAppointments = safeAppointments.filter(apt => {
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
                  {hourAppointments.map(apt => {
                    const svcColor = getServiceColor(apt.serviceColor);
                    return (
                    <div
                      key={apt.id}
                      onClick={() => onAppointmentClick(apt)}
                      className="p-2 sm:p-3 rounded-r hover:opacity-80 transition cursor-pointer"
                      style={{
                        backgroundColor: svcColor ? svcColor.bg : '#EFF6FF',
                        borderLeft: `4px solid ${svcColor ? svcColor.hex : '#3B82F6'}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm sm:text-base truncate" style={{ color: svcColor ? svcColor.text : '#111827' }}>
                            {apt.time} - {apt.customerName}
                          </div>
                          <div className="text-xs sm:text-sm mt-1 truncate" style={{ color: svcColor ? svcColor.text : '#4B5563' }}>{apt.serviceName}</div>
                          <div className="text-xs text-gray-500 mt-1">👤 {apt.staffName}</div>
                        </div>
                        <Badge className={`${getStatusColorForBadge(apt.status)} text-xs flex-shrink-0`}>
                          {getStatusTextForBadge(apt.status)}
                        </Badge>
                      </div>
                    </div>
                    );
                  })}
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
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
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
          const dayAppointments = safeAppointments.filter(apt => {
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
                  dayAppointments.slice(0, 5).map(apt => {
                    const svcColor = getServiceColor(apt.serviceColor);
                    return (
                    <div
                      key={apt.id}
                      onClick={() => onAppointmentClick(apt)}
                      className="p-1.5 sm:p-2 rounded text-xs hover:opacity-80 transition cursor-pointer"
                      style={{
                        backgroundColor: svcColor ? svcColor.bg : '#FFFFFF',
                        border: `1px solid ${svcColor ? svcColor.hex + '40' : '#BFDBFE'}`,
                        borderLeft: `3px solid ${svcColor ? svcColor.hex : '#3B82F6'}`,
                      }}
                    >
                      <div className="font-semibold" style={{ color: svcColor ? svcColor.text : '#111827' }}>{apt.time}</div>
                      <div className="truncate" style={{ color: svcColor ? svcColor.text : '#4B5563' }}>{apt.customerName}</div>
                      <Badge className={`${getStatusColorForBadge(apt.status)} text-xs mt-1`}>
                        {getStatusTextForBadge(apt.status)}
                      </Badge>
                    </div>
                    );
                  })
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
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
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
          const dayAppointments = safeAppointments.filter(apt => {
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
                  {dayAppointments.slice(0, 2).map(apt => {
                    const svcColor = getServiceColor(apt.serviceColor);
                    return (
                    <div
                      key={apt.id}
                      onClick={() => onAppointmentClick(apt)}
                      className="text-xs p-0.5 sm:p-1 rounded truncate cursor-pointer hover:opacity-80 transition"
                      style={{
                        backgroundColor: svcColor ? svcColor.bg : '#DBEAFE',
                        color: svcColor ? svcColor.text : undefined,
                      }}
                      title={`${apt.time} - ${apt.customerName}`}
                    >
                      {apt.time}
                    </div>
                    );
                  })}
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

// Staff View Component - Time grid with staff columns (like mobile app)
function StaffView({ appointments, date, onAppointmentClick }: { appointments: any[]; date: Date; onAppointmentClick: (apt: any) => void }) {
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const START_HOUR = 8;
  const END_HOUR = 21;
  const HOUR_HEIGHT = 80; // px per hour
  const TIME_COL_WIDTH = 60; // px
  const STAFF_COLORS = ['from-blue-600 to-blue-700', 'from-purple-600 to-purple-700', 'from-teal-600 to-teal-700', 'from-rose-600 to-rose-700', 'from-amber-600 to-amber-700', 'from-indigo-600 to-indigo-700'];

  // Get appointments for the selected date
  const dayAppointments = safeAppointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate.toDateString() === date.toDateString();
  });

  // Collect all unique staff
  const staffMap = new Map<string, { id: string; name: string; appointments: any[] }>();
  safeAppointments.forEach(apt => {
    if (apt.staffId && apt.staffName && !staffMap.has(apt.staffId)) {
      staffMap.set(apt.staffId, { id: apt.staffId, name: apt.staffName, appointments: [] });
    }
  });
  dayAppointments.forEach(apt => {
    if (apt.staffId && staffMap.has(apt.staffId)) {
      staffMap.get(apt.staffId)!.appointments.push(apt);
    }
  });
  const staffList = Array.from(staffMap.values());

  if (staffList.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-lg font-medium">Personel bulunamadı</p>
        <p className="text-sm">Randevularda kayıtlı personel yok</p>
      </div>
    );
  }

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const totalHeight = hours.length * HOUR_HEIGHT;

  // Current time indicator
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentTop = ((currentMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;

  // Calculate appointment position
  const getAptStyle = (apt: any) => {
    const [h, m] = (apt.time || '09:00').split(':').map(Number);
    const startMin = h * 60 + m;
    const duration = apt.duration || 30;
    const top = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
    const height = Math.max((duration / 60) * HOUR_HEIGHT, 28);
    return { top: `${top}px`, height: `${height}px` };
  };

  return (
    <div className="overflow-x-auto border rounded-xl bg-white">
      {/* Staff Headers */}
      <div className="flex sticky top-0 z-10 border-b">
        <div style={{ width: TIME_COL_WIDTH, minWidth: TIME_COL_WIDTH }} className="bg-gray-50 border-r flex-shrink-0" />
        {staffList.map((staff, idx) => (
          <div key={staff.id} className="flex-1 min-w-[200px] border-r last:border-r-0">
            <div className={`bg-gradient-to-r ${STAFF_COLORS[idx % STAFF_COLORS.length]} p-3 text-white`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  {staff.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{staff.name}</div>
                  <div className="text-white/70 text-xs">{staff.appointments.length} randevu</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="flex overflow-y-auto" style={{ maxHeight: '70vh' }}>
        {/* Time Labels */}
        <div style={{ width: TIME_COL_WIDTH, minWidth: TIME_COL_WIDTH }} className="flex-shrink-0 border-r bg-gray-50">
          {hours.map(hour => (
            <div key={hour} style={{ height: HOUR_HEIGHT }} className="border-b border-gray-100 flex items-start justify-end pr-2 pt-1">
              <span className="text-xs font-medium text-gray-500">{`${hour.toString().padStart(2, '0')}:00`}</span>
            </div>
          ))}
        </div>

        {/* Staff Columns */}
        {staffList.map(staff => (
          <div key={staff.id} className="flex-1 min-w-[200px] border-r last:border-r-0 relative">
            {/* Hour grid lines */}
            {hours.map(hour => (
              <div key={hour} style={{ height: HOUR_HEIGHT }} className="border-b border-gray-100">
                <div className="border-b border-gray-50 border-dashed" style={{ height: HOUR_HEIGHT / 2 }} />
              </div>
            ))}

            {/* Current time indicator */}
            {isToday && currentTop > 0 && currentTop < totalHeight && (
              <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${currentTop}px` }}>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                  <div className="flex-1 h-[2px] bg-red-500" />
                </div>
              </div>
            )}

            {/* Appointments */}
            {staff.appointments.map(apt => {
              const style = getAptStyle(apt);
              const svcColor = getServiceColor(apt.serviceColor);
              const statusBg = apt.status === 'completed' ? '#D1FAE5' : apt.status === 'cancelled' ? '#FEE2E2' : apt.status === 'confirmed' ? '#DBEAFE' : '#FEF3C7';
              return (
                <div
                  key={apt.id}
                  onClick={() => onAppointmentClick(apt)}
                  className="absolute left-1 right-1 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow z-10"
                  style={{
                    top: style.top,
                    height: style.height,
                    backgroundColor: svcColor ? svcColor.bg : statusBg,
                    borderLeft: `3px solid ${svcColor ? svcColor.hex : '#3B82F6'}`,
                  }}
                >
                  <div className="p-1.5 h-full overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold" style={{ color: svcColor ? svcColor.text : '#1F2937' }}>{apt.time}</span>
                      <span className={`text-[9px] px-1 py-0.5 rounded ${getStatusColorForBadge(apt.status)}`}>{getStatusTextForBadge(apt.status)}</span>
                    </div>
                    <div className="text-xs font-semibold truncate mt-0.5" style={{ color: svcColor ? svcColor.text : '#1F2937' }}>{apt.customerName}</div>
                    <div className="text-[10px] truncate" style={{ color: svcColor ? svcColor.text : '#6B7280' }}>{apt.serviceName}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
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
    case 'no_show': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getStatusTextForBadge(status: string) {
  switch (status) {
    case 'scheduled': return 'Onaylandı';
    case 'pending': return 'Bekliyor';
    case 'confirmed': return 'Onaylandı';
    case 'completed': return 'Tamamlandı';
    case 'cancelled': return 'İptal';
    case 'no_show': return 'Gelmedi';
    default: return status;
  }
}

