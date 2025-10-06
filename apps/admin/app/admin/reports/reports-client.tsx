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
import type { AuthenticatedUser } from '../../../lib/auth-utils';

interface ReportsClientProps {
  user: AuthenticatedUser;
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
                <Button variant="outline" className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrele
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center">
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
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                  <FileText className="w-6 h-6 mb-2" />
                  Detaylı Rapor
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                  <Download className="w-6 h-6 mb-2" />
                  Veri Dışa Aktar
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                  <Calendar className="w-6 h-6 mb-2" />
                  Tarih Aralığı Seç
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
