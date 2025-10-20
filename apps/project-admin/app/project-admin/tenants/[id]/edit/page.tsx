"use client";

import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ArrowLeft, Building2, Save, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface EditTenantPageProps {
  params: Promise<{ id: string }>;
}

export default function EditTenantPage({ params }: EditTenantPageProps) {
  const router = useRouter();
  const [tenantId, setTenantId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [headerPreview, setHeaderPreview] = useState<string>('');
  const [formData, setFormData] = useState({
    businessName: '',
    slug: '',
    username: '',
    password: '',
    ownerName: '',
    ownerEmail: '',
    phone: '',
    plan: 'Standard',
    status: 'active',
    address: '',
    businessType: 'salon',
    businessDescription: '',
    workingHours: {
      monday: { start: '09:00', end: '18:00', closed: false },
      tuesday: { start: '09:00', end: '18:00', closed: false },
      wednesday: { start: '09:00', end: '18:00', closed: false },
      thursday: { start: '09:00', end: '18:00', closed: false },
      friday: { start: '09:00', end: '18:00', closed: false },
      saturday: { start: '09:00', end: '17:00', closed: false },
      sunday: { start: '10:00', end: '16:00', closed: true }
    },
    theme: {
      primaryColor: '#EC4899',
      secondaryColor: '#f3f4f6',
      logo: '',
      headerImage: ''
    }
  });

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setTenantId(resolvedParams.id);
      fetchTenant(resolvedParams.id);
    }
    loadParams();
  }, [params]);

  const fetchTenant = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tenants/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setFormData({
          businessName: data.data.businessName || '',
          slug: data.data.slug || '',
          username: data.data.username || '',
          password: data.data.password || '',
          ownerName: data.data.ownerName || '',
          ownerEmail: data.data.ownerEmail || '',
          phone: data.data.phone || '',
          plan: data.data.plan || 'Standard',
          status: data.data.status || 'active',
          address: data.data.address || '',
          businessType: data.data.businessType || 'salon',
          businessDescription: data.data.businessDescription || '',
          workingHours: (() => {
            try {
              // If workingHours is a string, parse it
              if (typeof data.data.workingHours === 'string') {
                return JSON.parse(data.data.workingHours);
              }
              // If workingHours is already an object, use it
              if (data.data.workingHours && typeof data.data.workingHours === 'object') {
                return data.data.workingHours;
              }
              // Default working hours
              return {
                monday: { start: '09:00', end: '18:00', closed: false },
                tuesday: { start: '09:00', end: '18:00', closed: false },
                wednesday: { start: '09:00', end: '18:00', closed: false },
                thursday: { start: '09:00', end: '18:00', closed: false },
                friday: { start: '09:00', end: '18:00', closed: false },
                saturday: { start: '09:00', end: '17:00', closed: false },
                sunday: { start: '10:00', end: '16:00', closed: true }
              };
            } catch (error) {
              console.error('Error parsing workingHours:', error);
              return {
                monday: { start: '09:00', end: '18:00', closed: false },
                tuesday: { start: '09:00', end: '18:00', closed: false },
                wednesday: { start: '09:00', end: '18:00', closed: false },
                thursday: { start: '09:00', end: '18:00', closed: false },
                friday: { start: '09:00', end: '18:00', closed: false },
                saturday: { start: '09:00', end: '17:00', closed: false },
                sunday: { start: '10:00', end: '16:00', closed: true }
              };
            }
          })(),
          theme: (() => {
            try {
              // If theme is a string, parse it
              if (typeof data.data.theme === 'string') {
                return JSON.parse(data.data.theme);
              }
              // If theme is already an object, use it
              if (data.data.theme && typeof data.data.theme === 'object') {
                return data.data.theme;
              }
              // Default theme
              return {
                primaryColor: '#EC4899',
                secondaryColor: '#f3f4f6',
                logo: '',
                headerImage: ''
              };
            } catch (error) {
              console.error('Error parsing theme:', error);
              return {
                primaryColor: '#EC4899',
                secondaryColor: '#f3f4f6',
                logo: '',
                headerImage: ''
              };
            }
          })()
        });
        
        // Set existing image previews
        const theme = data.data.theme;
        let parsedTheme;
        try {
          parsedTheme = typeof theme === 'string' ? JSON.parse(theme) : theme;
        } catch {
          parsedTheme = {};
        }
        
        if (parsedTheme?.logo) {
          setLogoPreview(parsedTheme.logo);
        }
        if (parsedTheme?.headerImage) {
          setHeaderPreview(parsedTheme.headerImage);
        }
      } else {
        alert('Abone bulunamadı');
        router.push('/project-admin/tenants');
      }
    } catch (error) {
      console.error('Error fetching tenant:', error);
      alert('Abone bilgileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image file upload and convert to base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'headerImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 3MB)
    const maxSize = 3 * 1024 * 1024; // 3MB in bytes
    if (file.size > maxSize) {
      alert('Dosya boyutu 3MB\'dan küçük olmalıdır.');
      e.target.value = ''; // Clear input
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Lütfen bir resim dosyası seçin.');
      e.target.value = '';
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      
      // Update form data
      setFormData((prev) => ({
        ...prev,
        theme: {
          ...prev.theme,
          [type]: base64String,
        },
      }));

      // Update preview
      if (type === 'logo') {
        setLogoPreview(base64String);
      } else {
        setHeaderPreview(base64String);
      }
    };

    reader.onerror = () => {
      alert('Dosya yüklenirken bir hata oluştu.');
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Regenerate landing page with updated data
        await regenerateLandingPage();
        router.push('/project-admin/tenants');
      } else {
        alert('Abone güncellenirken hata oluştu: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating tenant:', error);
      alert('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const regenerateLandingPage = async () => {
    try {
      await fetch('/api/tenants/generate-landing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      });
    } catch (error) {
      console.error('Error regenerating landing page:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu aboneyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('Abone başarıyla silindi');
        router.push('/project-admin/tenants');
      } else {
        alert('Abone silinirken hata oluştu: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting tenant:', error);
      alert('Bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Abone bilgileri yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/project-admin/tenants">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri Dön
              </Button>
            </Link>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Abone Düzenle</h1>
              <p className="text-gray-600">Abone bilgilerini güncelleyin ve landing sayfası otomatik olarak yenilensin</p>
            </div>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                  Siliniyor...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Aboneyi Sil
                </>
              )}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                İşletme Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İşletme Adı *
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Landing sayfası URL'i: {formData.slug}.randevu.com
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kullanıcı Adı *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Abone bu kullanıcı adı ile admin paneline giriş yapar
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şifre *
                  </label>
                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Abone şifresi (düz metin olarak görünür)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İşletme Türü
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="salon">Güzellik Salonu</option>
                  <option value="barber">Berber</option>
                  <option value="clinic">Klinik/Doktor</option>
                  <option value="spa">SPA & Wellness</option>
                  <option value="fitness">Fitness & Spor</option>
                  <option value="other">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İşletme Açıklaması
                </label>
                <textarea
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adres
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Owner Information */}
          <Card>
            <CardHeader>
              <CardTitle>Sahip Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sahip Adı *
                  </label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta *
                  </label>
                  <input
                    type="email"
                    name="ownerEmail"
                    value={formData.ownerEmail}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Plan & Status */}
          <Card>
            <CardHeader>
              <CardTitle>Plan ve Durum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan
                  </label>
                  <select
                    name="plan"
                    value={formData.plan}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Trial">Trial (30 gün)</option>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durum
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Aktif</option>
                    <option value="suspended">Askıda</option>
                    <option value="inactive">Pasif</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Tema Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ana Renk
                  </label>
                  <input
                    type="color"
                    name="primaryColor"
                    value={formData.theme?.primaryColor || '#EC4899'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      theme: { ...prev.theme, primaryColor: e.target.value }
                    }))}
                    className="w-full h-10 border border-gray-300 rounded-md bg-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İkincil Renk
                  </label>
                  <input
                    type="color"
                    name="secondaryColor"
                    value={formData.theme?.secondaryColor || '#f3f4f6'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      theme: { ...prev.theme, secondaryColor: e.target.value }
                    }))}
                    className="w-full h-10 border border-gray-300 rounded-md bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo (Max 3MB)
                </label>
                <input
                  type="file"
                  name="logo"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'logo')}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer bg-white border border-gray-300 rounded-md"
                />
                {logoPreview && (
                  <div className="mt-2 space-y-2">
                    <img src={logoPreview} alt="Logo preview" className="h-20 w-20 object-contain border border-gray-200 rounded" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLogoPreview('');
                        setFormData((prev) => ({
                          ...prev,
                          theme: {
                            ...prev.theme,
                            logo: ''
                          }
                        }));
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                    >
                      Logoyu Kaldır
                    </Button>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF formatları destekleniyor</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Header Görseli (Max 3MB)
                </label>
                <input
                  type="file"
                  name="headerImage"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'headerImage')}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer bg-white border border-gray-300 rounded-md"
                />
                {headerPreview && (
                  <div className="mt-2 space-y-2">
                    <img src={headerPreview} alt="Header preview" className="h-32 w-full object-cover border border-gray-200 rounded" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setHeaderPreview('');
                        setFormData((prev) => ({
                          ...prev,
                          theme: {
                            ...prev.theme,
                            headerImage: ''
                          }
                        }));
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                    >
                      Header Görselini Kaldır
                    </Button>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF formatları destekleniyor</p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link href="/project-admin/tenants">
              <Button type="button" variant="outline">
                İptal
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Güncelleniyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Değişiklikleri Kaydet
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
