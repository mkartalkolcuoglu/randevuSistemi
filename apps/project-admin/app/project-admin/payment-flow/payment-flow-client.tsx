"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, Button } from '@repo/ui';
import {
  DollarSign, Building2, User, CreditCard, CheckCircle,
  AlertCircle, Search, X, Banknote, ArrowDownUp, RotateCcw,
} from 'lucide-react';

interface Payment {
  id: string; tenantId: string | null; tenantName: string;
  customerName: string | null; amount: number; paymentType: string | null;
  status: string; paidAt: string | null; createdAt: string;
  serviceName: string | null; packageName: string | null; productName: string | null;
}

interface CancelledCardPayment {
  id: string; tenantId: string; tenantName: string; customerName: string;
  customerPhone: string | null; serviceName: string; staffName: string;
  date: string; time: string; price: number | null; paymentType: string;
  refundCompleted: boolean | null; refundCompletedAt: string | null;
  refundNotes: string | null; createdAt: string; updatedAt: string;
}

interface Props {
  payments: Payment[];
  cancelledCardPayments: CancelledCardPayment[];
}

export default function PaymentFlowClient({ payments, cancelledCardPayments }: Props) {
  const [tab, setTab] = useState<'payments' | 'refunds'>('payments');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [localRefunds, setLocalRefunds] = useState(cancelledCardPayments);

  // Filtered payments
  const filtered = useMemo(() => {
    return payments.filter(p => {
      if (typeFilter !== 'all' && p.paymentType !== typeFilter) return false;
      if (dateFilter && p.paidAt && !p.paidAt.startsWith(dateFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.tenantName.toLowerCase().includes(q) && !(p.customerName || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [payments, search, typeFilter, dateFilter]);

  // Stats
  const totalAmount = filtered.reduce((s, p) => s + p.amount, 0);
  const cardCount = filtered.filter(p => p.paymentType === 'card').length;
  const eftCount = filtered.filter(p => p.paymentType === 'eft').length;
  const pendingRefunds = localRefunds.filter(r => !r.refundCompleted);
  const completedRefunds = localRefunds.filter(r => r.refundCompleted);
  const refundTotal = localRefunds.reduce((s, r) => s + (r.price || 0), 0);

  const handleRefund = async (id: string) => {
    if (!confirm('İade işlemini tamamladınız mı?')) return;
    setProcessingId(id);
    try {
      const res = await fetch('/api/project-admin/payment-flow/mark-refunded', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalRefunds(prev => prev.map(r => r.id === id ? { ...r, refundCompleted: true, refundCompletedAt: new Date().toISOString() } : r));
      } else { alert(data.error || 'Hata'); }
    } catch { alert('Bir hata oluştu'); } finally { setProcessingId(null); }
  };

  const getItemName = (p: Payment) => p.serviceName || p.packageName || p.productName || '—';

  const fmt = (n: number) => `₺${n.toLocaleString('tr-TR')}`;
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('tr-TR') : '—';
  const fmtTime = (d: string | null) => d ? new Date(d).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ödeme Akışı</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ödemeleri ve iadeleri takip edin</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Toplam Ödeme', value: filtered.length, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Toplam Tutar', value: fmt(totalAmount), icon: Banknote, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Kredi Kartı', value: cardCount, icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Havale/EFT', value: eftCount, icon: ArrowDownUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'İade Bekliyor', value: pendingRefunds.length, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 ${s.bg} rounded-lg`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-lg font-bold text-gray-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        <button onClick={() => setTab('payments')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${tab === 'payments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Ödemeler ({payments.length})
        </button>
        <button onClick={() => setTab('refunds')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${tab === 'refunds' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          İadeler ({localRefunds.length})
          {pendingRefunds.length > 0 && (
            <span className="w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">{pendingRefunds.length}</span>
          )}
        </button>
      </div>

      {/* PAYMENTS TAB */}
      {tab === 'payments' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="İşletme veya müşteri ara..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
              <option value="all">Tüm Tipler</option>
              <option value="card">Kredi Kartı</option>
              <option value="eft">Havale/EFT</option>
            </select>
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            {(search || typeFilter !== 'all' || dateFilter) && (
              <button onClick={() => { setSearch(''); setTypeFilter('all'); setDateFilter(''); }} className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-red-500">
                <X className="w-3 h-3" /> Temizle
              </button>
            )}
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Tarih</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">İşletme</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Müşteri</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Hizmet/Ürün</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Tutar</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-500">Tip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12 text-gray-400">Ödeme bulunamadı</td></tr>
                    ) : filtered.map(p => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{fmtDate(p.paidAt)}</p>
                          <p className="text-xs text-gray-400">{fmtTime(p.paidAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-800">{p.tenantName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-700">{p.customerName || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{getItemName(p)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(p.amount)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.paymentType === 'card' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {p.paymentType === 'card' ? 'Kart' : 'EFT'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* REFUNDS TAB */}
      {tab === 'refunds' && (
        <>
          {/* Refund Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-yellow-50 rounded-lg"><AlertCircle className="w-5 h-5 text-yellow-600" /></div>
                <div><p className="text-xs text-gray-500">Bekliyor</p><p className="text-lg font-bold text-gray-900">{pendingRefunds.length}</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
                <div><p className="text-xs text-gray-500">Tamamlandı</p><p className="text-lg font-bold text-gray-900">{completedRefunds.length}</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg"><RotateCcw className="w-5 h-5 text-red-500" /></div>
                <div><p className="text-xs text-gray-500">Toplam Tutar</p><p className="text-lg font-bold text-gray-900">{fmt(refundTotal)}</p></div>
              </CardContent>
            </Card>
          </div>

          {/* Refunds Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-500">İşletme</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Müşteri</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Hizmet</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Randevu</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Tutar</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-500">Durum</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-500 w-32">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localRefunds.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-gray-400">İade kaydı yok</td></tr>
                    ) : localRefunds.map(r => (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-gray-900">{r.tenantName}</td>
                        <td className="px-4 py-3">
                          <p className="text-gray-800">{r.customerName}</p>
                          <p className="text-xs text-gray-400">{r.customerPhone}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-800">{r.serviceName}</p>
                          <p className="text-xs text-gray-400">{r.staffName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-800">{r.date}</p>
                          <p className="text-xs text-gray-400">{r.time}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(r.price || 0)}</td>
                        <td className="px-4 py-3 text-center">
                          {r.refundCompleted ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3" /> Yapıldı
                              </span>
                              {r.refundCompletedAt && <p className="text-xs text-gray-400 mt-0.5">{fmtDate(r.refundCompletedAt)}</p>}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              <AlertCircle className="w-3 h-3" /> Bekliyor
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!r.refundCompleted ? (
                            <Button size="sm" onClick={() => handleRefund(r.id)} disabled={processingId === r.id} className="bg-green-600 hover:bg-green-700 text-white text-xs">
                              {processingId === r.id ? 'İşleniyor...' : 'İade Yap'}
                            </Button>
                          ) : (
                            <span className="text-xs text-green-600 font-medium">✓ Tamamlandı</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
