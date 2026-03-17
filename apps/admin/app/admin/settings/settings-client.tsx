"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Tabs, TabsList, TabsTrigger, TabsContent, formatPhone, normalizePhone, PHONE_PLACEHOLDER, PHONE_MAX_LENGTH } from '@/components/ui';
import { Save, Palette, Building2, User, Key, Clock, Upload, ArrowLeft, MapPin, Settings, CreditCard, FileText, CalendarX2, Trash2, Plus, MessageSquare } from 'lucide-react';
import AdminHeader from '../admin-header';
import type { ClientUser } from '../../../lib/client-permissions';
import { DEFAULT_TEMPLATES } from '../../../lib/message-templates';

interface SettingsClientProps {
  user: ClientUser;
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [headerPreview, setHeaderPreview] = useState<string>('');

  // Blocked dates (tatil günleri)
  const [blockedDates, setBlockedDates] = useState<{ id: string; title: string; startDate: string; endDate: string; staffId?: string }[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState({ title: '', startDate: '', endDate: '' });
  const [blockedDateSaving, setBlockedDateSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Tema ayarları
    themeSettings: {
      primaryColor: '#163974',
      secondaryColor: '#0F2A52',
      logo: 'https://i.hizliresim.com/4a00l8g.png',
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
    blacklistThreshold: 3, // Kara liste eşiği (kaç defa gelmedi)
    reminderMinutes: 120, // Hatırlatma süresi (randevudan kaç dakika önce)
    // Mesaj şablonları
    messageTemplates: {
      whatsappConfirmation: DEFAULT_TEMPLATES.whatsappConfirmation,
      smsConfirmation: DEFAULT_TEMPLATES.smsConfirmation,
      whatsappReminder: DEFAULT_TEMPLATES.whatsappReminder,
      smsReminder: DEFAULT_TEMPLATES.smsReminder,
      staffDailyReminder: DEFAULT_TEMPLATES.staffDailyReminder,
      ownerDailyReminder: DEFAULT_TEMPLATES.ownerDailyReminder || ''
    },
    // Bildirim kanal tercihleri
    notificationSettings: {
      confirmationChannel: 'whatsapp' as string,
      reminderChannel: 'both' as string,
      staffDailyChannel: 'whatsapp' as string,
      ownerDailyChannel: 'whatsapp' as string,
      autoSendConfirmation: false,
    },
    // Ödeme ayarları
    cardPaymentEnabled: true, // Kredi kartı ile ödeme aktif mi
    // Konum ayarları
    location: {
      latitude: '',
      longitude: '',
      address: ''
    },
    // Belgeler
    documents: {
      identityDocument: '',
      taxDocument: '',
      iban: '',
      signatureDocument: ''
    }
  });

  // Refs for message template textareas
  const whatsappConfirmationRef = useRef<HTMLTextAreaElement>(null);
  const smsConfirmationRef = useRef<HTMLTextAreaElement>(null);
  const whatsappReminderRef = useRef<HTMLTextAreaElement>(null);
  const smsReminderRef = useRef<HTMLTextAreaElement>(null);
  const staffDailyReminderRef = useRef<HTMLTextAreaElement>(null);
  const ownerDailyReminderRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = (
    ref: React.RefObject<HTMLTextAreaElement | null>,
    templateKey: keyof typeof DEFAULT_TEMPLATES,
    variable: string
  ) => {
    const textarea = ref.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = settings.messageTemplates[templateKey];
    const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
    setSettings(prev => ({
      ...prev,
      messageTemplates: { ...prev.messageTemplates, [templateKey]: newValue }
    }));
    // Restore cursor position after variable insertion
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
    }, 0);
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // ✅ ALWAYS use Admin API (same database where settings are saved)
      console.log('📥 Loading settings from Admin API...');
      const tenantResponse = await fetch('/api/tenant-info?t=' + Date.now());
      const tenantData = await tenantResponse.json();
      
      console.log('Load Settings Response:', tenantData);
      
