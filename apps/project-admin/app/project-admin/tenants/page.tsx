"use client";

import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Globe,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  ArrowLeft
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

export default function TenantsManagement() {
  const [mounted, setMounted] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    inactiveTenants: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      
      // First, check and update expired subscriptions
      try {
        await fetch('/api/tenants/check-subscriptions', {
          method: 'POST'
        });
      } catch (err) {
        console.error('Error checking subscriptions:', err);
        // Continue even if check fails
      }

      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`/api/tenants?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTenants(data.data);
        
        // Calculate stats
        const totalTenants = data.data.length;
        const activeTenants = data.data.filter((t: any) => t.status === 'active').length;
        const trialTenants = data.data.filter((t: any) => t.plan === 'Trial').length;
        const inactiveTenants = data.data.filter((t: any) => t.status === 'suspended' || t.status === 'inactive').length;
        
        setStats({
          totalTenants,
          activeTenants,
          trialTenants,
          inactiveTenants
        });
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, planFilter]);

  // Fetch tenants from API
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (mounted) {
      fetchTenants();
    }
  }, [mounted, fetchTenants]);
  
  if (!mounted) {
    return <div>Loading...</div>;
  }

  const handleDeleteTenant = async (tenantId: string) => {
    const tenant = tenants.find((t: any) => t.id === tenantId);
    if (!tenant) return;

    const confirmed = confirm(`"${(tenant as any).businessName}" aboneyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('Abone başarıyla silindi');
        fetchTenants(); // Refresh the list
      } else {
        alert('Abone silinirken hata oluştu: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting tenant:', error);
      alert('Bir hata oluştu');
    }
  };


  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Aktif' },
      trial: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'Deneme' },
      inactive: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Pasif' },
      suspended: { color: 'bg-yellow-100 text-yellow-800', icon: Pause, text: 'Askıda' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getPlanBadge = (plan: string) => {
    const planColors = {
      'Trial': 'bg-gray-100 text-gray-800',
      'Standard': 'bg-blue-100 text-blue-800',
      'Premium': 'bg-purple-100 text-purple-800',
      'Enterprise': 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${planColors[plan as keyof typeof planColors] || planColors.Standard}`}>
        {plan}
      </span>
    );
  };

  const getUsageBar = (current: number, limit: number) => {
    if (limit === -1) return null; // Unlimited
    const percentage = Math.min((current / limit) * 100, 100);
    const isWarning = percentage > 80;

    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${isWarning ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Aboneler yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/project-admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri Dön
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Aboneler</h1>
          <p className="text-gray-600">Platform abonelerini yönetin ve performanslarını takip edin</p>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Aboneler</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTenants}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Aktif Aboneler</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeTenants}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Deneme Sürümü</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.trialTenants}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pasif Aboneler</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inactiveTenants}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Abone ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="trial">Deneme</option>
              <option value="suspended">Pasif</option>
            </select>
            
            <select 
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Planlar</option>
              <option value="Trial">Trial</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>

          <Link href="/project-admin/tenants/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Abone
            </Button>
          </Link>
        </div>

        {/* Tenants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Aboneler Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Abone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Plan</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Durum</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Gelir</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Kullanım</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant: any) => (
                    <tr key={tenant.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                            {tenant.businessName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{tenant.businessName}</div>
                            <div className="text-sm text-gray-500">{tenant.slug}</div>
                            <div className="text-sm text-gray-500">{tenant.ownerName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getPlanBadge(tenant.plan)}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(tenant.status)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-lg font-semibold text-gray-900">
                          ₺{(tenant.monthlyRevenue || 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Aylık
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-600">Randevular: {tenant.appointmentCount || 0}</div>
                          <div className="text-sm text-gray-600">Müşteriler: {tenant.customerCount || 0}</div>
                          <div className="text-sm text-gray-500">Üye: {new Date(tenant.createdAt).toLocaleDateString('tr-TR')}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <Link href={`/project-admin/tenants/${tenant.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/project-admin/tenants/${tenant.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`https://randevu-sistemi-web.vercel.app/${tenant.slug}`} target="_blank">
                            <Button variant="outline" size="sm">
                              <Globe className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteTenant(tenant.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>En Çok Gelir Getiren Aboneler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tenants
                  .sort((a, b) => (b.totalRevenue || b.monthlyRevenue || 0) - (a.totalRevenue || a.monthlyRevenue || 0))
                  .slice(0, 5)
                  .map((tenant, index) => (
                    <div key={tenant.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{tenant.businessName}</div>
                          <div className="text-sm text-gray-500">{tenant.plan}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">₺{((tenant.totalRevenue || tenant.monthlyRevenue || 0)).toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{tenant.appointmentCount || 0} randevu</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yenilenmesi Yaklaşan Abonelikler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tenants
                  .filter(t => t.status === 'active')
                  .slice(0, 5)
                  .map((tenant) => (
                    <div key={tenant.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{tenant.businessName}</div>
                        <div className="text-sm text-gray-600">{tenant.plan} Plan</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-yellow-800">Aylık</div>
                        <div className="text-xs text-yellow-600">
                          Yenileme gerekli
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
