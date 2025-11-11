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
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
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

          // Support both array and object formats
          if (Array.isArray(parsedFeatures)) {
            // Array format - use directly
            setFeatures(parsedFeatures);
          } else {
            // Object format - convert to descriptive strings
            const featureList: string[] = [];
            if (parsedFeatures.appointments) featureList.push(`Aylık randevu: ${parsedFeatures.appointments === -1 ? 'Sınırsız' : parsedFeatures.appointments}`);
            if (parsedFeatures.sms) featureList.push(`SMS: ${parsedFeatures.sms === -1 ? 'Sınırsız' : parsedFeatures.sms}`);
            if (parsedFeatures.staff) featureList.push(`Personel: ${parsedFeatures.staff === -1 ? 'Sınırsız' : parsedFeatures.staff}`);
            if (parsedFeatures.locations) featureList.push(`Lokasyon: ${parsedFeatures.locations === -1 ? 'Çoklu' : parsedFeatures.locations}`);
            if (parsedFeatures.reports) featureList.push('Detaylı raporlar');
            if (parsedFeatures.customDomain) featureList.push('Özel alan adı');
            if (parsedFeatures.apiAccess) featureList.push('API erişimi');
            if (parsedFeatures.support) featureList.push(`Destek: ${parsedFeatures.support}`);
            setFeatures(featureList);
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

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures(prev => [...prev, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await fetch(`/api/packages/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          features: features
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
                  <p className="text-sm text-gray-500">Paketin içerdiği özellikleri listeleyin</p>

                  {/* Add Feature Input */}
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Özellik ekleyin (örn: Sınırsız randevu)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleAddFeature}
                      className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ekle
                    </Button>
                  </div>

                  {/* Features List */}
                  {features.length > 0 && (
                    <ul className="space-y-2 border border-gray-200 rounded-lg p-4">
                      {features.map((feature, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm text-gray-700">• {feature}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveFeature(index)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {features.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500 text-sm">Henüz özellik eklenmedi</p>
                      <p className="text-gray-400 text-xs mt-1">Yukarıdaki alandan özellik ekleyebilirsiniz</p>
                    </div>
                  )}
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

