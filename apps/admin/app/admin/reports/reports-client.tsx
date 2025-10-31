"use client";

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { 
  BarChart3, 
  Download, 
  Calendar,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  FileText,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Star
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import AdminHeader from '../admin-header';
import type { ClientUser } from '../../../lib/client-permissions';

interface ReportsClientProps {
  user: ClientUser;
}

export default function ReportsClient({ user }: ReportsClientProps) {
  const [reportData, setReportData] = useState({
    thisMonth: {
      revenue: 0,
      appointments: 0,
      customers: 0,
      avgBookingValue: 0
    },
    lastMonth: {
      revenue: 0,
      appointments: 0,
      customers: 0,
      avgBookingValue: 0
    }
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [servicesData, setServicesData] = useState<any[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<any[]>([]);
  const [appointmentsByStatus, setAppointmentsByStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch real data from APIs
  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments, customers, services, staff data
      const [appointmentsRes, customersRes, servicesRes, staffRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/customers'),
        fetch('/api/services'),
        fetch('/api/staff')
      ]);

      const appointments = await appointmentsRes.json();
      const customers = await customersRes.json();
      const services = await servicesRes.json();
      const staff = await staffRes.json();

      // Calculate this month's and last month's data
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      if (appointments.success && appointments.data) {
        const allAppointments = appointments.data;

        // This month vs last month
        const thisMonthAppointments = allAppointments.filter((apt: any) => {
          const aptDate = new Date(apt.createdAt);
          return aptDate >= firstDayThisMonth && apt.status !== 'cancelled';
        });

        const lastMonthAppointments = allAppointments.filter((apt: any) => {
          const aptDate = new Date(apt.createdAt);
          return aptDate >= firstDayLastMonth && aptDate <= lastDayLastMonth && apt.status !== 'cancelled';
        });

        const thisMonthRevenue = thisMonthAppointments.reduce((sum: number, apt: any) => sum + (apt.price || 0), 0);
        const lastMonthRevenue = lastMonthAppointments.reduce((sum: number, apt: any) => sum + (apt.price || 0), 0);

        const thisMonthCustomers = customers.success ? customers.data.filter((cust: any) => {
          const custDate = new Date(cust.createdAt);
          return custDate >= firstDayThisMonth;
        }).length : 0;

        const lastMonthCustomers = customers.success ? customers.data.filter((cust: any) => {
          const custDate = new Date(cust.createdAt);
          return custDate >= firstDayLastMonth && custDate <= lastDayLastMonth;
        }).length : 0;

        setReportData({
          thisMonth: {
            revenue: thisMonthRevenue,
            appointments: thisMonthAppointments.length,
            customers: thisMonthCustomers,
            avgBookingValue: thisMonthAppointments.length > 0 ? thisMonthRevenue / thisMonthAppointments.length : 0
          },
          lastMonth: {
            revenue: lastMonthRevenue,
            appointments: lastMonthAppointments.length,
            customers: lastMonthCustomers,
            avgBookingValue: lastMonthAppointments.length > 0 ? lastMonthRevenue / lastMonthAppointments.length : 0
          }
        });

        // Generate monthly data for last 6 months
        const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
          
          const monthAppointments = allAppointments.filter((apt: any) => {
            const aptDate = new Date(apt.createdAt);
            return aptDate >= monthDate && aptDate < nextMonthDate && apt.status !== 'cancelled';
          });

          const monthRevenue = monthAppointments.reduce((sum: number, apt: any) => sum + (apt.price || 0), 0);
          
          last6Months.push({
            month: monthNames[monthDate.getMonth()],
            gelir: monthRevenue,
            randevu: monthAppointments.length
          });
        }
        setMonthlyData(last6Months);

        // Services data (top 5 most booked)
        if (services.success && services.data) {
          const serviceStats = services.data.map((service: any) => {
            const serviceAppointments = allAppointments.filter((apt: any) => 
              apt.serviceId === service.id && apt.status !== 'cancelled'
            );
            return {
              name: service.name,
              randevular: serviceAppointments.length,
              gelir: serviceAppointments.reduce((sum: number, apt: any) => sum + (apt.price || 0), 0)
            };
          }).sort((a: any, b: any) => b.randevular - a.randevular).slice(0, 5);
          
          setServicesData(serviceStats);
        }

        // Staff performance
        if (staff.success && staff.data) {
          const staffStats = staff.data.map((member: any) => {
            const staffAppointments = allAppointments.filter((apt: any) => 
              apt.staffId === member.id && apt.status === 'completed'
            );
            return {
              name: `${member.firstName} ${member.lastName}`,
              randevular: staffAppointments.length,
              gelir: staffAppointments.reduce((sum: number, apt: any) => sum + (apt.price || 0), 0)
            };
          }).filter((s: any) => s.randevular > 0)
            .sort((a: any, b: any) => b.gelir - a.gelir);
          
          setStaffPerformance(staffStats);
        }

        // Appointments by status
        const statusMap: any = {
          'completed': { name: 'Tamamlandı', value: 0, color: '#10B981' },
          'confirmed': { name: 'Onaylandı', value: 0, color: '#3B82F6' },
          'scheduled': { name: 'Planlandı', value: 0, color: '#F59E0B' },
          'cancelled': { name: 'İptal', value: 0, color: '#EF4444' },
          'no_show': { name: 'Gelmedi', value: 0, color: '#6B7280' }
        };

        allAppointments.forEach((apt: any) => {
          if (statusMap[apt.status]) {
            statusMap[apt.status].value++;
          }
        });

        setAppointmentsByStatus(Object.values(statusMap).filter((s: any) => s.value > 0));
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleDownloadReport = () => {
    // Create CSV data
    const csvData = [
      ['Net Randevu - Performans Raporu'],
      ['Oluşturulma Tarihi: ' + new Date().toLocaleDateString('tr-TR')],
      [],
      ['Metrik', 'Bu Ay', 'Geçen Ay', 'Değişim %'],
      ['Gelir', formatCurrency(reportData.thisMonth.revenue), formatCurrency(reportData.lastMonth.revenue), 
       calculatePercentageChange(reportData.thisMonth.revenue, reportData.lastMonth.revenue).toFixed(1) + '%'],
      ['Randevular', reportData.thisMonth.appointments.toString(), reportData.lastMonth.appointments.toString(),
       calculatePercentageChange(reportData.thisMonth.appointments, reportData.lastMonth.appointments).toFixed(1) + '%'],
      ['Yeni Müşteriler', reportData.thisMonth.customers.toString(), reportData.lastMonth.customers.toString(),
       calculatePercentageChange(reportData.thisMonth.customers, reportData.lastMonth.customers).toFixed(1) + '%'],
      ['Ortalama Randevu Değeri', formatCurrency(reportData.thisMonth.avgBookingValue), formatCurrency(reportData.lastMonth.avgBookingValue),
       calculatePercentageChange(reportData.thisMonth.avgBookingValue, reportData.lastMonth.avgBookingValue).toFixed(1) + '%'],
      [],
      ['En Popüler Hizmetler'],
      ['Hizmet', 'Randevu Sayısı', 'Toplam Gelir'],
      ...servicesData.map(s => [s.name, s.randevular.toString(), formatCurrency(s.gelir)]),
      [],
      ['Personel Performansı'],
      ['Personel', 'Tamamlanan Randevu', 'Toplam Gelir'],
      ...staffPerformance.map(s => [s.name, s.randevular.toString(), formatCurrency(s.gelir)])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rapor_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader user={user} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Raporlar yükleniyor...</p>
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
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                  <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="truncate">Raporlar ve Analizler</span>
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2">İşletmenizin performansını izleyin ve analiz edin</p>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center flex-1 sm:flex-initial" onClick={handleDownloadReport}>
                  <Download className="w-4 h-4 mr-2" />
                  Rapor İndir
                </Button>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Revenue */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Aylık Gelir</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(reportData.thisMonth.revenue)}
                    </p>
                    <div className="flex items-center mt-2">
                      {calculatePercentageChange(reportData.thisMonth.revenue, reportData.lastMonth.revenue) >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${
                        calculatePercentageChange(reportData.thisMonth.revenue, reportData.lastMonth.revenue) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        %{Math.abs(calculatePercentageChange(reportData.thisMonth.revenue, reportData.lastMonth.revenue)).toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">geçen aya göre</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointments */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Aylık Randevu</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.thisMonth.appointments}</p>
                    <div className="flex items-center mt-2">
                      {calculatePercentageChange(reportData.thisMonth.appointments, reportData.lastMonth.appointments) >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${
                        calculatePercentageChange(reportData.thisMonth.appointments, reportData.lastMonth.appointments) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        %{Math.abs(calculatePercentageChange(reportData.thisMonth.appointments, reportData.lastMonth.appointments)).toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">geçen aya göre</span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* New Customers */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Yeni Müşteri</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.thisMonth.customers}</p>
                    <div className="flex items-center mt-2">
                      {calculatePercentageChange(reportData.thisMonth.customers, reportData.lastMonth.customers) >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${
                        calculatePercentageChange(reportData.thisMonth.customers, reportData.lastMonth.customers) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        %{Math.abs(calculatePercentageChange(reportData.thisMonth.customers, reportData.lastMonth.customers)).toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">geçen aya göre</span>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Average Booking Value */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ortalama Randevu Değeri</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(reportData.thisMonth.avgBookingValue)}
                    </p>
                    <div className="flex items-center mt-2">
                      {calculatePercentageChange(reportData.thisMonth.avgBookingValue, reportData.lastMonth.avgBookingValue) >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${
                        calculatePercentageChange(reportData.thisMonth.avgBookingValue, reportData.lastMonth.avgBookingValue) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        %{Math.abs(calculatePercentageChange(reportData.thisMonth.avgBookingValue, reportData.lastMonth.avgBookingValue)).toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">geçen aya göre</span>
                    </div>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Son 6 Ay Gelir Trendi</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="gelir" stroke="#3B82F6" strokeWidth={2} name="Gelir" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Appointment Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Randevu Durumları</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={appointmentsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {appointmentsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Services */}
            <Card>
              <CardHeader>
                <CardTitle>En Popüler Hizmetler (Top 5)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={servicesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="randevular" fill="#10B981" name="Randevu Sayısı" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Staff Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Personel Performansı</CardTitle>
              </CardHeader>
              <CardContent>
                {staffPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={staffPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number, name: string) => 
                        name === 'gelir' ? formatCurrency(value) : value
                      } />
                      <Legend />
                      <Bar dataKey="gelir" fill="#F59E0B" name="Gelir" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Henüz tamamlanmış randevu yok</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Services Table */}
          {servicesData.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Hizmet Detayları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hizmet
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Randevu Sayısı
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Toplam Gelir
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ortalama Gelir
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {servicesData.map((service, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 mr-2" />
                              <div className="text-sm font-medium text-gray-900">{service.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {service.randevular}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(service.gelir)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(service.randevular > 0 ? service.gelir / service.randevular : 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staff Performance Table */}
          {staffPerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Personel Detayları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Personel
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tamamlanan Randevu
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Toplam Gelir
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ortalama Randevu Değeri
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {staffPerformance.map((member, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 text-blue-400 mr-2" />
                              <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.randevular}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(member.gelir)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(member.randevular > 0 ? member.gelir / member.randevular : 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
