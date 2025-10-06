"use client";

import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@repo/ui';
import { 
  Building2, 
  Globe, 
  LifeBuoy, 
  Shield,
  TrendingUp,
  Users,
  Server,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Activity,
  Settings,
  BarChart3,
  Zap
} from 'lucide-react';
import { useState, useEffect } from 'react';

// Helper function to format numbers consistently
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export default function ProjectAdminDashboard() {
  const [platformStats, setPlatformStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformStats();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tenants?limit=100');
      const data = await response.json();
      
      if (data.success) {
        const tenants = data.data;
        const totalTenants = tenants.length;
        const activeTenants = tenants.filter((t: any) => t.status === 'active').length;
        const totalRevenue = tenants.reduce((sum: number, t: any) => sum + (t.monthlyRevenue || 0), 0);
        
        setPlatformStats({
          totalTenants,
          activeTenants,
          totalRevenue,
          monthlyGrowth: 12.5 // Mock growth rate for now
        });
      }
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { title: "Aboneler", icon: Building2, href: "/project-admin/tenants", color: "bg-blue-500" },
    { title: "Entegrasyonlar", icon: Globe, href: "/project-admin/integrations", color: "bg-green-500" },
    { title: "Destek Sistemi", icon: LifeBuoy, href: "/project-admin/support", color: "bg-purple-500" },
    { title: "SLA Takibi", icon: Shield, href: "/project-admin/sla", color: "bg-orange-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project Admin Panel</h1>
              <p className="text-sm text-gray-600">Platform ve sistem yönetimi</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Sistem Ayarları
              </Button>
              <div className="h-8 w-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">PA</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Aboneler</p>
                  <p className="text-3xl font-bold text-gray-900">{platformStats.totalTenants}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktif Aboneler</p>
                  <p className="text-3xl font-bold text-green-600">{platformStats.activeTenants}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aylık Gelir</p>
                  <p className="text-3xl font-bold text-green-600">{formatNumber(platformStats.totalRevenue)}₺</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Büyüme Oranı</p>
                  <p className="text-3xl font-bold text-purple-600">%{platformStats.monthlyGrowth}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Platform Management Navigation */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Yönetimi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/project-admin/tenants">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <Building2 className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aboneler</h3>
                  <p className="text-sm text-gray-600">Tenant yönetimi, aktivasyon ve deaktivasyonlar</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/project-admin/integrations">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <Globe className="w-8 h-8 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Entegrasyonlar</h3>
                  <p className="text-sm text-gray-600">API servisleri, ödeme sistemleri ve üçüncü parti entegrasyonlar</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/project-admin/support">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <LifeBuoy className="w-8 h-8 text-purple-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Destek Sistemi</h3>
                  <p className="text-sm text-gray-600">Cases, ticket'lar ve müşteri destek yönetimi</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/project-admin/sla">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <Shield className="w-8 h-8 text-orange-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">SLA Takibi</h3>
                  <p className="text-sm text-gray-600">Hizmet seviyesi anlaşmaları ve performans metrikleri</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/project-admin/reports">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <BarChart3 className="w-8 h-8 text-indigo-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Raporlama</h3>
                  <p className="text-sm text-gray-600">Platform analitikleri ve gelir raporları</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/project-admin/settings">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <Settings className="w-8 h-8 text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sistem Ayarları</h3>
                  <p className="text-sm text-gray-600">Platform konfigürasyonu ve genel ayarlar</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}