"use client";

import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import {
  Building2, Plus, Search, Eye, Edit, Trash2, Users, Globe,
  CheckCircle, XCircle, Clock, DollarSign, Calendar, AlertTriangle,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface SubscriptionPackage {
  id: string;
  name: string;
  slug: string;
  durationDays: number;
  price: number;
  isActive: boolean;
  isFeatured: boolean;
}

const formatCurrency = (num: number) => `₺${num.toLocaleString('tr-TR')}`;

export default function TenantsManagement() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      fetch('/api/tenants/check-subscriptions', { method: 'POST' }).catch(() => {});

      const [tenantsRes, packagesRes] = await Promise.all([
        fetch(`/api/tenants?page=1&limit=100${searchTerm ? `&search=${searchTerm}` : ''}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`),
        fetch('/api/packages'),
      ]);

      const tenantsData = await tenantsRes.json();
      const packagesData = await packagesRes.json();

      if (tenantsData.success) setTenants(tenantsData.data);
      if (packagesData.data) setPackages(packagesData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (tenant: any) => {
    if (!confirm(`"${tenant.businessName}" aboneyi silmek istediğinizden emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/tenants/${tenant.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchData();
      else alert('Hata: ' + data.error);
    } catch { alert('Bir hata oluştu'); }
  };

  // Stats
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === 'active').length;
  const inactiveTenants = tenants.filter(t => t.status === 'suspended' || t.status === 'inactive').length;
  const totalRevenue = tenants.reduce((sum, t) => sum + (t.totalRevenue || 0), 0);
  const totalAppointments = tenants.reduce((sum, t) => sum + (t.appointmentCount || 0), 0);

  // Helpers
  const getRemainingDays = (end: string | null) => {
    if (!end) return null;
    return Math.ceil((new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getDaysBadge = (days: number | null) => {
    if (days === null) return 'bg-gray-100 text-gray-600';
    if (days <= 0) return 'bg-red-100 text-red-700';
    if (days <= 7) return 'bg-orange-100 text-orange-700';
    if (days <= 15) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      active: { color: 'bg-green-100 text-green-700', label: 'Aktif' },
      trial: { color: 'bg-blue-100 text-blue-700', label: 'Deneme' },
      inactive: { color: 'bg-red-100 text-red-700', label: 'Pasif' },
      suspended: { color: 'bg-yellow-100 text-yellow-700', label: 'Askıda' },
    };
    const s = map[status] || map.inactive;
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>;
  };

  const getPlanName = (tenant: any) => {
    const slug = tenant.subscriptionPlan || tenant.plan;
    return packages.find(p => p.slug === slug)?.name || slug || '—';
  };

  // Filter by plan
  const filteredTenants = planFilter === 'all'
    ? tenants
    : tenants.filter(t => (t.subscriptionPlan || t.plan) === planFilter);

  // Expiring soon (active tenants sorted by remaining days ascending)
  const expiringSoon = tenants
    .filter(t => t.status === 'active' && t.subscriptionEnd)
    .map(t => ({ ...t, _days: getRemainingDays(t.subscriptionEnd) }))
    .filter(t => t._days !== null && t._days > 0 && t._days <= 30)
    .sort((a, b) => (a._days || 0) - (b._days || 0))
    .slice(0, 5);

  // Top revenue
  const topRevenue = [...tenants]
    .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aboneler</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform abonelerini yönetin</p>
        </div>
        <Link href="/project-admin/tenants/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-1.5" />
            Yeni Abone
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Toplam', value: totalTenants, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Aktif', value: activeTenants, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pasif', value: inactiveTenants, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Toplam Gelir', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Randevular', value: totalAppointments.toLocaleString(), icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 ${stat.bg} rounded-lg`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Abone ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="all">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="suspended">Pasif</option>
          <option value="inactive">İnaktif</option>
        </select>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="all">Tüm Planlar</option>
          {packages.map(pkg => (
            <option key={pkg.slug} value={pkg.slug}>{pkg.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Abone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Durum</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Kalan</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Gelir</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Randevu</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Müşteri</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 w-40">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant: any) => {
                  const days = getRemainingDays(tenant.subscriptionEnd);
                  return (
                    <tr key={tenant.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {tenant.businessName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{tenant.businessName}</p>
                            <p className="text-xs text-gray-400 truncate">{tenant.ownerName} · {tenant.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-gray-700">{getPlanName(tenant)}</span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(tenant.status)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getDaysBadge(days)}`}>
                          {days === null ? '—' : days <= 0 ? 'Doldu' : `${days} gün`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(tenant.totalRevenue || 0)}</p>
                        <p className="text-xs text-gray-400">bu ay {formatCurrency(tenant.monthlyRevenue || 0)}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-700">{tenant.appointmentCount || 0}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-700">{tenant.customerCount || 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1">
                          <Link href={`/project-admin/tenants/${tenant.id}`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0"><Eye className="w-3.5 h-3.5" /></Button>
                          </Link>
                          <Link href={`/project-admin/tenants/${tenant.id}/edit`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0"><Edit className="w-3.5 h-3.5" /></Button>
                          </Link>
                          <Link href={`https://netrandevu.com/${tenant.slug}`} target="_blank">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0"><Globe className="w-3.5 h-3.5" /></Button>
                          </Link>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 border-red-200" onClick={() => handleDelete(tenant)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredTenants.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">Abone bulunamadı</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Revenue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              En Çok Gelir Getiren
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {topRevenue.map((tenant, i) => (
                <div key={tenant.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tenant.businessName}</p>
                      <p className="text-xs text-gray-400">{tenant.appointmentCount || 0} randevu · {tenant.customerCount || 0} müşteri</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-green-600">{formatCurrency(tenant.totalRevenue || 0)}</p>
                </div>
              ))}
              {topRevenue.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Veri yok</p>}
            </div>
          </CardContent>
        </Card>

        {/* Expiring Soon */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Süresi Yaklaşanlar (30 gün içinde)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {expiringSoon.map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between p-2.5 rounded-lg bg-orange-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tenant.businessName}</p>
                    <p className="text-xs text-gray-500">{getPlanName(tenant)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getDaysBadge(tenant._days)}`}>
                    {tenant._days} gün kaldı
                  </span>
                </div>
              ))}
              {expiringSoon.length === 0 && <p className="text-sm text-gray-400 text-center py-4">30 gün içinde süresi dolacak abone yok</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
