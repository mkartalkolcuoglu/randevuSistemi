"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ChevronLeft, Save, Palette, Clock, Building2, User, Key, Package } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionPackage {
  id: string;
  name: string;
  slug: string;
  durationDays: number;
  price: number;
  description: string | null;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  features: string | null;
}

export default function NewTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [headerPreview, setHeaderPreview] = useState<string>('');
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    businessName: '',
    slug: '',
    username: '',
    password: '',
    ownerName: '',
    ownerEmail: '',
    phone: '',
    address: '',
    businessType: 'salon', // Default
    businessDescription: '',
    subscriptionPlan: '', // Will be set after packages load
    workingHours: {
      monday: { start: '09:00', end: '18:00', closed: false },
      tuesday: { start: '09:00', end: '18:00', closed: false },
      wednesday: { start: '09:00', end: '18:00', closed: false },
      thursday: { start: '09:00', end: '18:00', closed: false },
      friday: { start: '09:00', end: '18:00', closed: false },
      saturday: { start: '09:00', end: '17:00', closed: false },
      sunday: { start: '10:00', end: '16:00', closed: true },
    },
    theme: {
      primaryColor: '#3B82F6', // Default blue
      secondaryColor: '#1E40AF', // Default dark blue
      logo: '',
      headerImage: '',
    },
  });

  // Fetch packages on mount
  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setPackagesLoading(true);
      const response = await fetch('/api/packages');
      
      if (response.ok) {
        const data = await response.json();
        const activePackages = data.data.filter((pkg: SubscriptionPackage) => pkg.isActive);
        setPackages(activePackages);
        
        // Set default selection to first package
        if (activePackages.length > 0) {
          setFormData(prev => ({ ...prev, subscriptionPlan: activePackages[0].slug }));
        }
      } else {
        console.error('Failed to fetch packages');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setPackagesLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        [name]: value,
      },
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

  const handleWorkingHoursChange = (day: string, field: 'start' | 'end' | 'closed', value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day as keyof typeof prev.workingHours],
          [field]: value,
        },
      },
    }));
  };

  // Auto-generate slug from business name
  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const businessName = e.target.value;
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
    
    setFormData((prev) => ({ 
      ...prev, 
      businessName,
      slug,
      username: slug // Auto-generate username from slug
    }));
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Calculate subscription dates based on selected package
      const now = new Date();
      const selectedPackage = packages.find(pkg => pkg.slug === formData.subscriptionPlan);
      
      if (!selectedPackage) {
        alert('Lütfen bir paket seçin!');
        setLoading(false);
        return;
      }
      
      // Calculate end date using package's durationDays
      const subscriptionEnd = new Date(now.getTime() + selectedPackage.durationDays * 24 * 60 * 60 * 1000);

      // Prepare tenant data with subscription info
      const tenantData = {
        ...formData,
        subscriptionStart: now.toISOString(),
        subscriptionEnd: subscriptionEnd.toISOString(),
      };

      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tenantData),
      });

      const result = await response.json();
      console.log('API Response:', response.status, result);

      if (response.ok && result.success) {
        alert('Abone başarıyla oluşturuldu!');
        // Landing sayfası artık otomatik dynamic route kullanıyor
        // Statik sayfa oluşturma devre dışı bırakıldı
        
        // Sync tenant data to admin panel database
        try {
          const syncResponse = await fetch('/api/tenants/sync-to-admin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(result.data),
          });
          
          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            console.log('Tenant synced to admin panel successfully:', syncResult);
            alert('Abone oluşturuldu ve admin panele senkronize edildi!');
          } else {
            const errorResult = await syncResponse.json();
            console.warn('Failed to sync tenant to admin panel:', errorResult);
            alert('Abone oluşturuldu ancak admin panele senkronize edilemedi. Manuel senkronizasyon gerekebilir.');
          }
        } catch (syncError) {
          console.warn('Failed to sync tenant to admin panel:', syncError);
          alert('Abone oluşturuldu ancak admin panele senkronize edilemedi. Manuel senkronizasyon gerekebilir.');
          // Don't block the main flow if sync fails
        }
        
        router.push('/project-admin/tenants');
      } else {
        const errorMessage = result.error || result.message || `HTTP ${response.status}: Bilinmeyen hata`;
        console.error('API Error:', errorMessage, result);
        alert('Abone oluşturulurken hata oluştu: ' + errorMessage);
      }
    } catch (error: any) {
      console.error('Error creating tenant:', error);
      alert('Bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/project-admin/tenants">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Geri Dön
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Yeni Abone Oluştur</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Building2 className="w-5 h-5 mr-2" /> İşletme Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="businessName">İşletme Adı</Label>
                <Input 
                  id="businessName" 
                  name="businessName" 
                  value={formData.businessName} 
                  onChange={handleBusinessNameChange} 
                  required 
                  className="bg-white" 
                />
              </div>
              <div>
                <Label htmlFor="slug">URL Slug (otomatik oluşturulur)</Label>
                <Input 
                  id="slug" 
                  name="slug" 
                  value={formData.slug} 
                  onChange={handleInputChange} 
                  required 
                  className="bg-white" 
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="businessType">İşletme Türü</Label>
                <select
                  id="businessType"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="salon">Güzellik Salonu</option>
                  <option value="berber">Berber</option>
                  <option value="klinik">Klinik</option>
                  <option value="spa">SPA Merkezi</option>
                  <option value="fitness">Fitness Salonu</option>
                  <option value="other">Diğer</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="businessDescription">İşletme Açıklaması</Label>
                <Textarea id="businessDescription" name="businessDescription" value={formData.businessDescription} onChange={handleInputChange} rows={3} className="bg-white" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Adres</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleInputChange} className="bg-white" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><User className="w-5 h-5 mr-2" /> Yönetici Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="ownerName">Adı Soyadı</Label>
                <Input id="ownerName" name="ownerName" value={formData.ownerName} onChange={handleInputChange} required className="bg-white" />
              </div>
              <div>
                <Label htmlFor="ownerEmail">E-posta</Label>
                <Input id="ownerEmail" name="ownerEmail" type="email" value={formData.ownerEmail} onChange={handleInputChange} required className="bg-white" />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="bg-white" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Key className="w-5 h-5 mr-2" /> Giriş Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="username">Kullanıcı Adı</Label>
                <Input id="username" name="username" value={formData.username} onChange={handleInputChange} required className="bg-white" />
                <p className="text-sm text-gray-500 mt-1">İşletme adından otomatik oluşturulur</p>
              </div>
              <div>
                <Label htmlFor="password">Şifre</Label>
                <div className="flex space-x-2">
                  <Input id="password" name="password" value={formData.password} onChange={handleInputChange} required className="bg-white flex-1" />
                  <Button type="button" onClick={generateRandomPassword} variant="outline" size="sm">
                    Oluştur
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">Abone bu bilgilerle admin paneline giriş yapacak</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Package className="w-5 h-5 mr-2" /> Paket Seçimi</CardTitle>
            </CardHeader>
            <CardContent>
              {packagesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Paketler yükleniyor...</p>
                </div>
              ) : packages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Aktif paket bulunamadı. Lütfen önce paket oluşturun.</p>
                  <Link href="/project-admin/packages/new" className="text-blue-600 hover:underline mt-2 inline-block">
                    Yeni Paket Oluştur →
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {packages.map((pkg) => {
                      const isSelected = formData.subscriptionPlan === pkg.slug;
                      const features = pkg.features ? JSON.parse(pkg.features) : [];
                      
                      return (
                        <div 
                          key={pkg.id}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all relative ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50' 
                              : 'border-gray-300 hover:border-blue-400'
                          }`}
                          onClick={() => setFormData((prev) => ({ ...prev, subscriptionPlan: pkg.slug }))}
                        >
                          {pkg.isFeatured && (
                            <div className="absolute -top-3 right-3 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                              ÖNE ÇIKAN
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                            {isSelected && (
                              <span className="text-blue-600 font-bold">✓</span>
                            )}
                          </div>
                          <div className="mb-3">
                            <p className="text-3xl font-bold text-gray-900">
                              {pkg.price === 0 ? 'Ücretsiz' : `₺${pkg.price.toFixed(0)}`}
                            </p>
                            <p className="text-sm text-gray-600">{pkg.durationDays} Gün</p>
                          </div>
                          {pkg.description && (
                            <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                          )}
                          <ul className="space-y-2 text-sm text-gray-600">
                            {features.map((feature: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <span className="mr-2">✓</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Not:</strong> Paket süresi dolduğunda tenant otomatik olarak pasif hale gelecektir.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Clock className="w-5 h-5 mr-2" /> Çalışma Saatleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(formData.workingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center space-x-4">
                  <Label className="w-24 capitalize">{hours.closed ? `${day} (Kapalı)` : day}</Label>
                  <input
                    type="checkbox"
                    checked={hours.closed}
                    onChange={(e) => handleWorkingHoursChange(day, 'closed', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  {!hours.closed && (
                    <>
                      <Input
                        type="time"
                        value={hours.start}
                        onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                        className="w-32 bg-white"
                      />
                      <span>-</span>
                      <Input
                        type="time"
                        value={hours.end}
                        onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                        className="w-32 bg-white"
                      />
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Palette className="w-5 h-5 mr-2" /> Tema Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="primaryColor">Ana Renk</Label>
                <Input id="primaryColor" name="primaryColor" type="color" value={formData.theme.primaryColor} onChange={handleThemeChange} className="w-full h-10 p-1 border border-gray-300 rounded-md bg-white" />
              </div>
              <div>
                <Label htmlFor="secondaryColor">İkincil Renk</Label>
                <Input id="secondaryColor" name="secondaryColor" type="color" value={formData.theme.secondaryColor} onChange={handleThemeChange} className="w-full h-10 p-1 border border-gray-300 rounded-md bg-white" />
              </div>
              <div>
                <Label htmlFor="logo">Logo (Max 3MB)</Label>
                <input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'logo')}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer bg-white border border-gray-300 rounded-md"
                />
                {logoPreview && (
                  <div className="mt-2">
                    <img src={logoPreview} alt="Logo preview" className="h-20 w-20 object-contain border border-gray-200 rounded" />
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF formatları destekleniyor</p>
              </div>
              <div>
                <Label htmlFor="headerImage">Header Görseli (Max 3MB)</Label>
                <input
                  id="headerImage"
                  name="headerImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'headerImage')}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer bg-white border border-gray-300 rounded-md"
                />
                {headerPreview && (
                  <div className="mt-2">
                    <img src={headerPreview} alt="Header preview" className="h-32 w-full object-cover border border-gray-200 rounded" />
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF formatları destekleniyor</p>
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Abone Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Landing Page URL:</strong><br />
                <code>http://localhost:3000/{formData.slug || '[slug]'}</code>
              </div>
              <div>
                <strong>Admin Panel Giriş:</strong><br />
                <code>http://localhost:3001/login</code><br />
                Kullanıcı: <code>{formData.username || '[username]'}</code><br />
                Şifre: <code>{formData.password || '[password]'}</code>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg px-6 py-3 rounded-lg shadow-md transition-all duration-300">
            {loading ? 'Oluşturuluyor...' : <><Save className="w-5 h-5 mr-2" /> Abone Oluştur</>}
          </Button>
        </form>
      </div>
    </div>
  );
}