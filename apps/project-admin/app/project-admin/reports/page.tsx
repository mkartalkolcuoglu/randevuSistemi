"use client";

import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@repo/ui';
import { 
  BarChart3, 
  Download, 
  ChevronLeft,
  DollarSign,
  Building2,
  TrendingUp,
  FileText,
  Filter,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Server,
  Globe
} from 'lucide-react';

// Helper function to format numbers consistently
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export default function ProjectAdminReportsPage() {
  // Mock data - gerçek implementasyonda API'den gelecek
  const platformMetrics = {
    thisMonth: {
      totalRevenue: 45600,
      commission: 6840, // %15 commission
      activeTenants: 118,
      newTenants: 12,
      churnRate: 2.1
    },
    lastMonth: {
      totalRevenue: 38900,
      commission: 5835,
      activeTenants: 112,
      newTenants: 8,
      churnRate: 1.8
    }
  };

  const topTenants = [
    { name: "Güzellik Merkezi Elit", revenue: 4850, growth: 15.2, appointments: 156 },
    { name: "Berber Shop Pro", revenue: 3920, growth: 8.7, appointments: 134 },
    { name: "Klinik Plus", revenue: 3650, growth: 22.1, appointments: 98 },
    { name: "Spa Wellness", revenue: 3200, growth: -2.3, appointments: 87 },
    { name: "Hair Studio", revenue: 2890, growth: 11.5, appointments: 76 }
  ];

  const platformReports = [
    { title: "Platform Gelir Raporu", icon: DollarSign, color: "bg-green-500", description: "Tüm tenant'lardan gelir analizi" },
    { title: "Aboneler Performansı", icon: Building2, color: "bg-blue-500", description: "Tenant başarı analitikleri" },
    { title: "Sistem Kullanım Raporu", icon: Server, color: "bg-purple-500", description: "Platform kaynak kullanımı" },
    { title: "Entegrasyon Raporu", icon: Globe, color: "bg-orange-500", description: "API ve servis kullanım analizi" },
  ];

  const calculateChange = (current: number, previous: number) => {
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-600" : "text-red-600";
  };

  const getGrowthBadge = (growth: number) => {
    if (growth >= 0) {
      return <Badge className="bg-green-100 text-green-800">+{growth}%</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">{growth}%</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/project-admin">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Project Admin
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Platform Raporları</h1>
                <p className="text-sm text-gray-600">Platform geneli analitikler ve performans raporları</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtrele
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Rapor Ayarları
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Platform Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Platform Geliri</p>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(platformMetrics.thisMonth.totalRevenue)}₺</p>
              <div className={`flex items-center mt-2 text-sm ${getChangeColor(parseFloat(calculateChange(platformMetrics.thisMonth.totalRevenue, platformMetrics.lastMonth.totalRevenue)))}`}>
                {getChangeIcon(parseFloat(calculateChange(platformMetrics.thisMonth.totalRevenue, platformMetrics.lastMonth.totalRevenue)))}
                <span className="ml-1">
                  %{Math.abs(parseFloat(calculateChange(platformMetrics.thisMonth.totalRevenue, platformMetrics.lastMonth.totalRevenue)))}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Komisyon Geliri</p>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{platformMetrics.thisMonth.commission.toLocaleString()}₺</p>
              <div className={`flex items-center mt-2 text-sm ${getChangeColor(parseFloat(calculateChange(platformMetrics.thisMonth.commission, platformMetrics.lastMonth.commission)))}`}>
                {getChangeIcon(parseFloat(calculateChange(platformMetrics.thisMonth.commission, platformMetrics.lastMonth.commission)))}
                <span className="ml-1">
                  %{Math.abs(parseFloat(calculateChange(platformMetrics.thisMonth.commission, platformMetrics.lastMonth.commission)))}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Aktif Aboneler</p>
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{platformMetrics.thisMonth.activeTenants}</p>
              <div className={`flex items-center mt-2 text-sm ${getChangeColor(parseFloat(calculateChange(platformMetrics.thisMonth.activeTenants, platformMetrics.lastMonth.activeTenants)))}`}>
                {getChangeIcon(parseFloat(calculateChange(platformMetrics.thisMonth.activeTenants, platformMetrics.lastMonth.activeTenants)))}
                <span className="ml-1">
                  %{Math.abs(parseFloat(calculateChange(platformMetrics.thisMonth.activeTenants, platformMetrics.lastMonth.activeTenants)))}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Yeni Aboneler</p>
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{platformMetrics.thisMonth.newTenants}</p>
              <div className={`flex items-center mt-2 text-sm ${getChangeColor(parseFloat(calculateChange(platformMetrics.thisMonth.newTenants, platformMetrics.lastMonth.newTenants)))}`}>
                {getChangeIcon(parseFloat(calculateChange(platformMetrics.thisMonth.newTenants, platformMetrics.lastMonth.newTenants)))}
                <span className="ml-1">
                  %{Math.abs(parseFloat(calculateChange(platformMetrics.thisMonth.newTenants, platformMetrics.lastMonth.newTenants)))}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Churn Oranı</p>
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">%{platformMetrics.thisMonth.churnRate}</p>
              <div className={`flex items-center mt-2 text-sm ${getChangeColor(-parseFloat(calculateChange(platformMetrics.thisMonth.churnRate, platformMetrics.lastMonth.churnRate)))}`}>
                {getChangeIcon(-parseFloat(calculateChange(platformMetrics.thisMonth.churnRate, platformMetrics.lastMonth.churnRate)))}
                <span className="ml-1">
                  %{Math.abs(parseFloat(calculateChange(platformMetrics.thisMonth.churnRate, platformMetrics.lastMonth.churnRate)))}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Reports */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Raporları</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {platformReports.map((report, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 ${report.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <report.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{report.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    İndir
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Platform Gelir Trendi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Platform gelir grafiği burada görüntülenecek</p>
                  <p className="text-sm text-gray-500 mt-2">Aylık platform gelir analizi</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Tenants */}
          <Card>
            <CardHeader>
              <CardTitle>En Başarılı Aboneler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topTenants.map((tenant, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{tenant.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>{tenant.revenue.toLocaleString()}₺</span>
                        <span>{tenant.appointments} randevu</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getGrowthBadge(tenant.growth)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Performance by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Kategori Bazında Performans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { category: "Güzellik Salonları", tenants: 45, revenue: 18500, percentage: 40 },
                  { category: "Berber Dükkanları", tenants: 38, revenue: 12200, percentage: 28 },
                  { category: "Klinikler", tenants: 22, revenue: 10800, percentage: 22 },
                  { category: "Spa & Wellness", tenants: 13, revenue: 4100, percentage: 10 }
                ].map((cat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{cat.category}</span>
                      <span className="text-gray-600">{cat.tenants} abone</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{cat.revenue.toLocaleString()}₺</span>
                      <span>{cat.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${cat.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>Sistem Sağlığı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { metric: "API Uptime", value: "99.8%", status: "excellent" },
                  { metric: "Ortalama Yanıt Süresi", value: "145ms", status: "good" },
                  { metric: "Hata Oranı", value: "0.2%", status: "excellent" },
                  { metric: "Aktif Bağlantılar", value: "1,247", status: "good" }
                ].map((metric, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">{metric.metric}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{metric.value}</span>
                      <div className={`w-3 h-3 rounded-full ${
                        metric.status === 'excellent' ? 'bg-green-500' : 
                        metric.status === 'good' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle>Entegrasyon Durumu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { service: "Iyzico Payments", usage: 85, status: "active" },
                  { service: "PayTR Gateway", usage: 72, status: "active" },
                  { service: "SMS Services", usage: 95, status: "active" },
                  { service: "Email Services", usage: 98, status: "active" }
                ].map((service, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{service.service}</span>
                      <Badge className={service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {service.status === 'active' ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Kullanım: {service.usage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${service.usage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Platform Rapor Dışa Aktarma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rapor Dönemi
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Bu Ay</option>
                  <option>Geçen Ay</option>
                  <option>Son 3 Ay</option>
                  <option>Son 6 Ay</option>
                  <option>Bu Yıl</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rapor Türü
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Platform Özeti</option>
                  <option>Gelir Analizi</option>
                  <option>Tenant Performansı</option>
                  <option>Sistem Kullanımı</option>
                  <option>Entegrasyon Raporu</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
