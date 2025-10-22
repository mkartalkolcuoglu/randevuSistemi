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
  ArrowDownRight
} from 'lucide-react';
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
      
      // Fetch appointments, customers, services data
      const [appointmentsRes, customersRes, servicesRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/customers'),
        fetch('/api/services')
      ]);

      const appointments = await appointmentsRes.json();
      const customers = await customersRes.json();
      const services = await servicesRes.json();

      // Calculate this month's data
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      if (appointments.success && appointments.data) {
        const thisMonthAppointments = appointments.data.filter((apt: any) => {
          const aptDate = new Date(apt.createdAt);
          return aptDate >= firstDayThisMonth && apt.status !== 'cancelled';
        });

        const lastMonthAppointments = appointments.data.filter((apt: any) => {
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
      currency: 'TRY'
    }).format(amount);
  };

  // Button handlers
  const handleFilter = () => {
    setShowFilterModal(true);
  };

  const handleDownloadReport = () => {
    // Create CSV data
    const csvData = [
      ['Metrik', 'Bu Ay', 'Geçen Ay', 'Değişim %'],
      ['Gelir', formatCurrency(reportData.thisMonth.revenue), formatCurrency(reportData.lastMonth.revenue), 
       calculatePercentageChange(reportData.thisMonth.revenue, reportData.lastMonth.revenue).toFixed(1) + '%'],
      ['Randevular', reportData.thisMonth.appointments.toString(), reportData.lastMonth.appointments.toString(),
       calculatePercentageChange(reportData.thisMonth.appointments, reportData.lastMonth.appointments).toFixed(1) + '%'],
      ['Yeni Müşteriler', reportData.thisMonth.customers.toString(), reportData.lastMonth.customers.toString(),
       calculatePercentageChange(reportData.thisMonth.customers, reportData.lastMonth.customers).toFixed(1) + '%'],
      ['Ortalama Randevu Değeri', formatCurrency(reportData.thisMonth.avgBookingValue), formatCurrency(reportData.lastMonth.avgBookingValue),
       calculatePercentageChange(reportData.thisMonth.avgBookingValue, reportData.lastMonth.avgBookingValue).toFixed(1) + '%']
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

  const handleDetailedReport = () => {
    alert('Detaylı rapor özelliği yakında eklenecek. Bu rapor tüm verilerin Excel formatında dışa aktarılmasını sağlayacak.');
  };

  const handleExportData = () => {
    // Same as download report for now
    handleDownloadReport();
  };

  const handleDateRange = () => {
    setShowDatePicker(!showDatePicker);
  };

  const applyDateFilter = () => {
    if (startDate && endDate) {
      alert(`Tarih aralığı: ${startDate} - ${endDate}\n\nBu özellik yakında aktif olacak.`);
      setShowDatePicker(false);
    } else {
      alert('Lütfen başlangıç ve bitiş tarihlerini seçin.');
    }
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <BarChart3 className="w-8 h-8 mr-3" />
                  Raporlar ve Analizler
                </h1>
                <p className="text-gray-600 mt-2">İşletmenizin performansını izleyin ve analiz edin</p>
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline" className="flex items-center" onClick={handleFilter}>
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrele
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center" onClick={handleDownloadReport}>
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
            <Card>
              <CardHeader>
                <CardTitle>Aylık Gelir Trendi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>Grafik özelliği yakında eklenecek</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popüler Hizmetler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>Grafik özelliği yakında eklenecek</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center" onClick={handleDetailedReport}>
                  <FileText className="w-6 h-6 mb-2" />
                  Detaylı Rapor
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center" onClick={handleExportData}>
                  <Download className="w-6 h-6 mb-2" />
                  Veri Dışa Aktar
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center" onClick={handleDateRange}>
                  <Calendar className="w-6 h-6 mb-2" />
                  Tarih Aralığı Seç
                </Button>
              </div>

              {/* Date Picker Modal */}
              {showDatePicker && (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="font-semibold mb-3">Tarih Aralığı Seçin</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Başlangıç Tarihi
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bitiş Tarihi
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowDatePicker(false)}>
                      İptal
                    </Button>
                    <Button onClick={applyDateFilter} className="bg-blue-600 hover:bg-blue-700 text-white">
                      Uygula
                    </Button>
                  </div>
                </div>
              )}

              {/* Filter Modal */}
              {showFilterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <h2 className="text-xl font-bold mb-4">Filtre Seçenekleri</h2>
                    <p className="text-gray-600 mb-6">
                      Filtreleme özelliği yakında eklenecek. Bu özellik sayesinde raporları tarih aralığı, personel, hizmet türü ve daha fazlasına göre filtreleyebileceksiniz.
                    </p>
                    <div className="flex justify-end">
                      <Button onClick={() => setShowFilterModal(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Tamam
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
