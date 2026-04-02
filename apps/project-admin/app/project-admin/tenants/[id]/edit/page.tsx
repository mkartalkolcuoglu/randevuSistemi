"use client";

import Link from 'next/link';
import { Button, Card, CardContent } from '@repo/ui';
import { ArrowLeft, Save, Trash2, Building2, UserCircle, CreditCard, Palette, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SubscriptionPackage {
  id: string; name: string; slug: string; durationDays: number; price: number;
  isActive: boolean; isFeatured: boolean;
}

interface EditTenantPageProps { params: Promise<{ id: string }>; }

export default function EditTenantPage({ params }: EditTenantPageProps) {
  const router = useRouter();
  const [tenantId, setTenantId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [activeTab, setActiveTab] = useState<'business' | 'owner' | 'subscription' | 'theme' | 'hours'>('business');

  const [formData, setFormData] = useState({
    businessName: '', slug: '', username: '', password: '',
    ownerName: '', ownerEmail: '', phone: '',
    plan: 'Standard', status: 'active', address: '',
    businessType: 'salon', businessDescription: '',
    subscriptionPlan: '', subscriptionStart: '', subscriptionEnd: '',
    workingHours: {
      monday: { start: '09:00', end: '18:00', closed: false },
      tuesday: { start: '09:00', end: '18:00', closed: false },
      wednesday: { start: '09:00', end: '18:00', closed: false },
      thursday: { start: '09:00', end: '18:00', closed: false },
      friday: { start: '09:00', end: '18:00', closed: false },
      saturday: { start: '09:00', end: '17:00', closed: false },
      sunday: { start: '10:00', end: '16:00', closed: true },
    },
    theme: { primaryColor: '#163974', secondaryColor: '#f3f4f6', logo: '', headerImage: '' },
  });

  useEffect(() => {
    params.then(p => { setTenantId(p.id); fetchTenant(p.id); });
    fetchPackages();
  }, [params]);

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/packages');
      if (res.ok) { const d = await res.json(); setPackages((d.data || []).filter((p: any) => p.isActive)); }
    } catch {}
  };

  const fetchTenant = async (id: string) => {
    try {
      const res = await fetch(`/api/tenants/${id}`);
      const d = await res.json();
      if (d.success) {
        const t = d.data;
        const wh = typeof t.workingHours === 'string' ? JSON.parse(t.workingHours) : t.workingHours || formData.workingHours;
        const th = typeof t.theme === 'string' ? JSON.parse(t.theme) : t.theme || formData.theme;
        setFormData({
          businessName: t.businessName || '', slug: t.slug || '', username: t.username || '', password: t.password || '',
          ownerName: t.ownerName || '', ownerEmail: t.ownerEmail || '', phone: t.phone || '',
          plan: t.plan || 'Standard', status: t.status || 'active', address: t.address || '',
          businessType: t.businessType || 'salon', businessDescription: t.businessDescription || '',
          subscriptionPlan: t.subscriptionPlan || '', subscriptionStart: t.subscriptionStart || '', subscriptionEnd: t.subscriptionEnd || '',
          workingHours: wh, theme: th,
        });
      } else { alert('Abone bulunamadı'); router.push('/project-admin/tenants'); }
    } catch { alert('Yükleme hatası'); } finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'subscriptionPlan') {
      const pkg = packages.find(p => p.slug === value);
      if (pkg) {
        const now = new Date();
        const end = new Date(now.getTime() + pkg.durationDays * 86400000);
        setFormData(prev => ({ ...prev, subscriptionPlan: value, subscriptionStart: now.toISOString(), subscriptionEnd: end.toISOString() }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const d = await res.json();
      if (d.success) {
        fetch('/api/tenants/generate-landing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId }) }).catch(() => {});
        router.push('/project-admin/tenants');
      } else { alert('Hata: ' + d.error); }
    } catch { alert('Bir hata oluştu'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Bu aboneyi silmek istediğinizden emin misiniz?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) { router.push('/project-admin/tenants'); } else { alert('Hata: ' + d.error); }
    } catch { alert('Bir hata oluştu'); } finally { setDeleting(false); }
  };

  const DAYS = [
    { key: 'monday', label: 'Pazartesi' }, { key: 'tuesday', label: 'Salı' },
    { key: 'wednesday', label: 'Çarşamba' }, { key: 'thursday', label: 'Perşembe' },
    { key: 'friday', label: 'Cuma' }, { key: 'saturday', label: 'Cumartesi' },
    { key: 'sunday', label: 'Pazar' },
  ];

  const TABS = [
    { id: 'business' as const, label: 'İşletme', icon: Building2 },
    { id: 'owner' as const, label: 'Sahip', icon: UserCircle },
    { id: 'subscription' as const, label: 'Abonelik', icon: CreditCard },
    { id: 'hours' as const, label: 'Çalışma', icon: Clock },
    { id: 'theme' as const, label: 'Tema', icon: Palette },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  const remainingDays = formData.subscriptionEnd
    ? Math.ceil((new Date(formData.subscriptionEnd).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/project-admin/tenants">
            <button className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{formData.businessName || 'Abone Düzenle'}</h1>
            <p className="text-xs text-gray-500">{formData.slug} · {formData.ownerName}</p>
          </div>
        </div>
        <Button onClick={handleDelete} disabled={deleting} variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 text-sm">
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          {deleting ? 'Siliniyor...' : 'Sil'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* İşletme */}
        {activeTab === 'business' && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="İşletme Adı *" name="businessName" value={formData.businessName} onChange={handleChange} required />
                <Field label="URL Slug *" name="slug" value={formData.slug} onChange={handleChange} required hint={`netrandevu.com/${formData.slug}`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Kullanıcı Adı *" name="username" value={formData.username} onChange={handleChange} required />
                <Field label="Şifre *" name="password" value={formData.password} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İşletme Türü</label>
                <select name="businessType" value={formData.businessType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500">
                  <option value="salon">Güzellik Salonu</option>
                  <option value="barber">Berber</option>
                  <option value="clinic">Klinik</option>
                  <option value="spa">SPA</option>
                  <option value="fitness">Fitness</option>
                  <option value="other">Diğer</option>
                </select>
              </div>
              <Field label="Açıklama" name="businessDescription" value={formData.businessDescription} onChange={handleChange} textarea />
              <Field label="Adres" name="address" value={formData.address} onChange={handleChange} textarea />
            </CardContent>
          </Card>
        )}

        {/* Sahip */}
        {activeTab === 'owner' && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Sahip Adı *" name="ownerName" value={formData.ownerName} onChange={handleChange} required />
                <Field label="E-posta *" name="ownerEmail" value={formData.ownerEmail} onChange={handleChange} required type="email" />
              </div>
              <Field label="Telefon" name="phone" value={formData.phone} onChange={handleChange} type="tel" />
            </CardContent>
          </Card>
        )}

        {/* Abonelik */}
        {activeTab === 'subscription' && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Abonelik Paketi</label>
                  <select name="subscriptionPlan" value={formData.subscriptionPlan} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500">
                    <option value="">Seçin</option>
                    {packages.map(pkg => (
                      <option key={pkg.slug} value={pkg.slug}>
                        {pkg.name} ({pkg.durationDays} gün) — {pkg.price === 0 ? 'Ücretsiz' : `₺${pkg.price}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500">
                    <option value="active">Aktif</option>
                    <option value="suspended">Askıda</option>
                    <option value="inactive">Pasif</option>
                  </select>
                </div>
              </div>

              {/* Subscription Info */}
              {formData.subscriptionStart && (
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <span className="text-gray-500">Başlangıç:</span>{' '}
                    <span className="font-medium">{new Date(formData.subscriptionStart).toLocaleDateString('tr-TR')}</span>
                  </div>
                  {formData.subscriptionEnd && (
                    <div>
                      <span className="text-gray-500">Bitiş:</span>{' '}
                      <span className="font-medium">{new Date(formData.subscriptionEnd).toLocaleDateString('tr-TR')}</span>
                    </div>
                  )}
                  {remainingDays !== null && (
                    <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      remainingDays <= 0 ? 'bg-red-100 text-red-700' : remainingDays <= 7 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {remainingDays <= 0 ? 'Süresi Doldu' : `${remainingDays} gün kaldı`}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Çalışma Saatleri */}
        {activeTab === 'hours' && (
          <Card>
            <CardContent className="p-5">
              <div className="space-y-2">
                {DAYS.map(day => {
                  const hours = (formData.workingHours as any)[day.key] || { start: '09:00', end: '18:00', closed: false };
                  return (
                    <div key={day.key} className="flex items-center gap-3 py-2">
                      <label className="flex items-center gap-2 w-28">
                        <input
                          type="checkbox"
                          checked={!hours.closed}
                          onChange={() => {
                            setFormData(prev => ({
                              ...prev,
                              workingHours: { ...prev.workingHours, [day.key]: { ...hours, closed: !hours.closed } }
                            }));
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className={`text-sm font-medium ${hours.closed ? 'text-gray-400' : 'text-gray-700'}`}>{day.label}</span>
                      </label>
                      {!hours.closed ? (
                        <div className="flex items-center gap-2">
                          <input type="time" value={hours.start} onChange={(e) => {
                            setFormData(prev => ({ ...prev, workingHours: { ...prev.workingHours, [day.key]: { ...hours, start: e.target.value } } }));
                          }} className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                          <span className="text-gray-400">—</span>
                          <input type="time" value={hours.end} onChange={(e) => {
                            setFormData(prev => ({ ...prev, workingHours: { ...prev.workingHours, [day.key]: { ...hours, end: e.target.value } } }));
                          }} className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Kapalı</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tema */}
        {activeTab === 'theme' && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ana Renk</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={formData.theme.primaryColor} onChange={(e) => setFormData(prev => ({ ...prev, theme: { ...prev.theme, primaryColor: e.target.value } }))} className="w-10 h-10 rounded border border-gray-200 cursor-pointer" />
                    <span className="text-sm text-gray-500 font-mono">{formData.theme.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İkincil Renk</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={formData.theme.secondaryColor} onChange={(e) => setFormData(prev => ({ ...prev, theme: { ...prev.theme, secondaryColor: e.target.value } }))} className="w-10 h-10 rounded border border-gray-200 cursor-pointer" />
                    <span className="text-sm text-gray-500 font-mono">{formData.theme.secondaryColor}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input type="text" value={formData.theme.logo} onChange={(e) => setFormData(prev => ({ ...prev, theme: { ...prev.theme, logo: e.target.value } }))} placeholder="https://..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                {formData.theme.logo && <img src={formData.theme.logo} alt="Logo" className="mt-2 h-16 object-contain rounded border border-gray-100" />}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Header Görsel URL</label>
                <input type="text" value={formData.theme.headerImage} onChange={(e) => setFormData(prev => ({ ...prev, theme: { ...prev.theme, headerImage: e.target.value } }))} placeholder="https://..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                {formData.theme.headerImage && <img src={formData.theme.headerImage} alt="Header" className="mt-2 h-24 w-full object-cover rounded border border-gray-100" />}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-5">
          <Link href="/project-admin/tenants">
            <Button type="button" variant="outline">İptal</Button>
          </Link>
          <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, required, type, hint, textarea }: {
  label: string; name: string; value: string; onChange: any;
  required?: boolean; type?: string; hint?: string; textarea?: boolean;
}) {
  const cls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {textarea ? (
        <textarea name={name} value={value} onChange={onChange} rows={2} className={cls} />
      ) : (
        <input type={type || 'text'} name={name} value={value} onChange={onChange} required={required} className={cls} />
      )}
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}
