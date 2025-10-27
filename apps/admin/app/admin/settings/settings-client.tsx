"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui';
import { Save, Palette, Building2, User, Key, Clock, Upload, ArrowLeft, MapPin, Settings } from 'lucide-react';
import AdminHeader from '../admin-header';
import type { ClientUser } from '../../../lib/client-permissions';

interface SettingsClientProps {
  user: ClientUser;
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [headerPreview, setHeaderPreview] = useState<string>('');
  const [settings, setSettings] = useState({
    // Tema ayarları
    themeSettings: {
      primaryColor: '#EC4899',
      secondaryColor: '#BE185D',
      logo: '',
      headerImage: ''
    },
    // İşletme bilgileri
    businessName: '',
    businessType: 'salon',
    businessDescription: '',
    businessAddress: '',
    // Yönetici bilgileri
    ownerName: '',
    ownerEmail: '',
    phone: '',
    // Giriş bilgileri
    username: '',
    password: '',
    // Çalışma saatleri
    workingHours: {
      monday: { start: '09:00', end: '18:00', closed: false },
      tuesday: { start: '09:00', end: '18:00', closed: false },
      wednesday: { start: '09:00', end: '18:00', closed: false },
      thursday: { start: '09:00', end: '18:00', closed: false },
      friday: { start: '09:00', end: '18:00', closed: false },
      saturday: { start: '09:00', end: '17:00', closed: false },
      sunday: { start: '10:00', end: '16:00', closed: true }
    },
    // Randevu ayarları
    appointmentTimeInterval: 30, // dakika cinsinden
    // Konum ayarları
    location: {
      latitude: '',
      longitude: '',
      address: ''
    }
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Önce mevcut tenant info'yu al (slug için)
      const currentTenantResponse = await fetch('/api/tenant-info?t=' + Date.now());
      const currentTenantData = await currentTenantResponse.json();
      
      let tenantResponse, tenantData;
      
      if (currentTenantData.success && currentTenantData.data?.slug) {
        // Slug varsa, web API'sini kullan (doğru data için)
        const slug = currentTenantData.data.slug;
        console.log('Using slug:', slug);
        tenantResponse = await fetch(`https://randevu-sistemi-web.vercel.app/api/tenant-settings/${slug}?t=` + Date.now());
        tenantData = await tenantResponse.json();
      } else {
        // Fallback: admin API kullan
        console.log('Fallback to admin API');
        tenantResponse = currentTenantResponse;
        tenantData = currentTenantData;
      }
      
      console.log('Load Settings Response:', tenantData);
      
      // Debug: Web API'nin hangi field'ları döndürdüğünü kontrol et
      if (tenantData.success && tenantData.data) {
        console.log('🔍 Available fields in response:');
        console.log('- Root level:', Object.keys(tenantData.data));
        if (tenantData.data.tenant) {
          console.log('- Tenant level:', Object.keys(tenantData.data.tenant));
        }
        
        // Eksik field'ları kontrol et
        const checkFields = ['ownerName', 'username', 'password'];
        checkFields.forEach(field => {
          const rootValue = tenantData.data[field];
          const tenantValue = tenantData.data.tenant?.[field];
          console.log(`- ${field}: root=${rootValue}, tenant=${tenantValue}`);
        });
      }
      
      if (tenantResponse.ok) {
        if (tenantData.success && tenantData.data) {
          const tenant = tenantData.data;
          
          // Debug: Check tenant.theme size
          if (tenant.theme) {
            const themeSize = JSON.stringify(tenant.theme).length;
            console.log(`🔍 Database theme size: ${(themeSize / 1024).toFixed(2)} KB`);
            
            if (themeSize > 100000) { // 100KB
              console.warn('⚠️ Theme data from database is HUGE!');
              console.log('Theme keys:', Object.keys(tenant.theme));
              
              // Log each theme field size
              Object.keys(tenant.theme).forEach(key => {
                const fieldSize = JSON.stringify(tenant.theme[key]).length;
                if (fieldSize > 1000) {
                  console.log(`  ${key}: ${(fieldSize / 1024).toFixed(2)} KB`);
                  
                  // Show preview of large strings
                  if (typeof tenant.theme[key] === 'string' && fieldSize > 10000) {
                    console.log(`    Preview: "${tenant.theme[key].substring(0, 100)}..."`);
                  }
                }
              });
            }
          }
          
          // Web API'den gelen data farklı structure'da olabilir
          const isWebApiData = tenant.tenant && typeof tenant.tenant === 'object';
          const businessData = isWebApiData ? tenant.tenant : tenant;
          
          console.log('Data structure detected:', isWebApiData ? 'Web API' : 'Admin API');
          console.log('Business data:', businessData);
          
          // Eğer web API'den kritik field'lar eksikse, admin API'den tamamla
          let finalData = { ...tenant };
          
          if (isWebApiData) {
            const missingFields = ['ownerName', 'username'];
            const hasMissingFields = missingFields.some(field => 
              !businessData[field] && !tenant[field]
            );
            
            if (hasMissingFields) {
              console.log('🔄 Missing critical fields, fetching from admin API...');
              try {
                // Admin API'den eksik field'ları al
                const adminResponse = await fetch('/api/tenant-info?admin-fields=true&t=' + Date.now());
                const adminData = await adminResponse.json();
                
                if (adminData.success && adminData.data) {
                  console.log('✅ Got admin data for missing fields');
                  finalData = {
                    ...tenant,
                    // Admin API'den eksik field'ları ekle
                    ownerName: adminData.data.ownerName || tenant.ownerName || '',
                    username: adminData.data.username || tenant.username || '',
                    // Diğer field'lar web API'den gelsin
                  };
                }
              } catch (error) {
                console.warn('⚠️ Could not fetch admin data:', error);
              }
            }
          }
          
          // Extract theme data first (needed for both setSettings and image previews)
          let themeData = tenant.themeSettings || tenant.theme || {};
          
          // Parse theme if it's a string
          if (typeof themeData === 'string') {
            try {
              themeData = JSON.parse(themeData);
            } catch (error) {
              console.error('Error parsing theme:', error);
              themeData = {};
            }
          }
          
          // Parse workingHours if it's a string
          let workingHoursData = tenant.workingHours;
          if (typeof workingHoursData === 'string') {
            try {
              workingHoursData = JSON.parse(workingHoursData);
            } catch (error) {
              console.error('Error parsing workingHours:', error);
              workingHoursData = null;
            }
          }
          
          // Extract location from theme (if it exists there)
          const locationData = themeData.location || tenant.location || {};
          
          setSettings(prev => ({
            ...prev,
            // Business info mapping
            businessName: businessData.businessName || finalData.businessName || '',
            businessType: businessData.businessType || finalData.businessType || 'salon',
            businessDescription: businessData.businessDescription || finalData.businessDescription || '',
            businessAddress: businessData.businessAddress || businessData.address || finalData.address || '',
            
            // Owner info mapping - admin API'den tamamlanmış data kullan
            ownerName: finalData.ownerName || businessData.ownerName || '',
            ownerEmail: businessData.businessEmail || businessData.ownerEmail || finalData.ownerEmail || '',
            phone: businessData.businessPhone || businessData.phone || finalData.phone || '',
            
            // Login info mapping - admin API'den tamamlanmış data kullan
            username: finalData.username || businessData.username || '',
            password: '', // Güvenlik için şifreyi boş göster
            
            // Other data
            workingHours: workingHoursData || prev.workingHours,
            appointmentTimeInterval: tenant.appointmentTimeInterval || 30, // Default: 30 dakika
            themeSettings: themeData,
            location: locationData
          }));
          
          // Set existing image previews
          console.log('🖼️ Setting image previews...');
          console.log('🖼️ themeData.logo exists:', !!themeData?.logo);
          console.log('🖼️ themeData.headerImage exists:', !!themeData?.headerImage);
          
          if (themeData?.logo) {
            console.log('🖼️ Setting logo preview (size:', themeData.logo.length, 'chars)');
            setLogoPreview(themeData.logo);
          }
          if (themeData?.headerImage) {
            console.log('🖼️ Setting header preview (size:', themeData.headerImage.length, 'chars)');
            setHeaderPreview(themeData.headerImage);
          }
        } else {
          throw new Error(tenantData.error || 'Tenant bilgisi alınamadı');
        }
      } else {
        throw new Error(`HTTP ${tenantResponse.status}: ${tenantData.error || 'Sunucu hatası'}`);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      alert('Ayarlar yüklenemedi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Image compression function
  const compressImage = (base64String: string, maxSizeKB = 500): Promise<string> => {
    return new Promise((resolve) => {
      if (!base64String || !base64String.startsWith('data:image/')) {
        resolve(base64String);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Calculate new dimensions (max 800px width/height)
        const maxDimension = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels
        let quality = 0.8;
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Reduce quality until under size limit
        while (compressedDataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1;
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(compressedDataUrl);
      };
      
      img.src = base64String;
    });
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Debug: Log what we're sending
      console.log('Settings keys:', Object.keys(settings));
      console.log('ThemeSettings keys:', settings.themeSettings ? Object.keys(settings.themeSettings) : 'none');
      
      // Check for circular references
      try {
        JSON.stringify(settings);
        console.log('No circular reference detected');
      } catch (error) {
        console.error('Circular reference detected!', error);
        return;
      }
      
      // Log individual field sizes
      Object.keys(settings).forEach(key => {
        try {
          const size = JSON.stringify(settings[key]).length;
          console.log(`${key}: ${(size / 1024).toFixed(2)} KB`);
          
          if (key === 'themeSettings' && settings[key]) {
            Object.keys(settings[key]).forEach(themeKey => {
              const themeSize = JSON.stringify(settings[key][themeKey]).length;
              if (themeSize > 1000) {
                console.log(`  └─ ${themeKey}: ${(themeSize / 1024).toFixed(2)} KB`);
                
                // If it's a string, show first 100 chars
                if (typeof settings[key][themeKey] === 'string' && themeSize > 10000) {
                  console.log(`     Preview: ${settings[key][themeKey].substring(0, 100)}...`);
                }
              }
            });
          }
        } catch (err) {
          console.error(`Error checking ${key}:`, err);
        }
      });
      
      // Check if images are URLs or base64
      const logoIsUrl = settings.themeSettings?.logo && 
        (settings.themeSettings.logo.startsWith('http') || settings.themeSettings.logo.startsWith('https'));
      const headerIsUrl = settings.themeSettings?.headerImage && 
        (settings.themeSettings.headerImage.startsWith('http') || settings.themeSettings.headerImage.startsWith('https'));
      
      console.log('Logo is URL:', logoIsUrl);
      console.log('Header is URL:', headerIsUrl);
      
      // Debug: Check current theme settings
      console.log('🎨 Current themeSettings:', settings.themeSettings);
      console.log('🎨 Primary Color:', settings.themeSettings?.primaryColor);
      console.log('🎨 Secondary Color:', settings.themeSettings?.secondaryColor);
      
      // Clean theme settings - only keep essential fields
      let cleanLogo = settings.themeSettings?.logo || '';
      let cleanHeaderImage = settings.themeSettings?.headerImage || '';
      
      const cleanThemeSettings = {
        primaryColor: settings.themeSettings?.primaryColor || '#EC4899',
        secondaryColor: settings.themeSettings?.secondaryColor || '#BE185D',
        logo: cleanLogo,
        headerImage: cleanHeaderImage
      };
      
      console.log('🎨 Clean Theme Settings:', cleanThemeSettings);
      console.log('Original themeSettings size:', JSON.stringify(settings.themeSettings).length);
      console.log('Cleaned themeSettings size:', JSON.stringify(cleanThemeSettings).length);
      
      const compressedSettings = { 
        ...settings,
        themeSettings: cleanThemeSettings
      };
      
      // Compress base64 images to reduce size
      if (cleanThemeSettings.logo && !logoIsUrl) {
        console.log('Compressing logo (base64)...');
        // More aggressive compression for logo (300KB target)
        compressedSettings.themeSettings.logo = await compressImage(cleanThemeSettings.logo, 300);
      }
      
      if (cleanThemeSettings.headerImage && !headerIsUrl) {
        console.log('Compressing header image (base64)...');
        // More aggressive compression for header (400KB target)
        compressedSettings.themeSettings.headerImage = await compressImage(cleanThemeSettings.headerImage, 400);
      }
      
      // Check total size
      const dataSize = JSON.stringify(compressedSettings).length;
      console.log(`Total data size: ${(dataSize / 1024).toFixed(2)} KB (${(dataSize / 1024 / 1024).toFixed(2)} MB)`);
      
      // Log each field size
      Object.keys(compressedSettings).forEach(key => {
        const fieldSize = JSON.stringify(compressedSettings[key]).length;
        if (fieldSize > 1000) {
          console.log(`${key}: ${(fieldSize / 1024).toFixed(2)} KB`);
        }
      });
      
      if (dataSize > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Veriler çok büyük. Lütfen daha küçük resimler kullanın.');
      }
      
      const response = await fetch('/api/tenant-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(compressedSettings),
      });

      // Response'un JSON olup olmadığını kontrol et
      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        // JSON değilse, text olarak al
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
      }

      console.log('API Response:', result);

      if (response.ok) {
        if (result.success) {
          alert('Ayarlar başarıyla kaydedildi!');
          // Ayarları yeniden yükle
          await loadSettings();
        } else {
          throw new Error(result.error || 'Bilinmeyen hata');
        }
      } else {
        // Daha detaylı hata mesajı
        const errorMessage = `HTTP ${response.status}: ${result.error || 'Sunucu hatası'}`;
        if (result.details) {
          console.error('Error details:', result.details);
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Ayarlar kaydedilemedi: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleWorkingHoursChange = (day: string, field: 'start' | 'end' | 'closed', value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleThemeChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      themeSettings: {
        ...prev.themeSettings,
        [field]: value
      }
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
      
      // Update settings
      setSettings((prev) => ({
        ...prev,
        themeSettings: {
          ...prev.themeSettings,
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

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader user={user} />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Ayarlar yükleniyor...</div>
        </div>
      </div>
    );
  }

  const businessTypes = [
    { value: 'salon', label: 'Güzellik Salonu' },
    { value: 'barbershop', label: 'Berber' },
    { value: 'spa', label: 'SPA & Wellness' },
    { value: 'clinic', label: 'Sağlık Kliniği' },
    { value: 'dental', label: 'Diş Kliniği' },
    { value: 'other', label: 'Diğer' }
  ];

  const days = [
    { key: 'monday', label: 'Pazartesi' },
    { key: 'tuesday', label: 'Salı' },
    { key: 'wednesday', label: 'Çarşamba' },
    { key: 'thursday', label: 'Perşembe' },
    { key: 'friday', label: 'Cuma' },
    { key: 'saturday', label: 'Cumartesi' },
    { key: 'sunday', label: 'Pazar' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Settings className="w-8 h-8 mr-3" />
                İşletme Ayarları
              </h1>
              <p className="text-gray-600 mt-2">İşletmenizin genel ayarlarını düzenleyin</p>
            </div>
            
            <Button 
              onClick={saveSettings}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
            </Button>
          </div>

      {/* Tema Ayarları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            Tema Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ana Renk (Primary Color)
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={settings.themeSettings?.primaryColor || '#EC4899'}
                  onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.themeSettings?.primaryColor || '#EC4899'}
                  onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İkincil Renk (Secondary Color)
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={settings.themeSettings?.secondaryColor || '#BE185D'}
                  onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.themeSettings?.secondaryColor || '#BE185D'}
                  onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo (Max 3MB)
              </label>
              <input
                type="file"
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
                      setSettings(prev => ({
                        ...prev,
                        themeSettings: {
                          ...prev.themeSettings,
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
                      setSettings(prev => ({
                        ...prev,
                        themeSettings: {
                          ...prev.themeSettings,
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
          </div>
        </CardContent>
      </Card>

      {/* İşletme Bilgileri */}
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
                value={settings.businessName}
                onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İşletme Türü
              </label>
              <select
                value={settings.businessType}
                onChange={(e) => setSettings(prev => ({ ...prev, businessType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {businessTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İşletme Açıklaması
            </label>
            <textarea
              rows={3}
              value={settings.businessDescription}
              onChange={(e) => setSettings(prev => ({ ...prev, businessDescription: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="İşletmeniz hakkında kısa bir açıklama..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İşletme Adresi
            </label>
            <textarea
              rows={2}
              value={settings.businessAddress}
              onChange={(e) => setSettings(prev => ({ ...prev, businessAddress: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tam adres bilgisi..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Yönetici Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            İşletme Yönetici Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adı Soyadı *
              </label>
              <input
                type="text"
                value={settings.ownerName}
                onChange={(e) => setSettings(prev => ({ ...prev, ownerName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-posta *
              </label>
              <input
                type="email"
                value={settings.ownerEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, ownerEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+90 555 123 4567"
            />
          </div>
        </CardContent>
      </Card>

      {/* Giriş Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="w-5 h-5 mr-2" />
            Giriş Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={settings.username}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                title="Kullanıcı adı değiştirilemez"
              />
              <p className="mt-1 text-xs text-gray-500">Kullanıcı adı değiştirilemez</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yeni Şifre
              </label>
              <input
                type="password"
                value={settings.password}
                onChange={(e) => setSettings(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Değiştirmek istemiyorsanız boş bırakın"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Konum Ayarları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Konum Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Harita Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Haritadan Konum Seçin
            </label>
            <div className="h-96 w-full bg-gray-200 rounded-lg overflow-hidden relative">
              <iframe
                src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d12094.057639996415!2d${settings.location.longitude || '28.9784'}!3d${settings.location.latitude || '41.0082'}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1str!2str!4v1234567890`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Konum Seçici"
              />
              {settings.location.latitude && settings.location.longitude && (
                <div className="absolute top-2 left-2 bg-white p-2 rounded shadow text-xs">
                  <strong>Seçili Konum:</strong><br />
                  {parseFloat(settings.location.latitude).toFixed(6)}, {parseFloat(settings.location.longitude).toFixed(6)}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enlem (Latitude)
              </label>
              <input
                type="text"
                value={settings.location.latitude}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, latitude: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Örnek: 41.0082"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Boylam (Longitude)
              </label>
              <input
                type="text"
                value={settings.location.longitude}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, longitude: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Örnek: 28.9784"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harita Adresi
            </label>
            <input
              type="text"
              value={settings.location.address}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                location: { ...prev.location, address: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Haritada gösterilecek adres"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              type="button"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setSettings(prev => ({
                        ...prev,
                        location: {
                          ...prev.location,
                          latitude: position.coords.latitude.toString(),
                          longitude: position.coords.longitude.toString()
                        }
                      }));
                    },
                    (error) => {
                      alert('Konum alınamadı: ' + error.message);
                    }
                  );
                } else {
                  alert('Tarayıcınız konum servisini desteklemiyor.');
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Mevcut Konumumu Al
            </Button>
            
            <Button
              type="button"
              onClick={() => setSettings(prev => ({
                ...prev,
                location: { latitude: '', longitude: '', address: '' }
              }))}
              variant="outline"
            >
              Konumu Temizle
            </Button>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nasıl kullanılır:</strong><br />
              1. "Mevcut Konumumu Al" butonuna tıklayarak otomatik konum alabilirsiniz<br />
              2. Manuel olarak enlem/boylam girebilirsiniz<br />
              3. Google Maps'ten koordinatları kopyalayıp yapıştırabilirsiniz
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Çalışma Saatleri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Çalışma Saatleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {days.map(day => (
            <div key={day.key} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-24">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={!settings.workingHours[day.key]?.closed}
                    onChange={(e) => handleWorkingHoursChange(day.key, 'closed', !e.target.checked)}
                    className="mr-2"
                  />
                  {day.label}
                </label>
              </div>
              
              {!settings.workingHours[day.key]?.closed && (
                <>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Başlangıç:</label>
                    <input
                      type="time"
                      value={settings.workingHours[day.key]?.start || '09:00'}
                      onChange={(e) => handleWorkingHoursChange(day.key, 'start', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Bitiş:</label>
                    <input
                      type="time"
                      value={settings.workingHours[day.key]?.end || '18:00'}
                      onChange={(e) => handleWorkingHoursChange(day.key, 'end', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
              
              {settings.workingHours[day.key]?.closed && (
                <span className="text-gray-500 italic">Kapalı</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Randevu Ayarları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Randevu Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800 mb-1">Takvim Zaman Aralığı Hakkında</p>
                <p className="text-xs text-blue-700">
                  Bu ayar, randevu oluşturulurken gösterilecek saat aralıklarını belirler. 
                  Örneğin 30 dakika seçerseniz, saatler 09:00, 09:30, 10:00, 10:30 şeklinde görünür.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Takvim Zaman Aralıkları
            </label>
            <select
              value={settings.appointmentTimeInterval}
              onChange={(e) => setSettings(prev => ({ ...prev, appointmentTimeInterval: parseInt(e.target.value) }))}
              className="w-full md:w-64 px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base font-medium"
            >
              <option value={5}>5 dakika</option>
              <option value={10}>10 dakika</option>
              <option value={15}>15 dakika</option>
              <option value={20}>20 dakika</option>
              <option value={30}>30 dakika</option>
              <option value={45}>45 dakika</option>
              <option value={60}>60 dakika (1 saat)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Seçilen aralık, tüm randevu sayfalarında kullanılacaktır.
            </p>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Örnek Saat Aralıkları (09:00 - 12:00):</p>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const interval = settings.appointmentTimeInterval || 30;
                const startHour = 9;
                const endHour = 12;
                const slots = [];
                
                for (let hour = startHour; hour < endHour; hour++) {
                  for (let minute = 0; minute < 60; minute += interval) {
                    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    slots.push(timeStr);
                  }
                }
                // Add the end hour
                slots.push(`${endHour.toString().padStart(2, '0')}:00`);
                
                return slots.slice(0, 10).map((time, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700">
                    {time}
                  </span>
                ));
              })()}
              {settings.appointmentTimeInterval && settings.appointmentTimeInterval <= 15 && (
                <span className="px-3 py-1.5 text-sm text-gray-500 italic">...</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kaydet Butonu */}
      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Kaydediliyor...' : 'Tüm Değişiklikleri Kaydet'}
        </Button>
      </div>
        </div>
      </main>
    </div>
  );
}