      if (tenantResponse.ok) {
        if (tenantData.success && tenantData.data) {
          const tenant = tenantData.data;
          console.log('✅ Loaded tenant from Admin API:', tenant.businessName);
          
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

          // Extract documents from theme (if it exists there)
          const documentsData = themeData.documents || tenant.documents || {
            identityDocument: '',
            taxDocument: '',
            iban: '',
            signatureDocument: ''
          };

          setSettings(prev => ({
            ...prev,
            // Business info from Admin API
            businessName: tenant.businessName || '',
            businessType: tenant.businessType || 'salon',
            businessDescription: tenant.businessDescription || '',
            businessAddress: tenant.address || '',
            
            // Owner info from Admin API
            ownerName: tenant.ownerName || '',
            ownerEmail: tenant.ownerEmail || '',
            phone: tenant.phone || '',
            
            // Login info from Admin API
            username: tenant.username || '',
            password: '', // Güvenlik için şifreyi boş göster
            
            // Other data
            workingHours: workingHoursData || prev.workingHours,
            appointmentTimeInterval: tenant.appointmentTimeInterval || 30, // Default: 30 dakika
            blacklistThreshold: tenant.blacklistThreshold || 3, // Default: 3 defa gelmedi
            reminderMinutes: tenant.reminderMinutes || 120, // Default: 2 saat (120 dakika)
            cardPaymentEnabled: tenant.cardPaymentEnabled !== false, // Default: true
            messageTemplates: {
              whatsappConfirmation: tenant.messageTemplates?.whatsappConfirmation || DEFAULT_TEMPLATES.whatsappConfirmation,
              smsConfirmation: tenant.messageTemplates?.smsConfirmation || DEFAULT_TEMPLATES.smsConfirmation,
              whatsappReminder: tenant.messageTemplates?.whatsappReminder || DEFAULT_TEMPLATES.whatsappReminder,
              smsReminder: tenant.messageTemplates?.smsReminder || DEFAULT_TEMPLATES.smsReminder,
              staffDailyReminder: tenant.messageTemplates?.staffDailyReminder || DEFAULT_TEMPLATES.staffDailyReminder,
              ownerDailyReminder: tenant.messageTemplates?.ownerDailyReminder || DEFAULT_TEMPLATES.ownerDailyReminder,
            },
            notificationSettings: {
              confirmationChannel: tenant.notificationSettings?.confirmationChannel || 'whatsapp',
              reminderChannel: tenant.notificationSettings?.reminderChannel || 'both',
              staffDailyChannel: tenant.notificationSettings?.staffDailyChannel || 'whatsapp',
              ownerDailyChannel: tenant.notificationSettings?.ownerDailyChannel || 'whatsapp',
              autoSendConfirmation: tenant.notificationSettings?.autoSendConfirmation || false,
            },
            themeSettings: themeData,
            location: locationData,
            documents: documentsData
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

          // Load blocked dates
          if (tenant.blockedDates) {
            setBlockedDates(tenant.blockedDates);
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                <Settings className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-3" />
                İşletme Ayarları
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-2">İşletmenizin genel ayarlarını düzenleyin</p>
            </div>
            
            <Button 
              onClick={saveSettings}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
            </Button>
          </div>

      {/* Tab Panel */}
      <Tabs defaultValue="theme" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1 h-auto mb-6">
          <TabsTrigger value="theme" className="flex flex-col md:flex-row items-center gap-1 py-2 px-2 text-xs md:text-sm">
            <Palette className="w-4 h-4" />
            <span>Tema</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="flex flex-col md:flex-row items-center gap-1 py-2 px-2 text-xs md:text-sm">
            <Building2 className="w-4 h-4" />
            <span>İşletme</span>
          </TabsTrigger>
          <TabsTrigger value="owner" className="flex flex-col md:flex-row items-center gap-1 py-2 px-2 text-xs md:text-sm">
            <User className="w-4 h-4" />
            <span>Yönetici</span>
          </TabsTrigger>
          <TabsTrigger value="login" className="flex flex-col md:flex-row items-center gap-1 py-2 px-2 text-xs md:text-sm">
            <Key className="w-4 h-4" />
            <span>Giriş</span>
          </TabsTrigger>
          <TabsTrigger value="location" className="flex flex-col md:flex-row items-center gap-1 py-2 px-2 text-xs md:text-sm">
            <MapPin className="w-4 h-4" />
            <span>Konum</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex flex-col md:flex-row items-center gap-1 py-2 px-2 text-xs md:text-sm">
            <Clock className="w-4 h-4" />
            <span>Çalışma</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex flex-col md:flex-row items-center gap-1 py-2 px-2 text-xs md:text-sm">
            <FileText className="w-4 h-4" />
            <span>Belgeler</span>
          </TabsTrigger>
          <TabsTrigger value="blocked-dates" className="flex flex-col md:flex-row items-center gap-1 py-2 px-2 text-xs md:text-sm">
            <CalendarX2 className="w-4 h-4" />
            <span>Tatiller</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex flex-col md:flex-row items-center gap-1 py-2 px-2 text-xs md:text-sm">
            <MessageSquare className="w-4 h-4" />
            <span>Mesajlar</span>
          </TabsTrigger>
        </TabsList>

        {/* Tema Ayarları */}
        <TabsContent value="theme">
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
        </TabsContent>

        {/* İşletme Bilgileri */}
        <TabsContent value="business">
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
        </TabsContent>

        {/* Yönetici Bilgileri */}
        <TabsContent value="owner">
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
              value={formatPhone(settings.phone)}
              onChange={(e) => setSettings(prev => ({ ...prev, phone: normalizePhone(e.target.value) }))}
              placeholder={PHONE_PLACEHOLDER}
              maxLength={PHONE_MAX_LENGTH}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Giriş Bilgileri */}
        <TabsContent value="login">
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
        </TabsContent>

        {/* Konum Ayarları */}
        <TabsContent value="location">
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
        </TabsContent>

        {/* Çalışma Saatleri + Randevu Ayarları */}
        <TabsContent value="hours" className="space-y-6">
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

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Kara Liste Eşiği
            </label>
            <select
              value={settings.blacklistThreshold}
              onChange={(e) => setSettings(prev => ({ ...prev, blacklistThreshold: parseInt(e.target.value) }))}
              className="w-full md:w-64 px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base font-medium"
            >
              <option value={1}>1 defa</option>
              <option value={2}>2 defa</option>
              <option value={3}>3 defa</option>
              <option value={4}>4 defa</option>
              <option value={5}>5 defa</option>
              <option value={6}>6 defa</option>
              <option value={7}>7 defa</option>
              <option value={8}>8 defa</option>
              <option value={9}>9 defa</option>
              <option value={10}>10 defa</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Müşteri kaç defa "Gelmedi ve Bilgi Vermedi" durumuna sahip olursa kara listeye alınsın?
            </p>
          </div>

          {/* Ödeme Ayarları */}
          <div className="pt-6 mt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Ödeme Ayarları
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Kredi Kartı ile Ödeme
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Bu seçenek kapalı olduğunda, müşteriler kredi kartı ile ödeme yapamaz. Randevu oluştururken ve müşteri tarafında kart seçeneği görünmez.
                  </p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.cardPaymentEnabled}
                      onChange={(e) => setSettings(prev => ({ ...prev, cardPaymentEnabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {settings.cardPaymentEnabled ? 'Aktif' : 'Pasif'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
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
        </TabsContent>

        {/* Belgeler */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Belgeler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-gray-600 mb-4">
                Ödeme işlemleri için gerekli belgeleri yükleyin. Tüm belgeler güvenli bir şekilde saklanacaktır.
              </p>

              {/* Kimlik Belgesi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kimlik Belgesi
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            let result = event.target?.result as string;
                            if (result.startsWith('data:image/')) {
                              result = await compressImage(result, 500);
                            }
                            setSettings(prev => ({
                              ...prev,
                              documents: { ...prev.documents, identityDocument: result }
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  {settings.documents.identityDocument && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 text-sm">Yüklendi</span>
                      <button
                        type="button"
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          documents: { ...prev.documents, identityDocument: '' }
                        }))}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Sil
                      </button>
                    </div>
                  )}
                </div>
                {settings.documents.identityDocument && (
                  <div className="mt-2">
                    {settings.documents.identityDocument.startsWith('data:image/') ? (
                      <img
                        src={settings.documents.identityDocument}
                        alt="Kimlik Belgesi"
                        className="max-w-xs max-h-40 rounded border border-gray-200"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200">
                        <FileText className="w-8 h-8 text-red-500" />
                        <span className="text-sm text-gray-600">PDF Belgesi</span>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Kimlik kartı veya pasaport (resim veya PDF)</p>
              </div>

              {/* Vergi Levhası */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vergi Levhası
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            let result = event.target?.result as string;
                            if (result.startsWith('data:image/')) {
                              result = await compressImage(result, 500);
                            }
                            setSettings(prev => ({
                              ...prev,
                              documents: { ...prev.documents, taxDocument: result }
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  {settings.documents.taxDocument && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 text-sm">Yüklendi</span>
                      <button
                        type="button"
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          documents: { ...prev.documents, taxDocument: '' }
                        }))}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Sil
                      </button>
                    </div>
                  )}
                </div>
                {settings.documents.taxDocument && (
                  <div className="mt-2">
                    {settings.documents.taxDocument.startsWith('data:image/') ? (
                      <img
                        src={settings.documents.taxDocument}
                        alt="Vergi Levhası"
                        className="max-w-xs max-h-40 rounded border border-gray-200"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200">
                        <FileText className="w-8 h-8 text-red-500" />
                        <span className="text-sm text-gray-600">PDF Belgesi</span>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Vergi levhası belgesi (resim veya PDF)</p>
              </div>

              {/* IBAN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IBAN Bilgisi
                </label>
                <input
                  type="text"
                  value={settings.documents.iban}
                  onChange={(e) => {
                    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    // TR ile başlamasını sağla
                    if (!value.startsWith('TR') && value.length > 0) {
                      if (value.startsWith('T')) {
                        // Sadece T varsa bekle
                      } else {
                        value = 'TR' + value;
                      }
                    }
                    // Maksimum 26 karakter (TR + 24 rakam)
                    value = value.slice(0, 26);
                    setSettings(prev => ({
                      ...prev,
                      documents: { ...prev.documents, iban: value }
                    }));
                  }}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">TR ile başlayan 26 haneli IBAN numaranız</p>
              </div>

              {/* İmza Sirküleri */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İmza Sirküleri
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            let result = event.target?.result as string;
                            if (result.startsWith('data:image/')) {
                              result = await compressImage(result, 500);
                            }
                            setSettings(prev => ({
                              ...prev,
                              documents: { ...prev.documents, signatureDocument: result }
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  {settings.documents.signatureDocument && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 text-sm">Yüklendi</span>
                      <button
                        type="button"
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          documents: { ...prev.documents, signatureDocument: '' }
                        }))}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Sil
                      </button>
                    </div>
                  )}
                </div>
                {settings.documents.signatureDocument && (
                  <div className="mt-2">
                    {settings.documents.signatureDocument.startsWith('data:image/') ? (
                      <img
                        src={settings.documents.signatureDocument}
                        alt="İmza Sirküleri"
                        className="max-w-xs max-h-40 rounded border border-gray-200"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200">
                        <FileText className="w-8 h-8 text-red-500" />
                        <span className="text-sm text-gray-600">PDF Belgesi</span>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Noter onaylı imza sirküleri (resim veya PDF)</p>
              </div>

              {/* Bilgi Notu */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Not:</strong> Yüklediğiniz belgeler yalnızca ödeme işlemleri için kullanılacaktır.
                  Belgeleriniz güvenli sunucularda şifreli olarak saklanmaktadır.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tatil Günleri */}
        <TabsContent value="blocked-dates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarX2 className="w-5 h-5 mr-2 text-red-600" />
                Tatil Günleri / Kapalı Tarihler
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Bayram, tatil veya özel günlerde randevu almayı kapatın. Bu tarihlerde müşteriler randevu oluşturamaz.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Yeni tatil ekleme formu */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
                <h3 className="font-medium text-sm text-gray-700">Yeni Tatil Ekle</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Başlık</label>
                    <input
                      type="text"
                      placeholder="Ramazan Bayramı"
                      value={newBlockedDate.title}
                      onChange={(e) => setNewBlockedDate(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Başlangıç Tarihi</label>
                    <input
                      type="date"
                      value={newBlockedDate.startDate}
                      onChange={(e) => setNewBlockedDate(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Bitiş Tarihi</label>
                    <input
                      type="date"
                      value={newBlockedDate.endDate}
                      onChange={(e) => setNewBlockedDate(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <Button
                  disabled={blockedDateSaving || !newBlockedDate.title.trim() || !newBlockedDate.startDate || !newBlockedDate.endDate}
                  onClick={async () => {
                    setBlockedDateSaving(true);
                    try {
                      const res = await fetch('/api/blocked-dates', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newBlockedDate),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setBlockedDates(prev => [...prev, data.data].sort((a, b) => a.startDate.localeCompare(b.startDate)));
                        setNewBlockedDate({ title: '', startDate: '', endDate: '' });
                      } else {
                        alert(data.error || 'Eklenemedi');
                      }
                    } catch (err) {
                      alert('Bir hata oluştu');
                    } finally {
                      setBlockedDateSaving(false);
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {blockedDateSaving ? 'Ekleniyor...' : 'Tatil Ekle'}
                </Button>
              </div>

              {/* Mevcut tatil listesi */}
              {blockedDates.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CalendarX2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Henüz tatil günü eklenmemiş</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedDates.map((bd) => (
                    <div key={bd.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                      <div>
                        <span className="font-medium text-sm text-red-800">{bd.title}</span>
                        <span className="text-xs text-red-600 ml-3">
                          {bd.startDate} — {bd.endDate}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        onClick={async () => {
                          if (!confirm(`"${bd.title}" tatilini silmek istediğinize emin misiniz?`)) return;
                          try {
                            const res = await fetch(`/api/blocked-dates/${bd.id}`, { method: 'DELETE' });
                            const data = await res.json();
                            if (data.success) {
                              setBlockedDates(prev => prev.filter(d => d.id !== bd.id));
                            } else {
                              alert(data.error || 'Silinemedi');
                            }
                          } catch (err) {
                            alert('Bir hata oluştu');
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Bilgi notu */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Not:</strong> Tatil günü eklemek mevcut randevuları otomatik olarak iptal etmez.
                  Sadece yeni randevu oluşturmayı engeller.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mesaj Sablonlari */}
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Mesaj Sablonlari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <p className="text-sm text-gray-500">
                Musterilere ve personele gonderilen WhatsApp ve SMS mesajlarini buradan duzenleyebilirsiniz.
                Her mesaj turu icin gonderm kanalini secebilir ve sablonlari kisisellestirebilirsiniz.
              </p>

              {/* Hatırlatma Süresi */}
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Randevu Hatirlatma Suresi
                </label>
                <select
                  value={settings.reminderMinutes}
                  onChange={(e) => setSettings(prev => ({ ...prev, reminderMinutes: parseInt(e.target.value) }))}
                  className="w-full md:w-64 px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base font-medium"
                >
                  <option value={10}>10 dakika once</option>
                  <option value={30}>30 dakika once</option>
                  <option value={60}>1 saat once</option>
                  <option value={120}>2 saat once</option>
                  <option value={180}>3 saat once</option>
                  <option value={240}>4 saat once</option>
                  <option value={360}>6 saat once</option>
                  <option value={720}>12 saat once</option>
                  <option value={1440}>1 gun once</option>
                </select>
                <p className="text-xs text-gray-500">
                  Musterilere randevu saatinden ne kadar once hatirlatma mesaji gonderilsin?
                </p>
              </div>

              {/* Randevu Onay Mesaji */}
              <div className="space-y-3 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">Randevu Onay Mesaji</h3>
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      messageTemplates: { ...prev.messageTemplates, whatsappConfirmation: DEFAULT_TEMPLATES.whatsappConfirmation }
                    }))}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Varsayilana Don
                  </button>
                </div>
                <p className="text-xs text-gray-500">Randevu onaylandiginda musteriye gonderilir.</p>
                <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Otomatik bildirim gonder</p>
                    <p className="text-xs text-gray-500">Randevu olusturuldugunda musteriye otomatik onay mesaji gonderilir</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notificationSettings.autoSendConfirmation}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        notificationSettings: { ...prev.notificationSettings, autoSendConfirmation: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-600">Kanal:</label>
                  <select
                    value={settings.notificationSettings.confirmationChannel}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notificationSettings: { ...prev.notificationSettings, confirmationChannel: e.target.value }
                    }))}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="both">Her ikisi</option>
                    <option value="off">Kapali</option>
                  </select>
                </div>
                <textarea
                  ref={whatsappConfirmationRef}
                  value={settings.messageTemplates.whatsappConfirmation}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    messageTemplates: { ...prev.messageTemplates, whatsappConfirmation: e.target.value }
                  }))}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex flex-wrap gap-1.5">
                  {['{musteriAdi}', '{tarih}', '{saat}', '{personel}', '{hizmet}', '{ucret}', '{isletmeAdi}', '{isletmeTelefon}', '{isletmeAdres}'].map(v => (
                    <span key={v} onClick={() => insertVariable(whatsappConfirmationRef, 'whatsappConfirmation', v)} className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors">{v}</span>
                  ))}
                </div>
              </div>

              {/* SMS Onay Mesaji */}
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">SMS Onay Sablonu</h4>
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      messageTemplates: { ...prev.messageTemplates, smsConfirmation: DEFAULT_TEMPLATES.smsConfirmation }
                    }))}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Varsayilana Don
                  </button>
                </div>
                <p className="text-xs text-gray-500">SMS ile gonderilecek onay mesaji (emoji kullanmayin).</p>
                <textarea
                  ref={smsConfirmationRef}
                  value={settings.messageTemplates.smsConfirmation}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    messageTemplates: { ...prev.messageTemplates, smsConfirmation: e.target.value }
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex flex-wrap gap-1.5">
                  {['{musteriAdi}', '{tarih}', '{saat}', '{personel}', '{hizmet}', '{ucret}', '{isletmeAdi}', '{isletmeTelefon}', '{isletmeAdres}'].map(v => (
                    <span key={v} onClick={() => insertVariable(smsConfirmationRef, 'smsConfirmation', v)} className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors">{v}</span>
                  ))}
                </div>
              </div>

              {/* Hatirlatma Mesaji */}
              <div className="space-y-3 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">Hatirlatma Mesaji</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        messageTemplates: {
                          ...prev.messageTemplates,
                          whatsappReminder: DEFAULT_TEMPLATES.whatsappReminder,
                          smsReminder: DEFAULT_TEMPLATES.smsReminder
                        }
                      }))}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Varsayilana Don
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Randevu saatinden once musteriye gonderilir.</p>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-600">Kanal:</label>
                  <select
                    value={settings.notificationSettings.reminderChannel}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notificationSettings: { ...prev.notificationSettings, reminderChannel: e.target.value }
                    }))}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="both">Her ikisi</option>
                    <option value="off">Kapali</option>
                  </select>
                </div>
                {(settings.notificationSettings.reminderChannel === 'whatsapp' || settings.notificationSettings.reminderChannel === 'both') && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">WhatsApp Sablonu:</label>
                    <textarea
                      ref={whatsappReminderRef}
                      value={settings.messageTemplates.whatsappReminder}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        messageTemplates: { ...prev.messageTemplates, whatsappReminder: e.target.value }
                      }))}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                {(settings.notificationSettings.reminderChannel === 'sms' || settings.notificationSettings.reminderChannel === 'both') && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">SMS Sablonu:</label>
                    <textarea
                      ref={smsReminderRef}
                      value={settings.messageTemplates.smsReminder}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        messageTemplates: { ...prev.messageTemplates, smsReminder: e.target.value }
                      }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {['{musteriAdi}', '{tarih}', '{saat}', '{personel}', '{hizmet}', '{hatirlatmaSuresi}', '{isletmeAdi}', '{isletmeTelefon}', '{isletmeAdres}'].map(v => (
                    <span key={v} onClick={() => {
                      if (settings.notificationSettings.reminderChannel === 'sms') {
                        insertVariable(smsReminderRef, 'smsReminder', v);
                      } else {
                        insertVariable(whatsappReminderRef, 'whatsappReminder', v);
                      }
                    }} className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors">{v}</span>
                  ))}
                </div>
              </div>

              {/* Personel Gunluk Ozet */}
              <div className="space-y-3 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">Personel Gunluk Ozet Mesaji</h3>
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      messageTemplates: { ...prev.messageTemplates, staffDailyReminder: DEFAULT_TEMPLATES.staffDailyReminder }
                    }))}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Varsayilana Don
                  </button>
                </div>
                <p className="text-xs text-gray-500">Her sabah personele gonderilen gunluk randevu ozeti.</p>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-600">Kanal:</label>
                  <select
                    value={settings.notificationSettings.staffDailyChannel}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notificationSettings: { ...prev.notificationSettings, staffDailyChannel: e.target.value }
                    }))}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="off">Kapali</option>
                  </select>
                </div>
                <textarea
                  ref={staffDailyReminderRef}
                  value={settings.messageTemplates.staffDailyReminder}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    messageTemplates: { ...prev.messageTemplates, staffDailyReminder: e.target.value }
                  }))}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex flex-wrap gap-1.5">
                  {['{personelAdi}', '{gun}', '{tarih}', '{randevuSayisi}', '{randevuListesi}', '{isletmeAdi}'].map(v => (
                    <span key={v} onClick={() => insertVariable(staffDailyReminderRef, 'staffDailyReminder', v)} className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors">{v}</span>
                  ))}
                </div>
              </div>

              {/* Isletme Gunluk Ozet */}
              <div className="space-y-3 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">Isletme Gunluk Ozet Mesaji</h3>
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      messageTemplates: { ...prev.messageTemplates, ownerDailyReminder: DEFAULT_TEMPLATES.ownerDailyReminder }
                    }))}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Varsayilana Don
                  </button>
                </div>
                <p className="text-xs text-gray-500">Her aksam isletme sahibine gonderilen gunluk gelir ve musteri ozeti.</p>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-600">Kanal:</label>
                  <select
                    value={settings.notificationSettings.ownerDailyChannel}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notificationSettings: { ...prev.notificationSettings, ownerDailyChannel: e.target.value }
                    }))}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="off">Kapali</option>
                  </select>
                </div>
                <textarea
                  ref={ownerDailyReminderRef}
                  value={settings.messageTemplates.ownerDailyReminder}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    messageTemplates: { ...prev.messageTemplates, ownerDailyReminder: e.target.value }
                  }))}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex flex-wrap gap-1.5">
                  {['{sahipAdi}', '{gun}', '{tarih}', '{gelenMusteri}', '{iptalSayisi}', '{gelmediler}', '{toplamRandevu}', '{nakitGelir}', '{kartGelir}', '{paketGelir}', '{toplamGelir}', '{isletmeAdi}'].map(v => (
                    <span key={v} onClick={() => insertVariable(ownerDailyReminderRef, 'ownerDailyReminder', v)} className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors">{v}</span>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Kaydet Butonu */}
      <div className="flex justify-center mt-6">
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 w-full sm:w-auto"
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