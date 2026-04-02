"use client";

import Link from 'next/link';
import { Card, CardContent } from '@repo/ui';
import {
  Building2,
  Globe,
  LifeBuoy,
  Shield,
  TrendingUp,
  Users,
  CheckCircle,
  DollarSign,
  BarChart3,
  Package,
  CreditCard,
  FileText,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export default function ProjectAdminDashboard() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: 0,
    totalAppointments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/tenants?limit=200');
        const data = await response.json();
        if (data.success) {
          const tenants = data.data;
          setStats({
            totalTenants: tenants.length,
            activeTenants: tenants.filter((t: any) => t.status === 'active').length,
            totalRevenue: tenants.reduce((sum: number, t: any) => sum + (t.monthlyRevenue || 0), 0),
            totalAppointments: tenants.reduce((sum: number, t: any) => sum + (t.appointmentCount || 0), 0),
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const modules = [
    { title: "Aboneler", desc: "İşletmeleri yönet", icon: Building2, href: "/project-admin/tenants", color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Paketler", desc: "Abonelik planları", icon: Package, href: "/project-admin/packages", color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Sayfalar", desc: "CMS içerik yönetimi", icon: FileText, href: "/project-admin/pages", color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Raporlar", desc: "Analiz ve istatistik", icon: BarChart3, href: "/project-admin/reports", color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Ödeme Akışı", desc: "Ödemeler ve iadeler", icon: CreditCard, href: "/project-admin/payment-flow", color: "text-green-600", bg: "bg-green-50" },
    { title: "Entegrasyonlar", desc: "3. parti servisler", icon: Globe, href: "/project-admin/integrations", color: "text-cyan-600", bg: "bg-cyan-50" },
    { title: "Destek", desc: "Ticket sistemi", icon: LifeBuoy, href: "/project-admin/support", color: "text-purple-600", bg: "bg-purple-50" },
    { title: "SLA", desc: "Performans metrikleri", icon: Shield, href: "/project-admin/sla", color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Platform genel görünümü</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Toplam Abone</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? '—' : stats.totalTenants}</p>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Aktif Abone</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{loading ? '—' : stats.activeTenants}</p>
              </div>
              <div className="p-2.5 bg-green-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Toplam Gelir</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? '—' : `${formatNumber(stats.totalRevenue)}₺`}</p>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Toplam Randevu</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{loading ? '—' : formatNumber(stats.totalAppointments)}</p>
              </div>
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modules Grid */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Yönetim Modülleri</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {modules.map((mod) => (
            <Link key={mod.title} href={mod.href}>
              <Card className="hover:shadow-md hover:border-gray-300 transition-all cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2.5 ${mod.bg} rounded-xl flex-shrink-0`}>
                    <mod.icon className={`w-5 h-5 ${mod.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{mod.title}</p>
                    <p className="text-xs text-gray-500 truncate">{mod.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
