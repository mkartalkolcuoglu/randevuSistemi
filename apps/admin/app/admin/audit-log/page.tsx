'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Calendar,
  User,
  ArrowLeft,
} from 'lucide-react';

interface AuditLog {
  id: string;
  tenantId: string;
  userId: string | null;
  userName: string | null;
  userType: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string | null;
  source: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ENTITY_LABELS: Record<string, string> = {
  appointment: 'Randevu',
  transaction: 'Kasa İşlemi',
  customer: 'Müşteri',
  service: 'Hizmet',
  staff: 'Personel',
  settings: 'Ayarlar',
  package: 'Paket',
  product: 'Ürün',
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Oluşturma',
  update: 'Güncelleme',
  delete: 'Silme',
  cancel: 'İptal',
  status_change: 'Durum Değişikliği',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  cancel: 'bg-orange-100 text-orange-700',
  status_change: 'bg-purple-100 text-purple-700',
};

const SOURCE_LABELS: Record<string, string> = {
  admin: 'Web Panel',
  mobile: 'Mobil',
  web: 'Web',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  // Filters
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (entity) params.set('entity', entity);
      if (action) params.set('action', action);
      if (search) params.set('search', search);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/audit-log?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [entity, action, search, startDate, endDate]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const clearFilters = () => {
    setEntity('');
    setAction('');
    setSearch('');
    setStartDate('');
    setEndDate('');
  };

  const hasFilters = entity || action || search || startDate || endDate;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">İşlem Geçmişi</h1>
            <p className="text-sm text-gray-500">{pagination.total} kayıt</p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${
            hasFilters
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtrele
          {hasFilters && (
            <span className="w-2 h-2 bg-indigo-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Ara</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Özet içinde ara..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Varlık</label>
              <select
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">Tümü</option>
                {Object.entries(ENTITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">İşlem</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">Tümü</option>
                {Object.entries(ACTION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Başlangıç</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Bitiş</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500"
            >
              <X className="w-3 h-3" /> Filtreleri temizle
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Yükleniyor...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Kayıt bulunamadı</p>
            <p className="text-sm text-gray-400 mt-1">İşlem geçmişi henüz boş veya filtrelere uygun kayıt yok.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Tarih</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Kullanıcı</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">İşlem</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Varlık</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Özet</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Kaynak</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {format(new Date(log.createdAt), 'd MMM HH:mm', { locale: tr })}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium text-gray-800">{log.userName || '—'}</span>
                          {log.userType && (
                            <span className="text-xs text-gray-400">
                              ({log.userType === 'owner' ? 'Sahip' : log.userType === 'staff' ? 'Personel' : 'Müşteri'})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-600">{ENTITY_LABELS[log.entity] || log.entity}</span>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-gray-700">{log.summary}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">
                        {SOURCE_LABELS[log.source || ''] || log.source || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400 font-mono">
                        {log.ipAddress || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fetchLogs(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm px-2 text-gray-600">{pagination.page} / {pagination.totalPages}</span>
                  <button
                    onClick={() => fetchLogs(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
