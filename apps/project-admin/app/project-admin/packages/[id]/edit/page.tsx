"use client";

import { useState, useEffect, use } from 'react';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Textarea } from '../../../../../components/ui/textarea';
import { Switch } from '../../../../../components/ui/switch';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    durationDays: '',
    price: '',
    description: '',
    isActive: true,
    isFeatured: false
  });
  const [features, setFeatures] = useState({
    appointments: '',
    sms: '',
    staff: '',
    locations: '',
    services: '',
    clients: '',
    reports: false,
    customDomain: false,
    apiAccess: false,
    support: 'email'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPackage();
  }, []);

  const fetchPackage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/packages/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        const pkg = data.data;
        
        setFormData({
          name: pkg.name,
          slug: pkg.slug,
          durationDays: pkg.durationDays.toString(),
          price: pkg.price.toString(),
          description: pkg.description || '',
          isActive: pkg.isActive,
          isFeatured: pkg.isFeatured
        });

        if (pkg.features) {
          const parsedFeatures = typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features;
          
          // Convert to the correct format
          if (Array.isArray(parsedFeatures)) {
            // Old format - set to defaults
            console.warn('Old array format detected, using defaults');
          } else {
            // New format - merge with defaults
            setFeatures({
              appointments: parsedFeatures.appointments?.toString() || '',
              sms: parsedFeatures.sms?.toString() || '',
              staff: parsedFeatures.staff?.toString() || '',
              locations: parsedFeatures.locations?.toString() || '',
              services: parsedFeatures.services?.toString() || '',
              clients: parsedFeatures.clients?.toString() || '',
              reports: parsedFeatures.reports || false,
              customDomain: parsedFeatures.customDomain || false,
              apiAccess: parsedFeatures.apiAccess || false,
              support: parsedFeatures.support || 'email'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching package:', error);
      setError('Paket yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFeatureChange = (field: string, value: any) => {
    setFeatures(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Convert string inputs to numbers where appropriate
      const processedFeatures = {
        appointments: features.appointments === '-1' || features.appointments === 'unlimited' ? -1 : parseInt(features.appointments) || 0,
        sms: features.sms === '-1' || features.sms === 'unlimited' ? -1 : parseInt(features.sms) || 0,
        staff: features.staff === '-1' || features.staff === 'unlimited' ? -1 : parseInt(features.staff) || 1,
        locations: features.locations === '-1' || features.locations === 'unlimited' ? -1 : parseInt(features.locations) || 1,
        services: features.services ? (features.services === '-1' || features.services === 'unlimited' ? -1 : parseInt(features.services)) : undefined,
        clients: features.clients ? (features.clients === '-1' || features.clients === 'unlimited' ? -1 : parseInt(features.clients)) : undefined,
        reports: features.reports,
        customDomain: features.customDomain,
        apiAccess: features.apiAccess,
        support: features.support || 'email'
      };

      const response = await fetch(`/api/packages/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          features: processedFeatures
        })
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/project-admin/packages');
      } else {
        setError(data.error || 'Paket güncellenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error updating package:', error);
      setError('Paket güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Paket yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link href="/project-admin/packages">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri Dön
              </Button>
            </Link>

            <h1 className="text-3xl font-bold text-gray-900">Paket Düzenle</h1>
            <p className="text-gray-600 mt-2">Abonelik paketi bilgilerini güncelleyin</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Paket Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name */}
                <div>
                  <Label htmlFor="name">Paket Adı *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="örn: Aylık Premium"
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <Label htmlFor="slug">Slug (Benzersiz Tanımlayıcı) *</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="örn: monthly-premium"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">URL'de ve sistem içinde kullanılacak</p>
                </div>

                {/* Duration and Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="durationDays">Süre (Gün) *</Label>
                    <Input
                      id="durationDays"
                      name="durationDays"
                      type="number"
                      value={formData.durationDays}
                      onChange={handleInputChange}
                      placeholder="örn: 30"
                      required
                      min="1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Fiyat (₺)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="örn: 299"
                    />
                    <p className="text-sm text-gray-500 mt-1">0 = Ücretsiz</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Paket hakkında kısa açıklama"
                    rows={3}
                  />
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Paket Özellikleri</Label>
                  
                  {/* Numeric Features */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="appointments">Aylık Randevu Limiti</Label>
                      <Input
                        id="appointments"
                        type="number"
                        value={features.appointments}
                        onChange={(e) => handleFeatureChange('appointments', e.target.value)}
                        placeholder="-1 = Sınırsız, 0 = Yok"
                      />
                      <p className="text-xs text-gray-500 mt-1">-1 = Sınırsız</p>
                    </div>

                    <div>
                      <Label htmlFor="sms">SMS/WhatsApp Limiti</Label>
                      <Input
                        id="sms"
                        type="number"
                        value={features.sms}
                        onChange={(e) => handleFeatureChange('sms', e.target.value)}
                        placeholder="-1 = Sınırsız, 0 = Yok"
                      />
                      <p className="text-xs text-gray-500 mt-1">-1 = Sınırsız</p>
                    </div>

                    <div>
                      <Label htmlFor="staff">Personel Sayısı</Label>
                      <Input
                        id="staff"
                        type="number"
                        value={features.staff}
                        onChange={(e) => handleFeatureChange('staff', e.target.value)}
                        placeholder="-1 = Sınırsız"
                      />
                      <p className="text-xs text-gray-500 mt-1">-1 = Sınırsız</p>
                    </div>

                    <div>
                      <Label htmlFor="locations">Lokasyon Sayısı</Label>
                      <Input
                        id="locations"
                        type="number"
                        value={features.locations}
                        onChange={(e) => handleFeatureChange('locations', e.target.value)}
                        placeholder="-1 = Çoklu"
                      />
                      <p className="text-xs text-gray-500 mt-1">-1 = Çoklu lokasyon</p>
                    </div>

                    <div>
                      <Label htmlFor="services">Hizmet Sayısı (Opsiyonel)</Label>
                      <Input
                        id="services"
                        type="number"
                        value={features.services}
                        onChange={(e) => handleFeatureChange('services', e.target.value)}
                        placeholder="-1 = Sınırsız"
                      />
                    </div>

                    <div>
                      <Label htmlFor="clients">Müşteri Sayısı (Opsiyonel)</Label>
                      <Input
                        id="clients"
                        type="number"
                        value={features.clients}
                        onChange={(e) => handleFeatureChange('clients', e.target.value)}
                        placeholder="-1 = Sınırsız"
                      />
                    </div>
                  </div>

                  {/* Boolean Features */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Detaylı Raporlar</Label>
                        <p className="text-sm text-gray-500">Gelişmiş raporlama özellikleri</p>
                      </div>
                      <Switch
                        checked={features.reports}
                        onCheckedChange={(checked) => handleFeatureChange('reports', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Özel Alan Adı</Label>
                        <p className="text-sm text-gray-500">Kendi domain adresini kullanabilme</p>
                      </div>
                      <Switch
                        checked={features.customDomain}
                        onCheckedChange={(checked) => handleFeatureChange('customDomain', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>API Erişimi</Label>
                        <p className="text-sm text-gray-500">REST API ile entegrasyon</p>
                      </div>
                      <Switch
                        checked={features.apiAccess}
                        onCheckedChange={(checked) => handleFeatureChange('apiAccess', checked)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="support">Destek Seviyesi</Label>
                      <select
                        id="support"
                        value={features.support}
                        onChange={(e) => handleFeatureChange('support', e.target.value)}
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="email">E-posta Destek</option>
                        <option value="standard">Standart Destek</option>
                        <option value="priority">Öncelikli Destek</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Switches */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Aktif</Label>
                      <p className="text-sm text-gray-500">Paket kullanıcılara gösterilsin mi?</p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Öne Çıkan Paket</Label>
                      <p className="text-sm text-gray-500">Özel badge ile gösterilsin mi?</p>
                    </div>
                    <Switch
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-6 border-t">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? (
                      <>Kaydediliyor...</>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Değişiklikleri Kaydet
                      </>
                    )}
                  </Button>
                  <Link href="/project-admin/packages">
                    <Button type="button" variant="outline">
                      İptal
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
    </main>
  );
}

