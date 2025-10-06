import { NextRequest, NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Tenant-Slug',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Tenant slug is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Admin veritabanına bağlan - absolute path kullan
    const dbPath = '/Users/kartal.kolcuoglu/Desktop/kartalApps/randevuSistemi/apps/admin/prisma/admin.db';
    const db = new Database(dbPath);
    
    try {
      // Tenant'ı slug ile bul - tüm gerekli alanları çek
      const tenant = db.prepare('SELECT id, businessName, businessDescription, businessType, slug, address, phone, ownerEmail, workingHours, theme, location FROM tenants WHERE slug = ? AND status = ?').get(slug, 'active');
      
      if (!tenant) {
        // Tenant bulunamadı, default ayarlar döndür
        const defaultSettings = generateDefaultSettings(slug);
        return NextResponse.json({
          success: true,
          data: defaultSettings
        }, { headers: corsHeaders });
      }

      const tenantId = (tenant as any).id;

      // Tenant'ın doğrudan theme ve workingHours bilgilerini kullan
      const parsedSettings = {
        tenant: {
          id: (tenant as any).id,
          name: (tenant as any).businessName,
          slug: (tenant as any).slug,
          businessName: (tenant as any).businessName,
          businessDescription: (tenant as any).businessDescription || '',
          businessType: (tenant as any).businessType || '',
          businessAddress: (tenant as any).address || 'Adres bilgisi güncellenecek',
          businessPhone: (tenant as any).phone || '+90 555 000 0000',
          businessEmail: (tenant as any).ownerEmail || `info@${slug}.com`,
        },
        workingHours: (tenant as any).workingHours ? JSON.parse((tenant as any).workingHours) : getDefaultWorkingHours(),
        notificationSettings: {
          emailNotifications: true,
          smsNotifications: true,
          appointmentReminders: true,
          marketingEmails: false
        },
        paymentSettings: {
          acceptCash: true,
          acceptCard: true,
          acceptDigital: true,
          taxRate: 18
        },
        theme: (() => {
          try {
            return (tenant as any).theme ? JSON.parse((tenant as any).theme) : {
              primaryColor: '#EC4899',
              secondaryColor: '#BE185D',
              logo: '',
              headerImage: ''
            };
          } catch (error) {
            console.log('Theme parse error:', error, 'Raw theme:', (tenant as any).theme);
            return {
              primaryColor: '#EC4899',
              secondaryColor: '#BE185D',
              logo: '',
              headerImage: ''
            };
          }
        })(),
        location: (tenant as any).location ? JSON.parse((tenant as any).location) : {
          latitude: '',
          longitude: '',
          address: ''
        },
        updatedAt: new Date().toISOString()
      };
      
      return NextResponse.json({
        success: true,
        data: parsedSettings
      }, { headers: corsHeaders });
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Fallback to default settings
      const defaultSettings = generateDefaultSettings(slug);
      return NextResponse.json({
        success: true,
        data: defaultSettings
      }, { headers: corsHeaders });
    } finally {
      db.close();
    }
    
  } catch (error) {
    console.error('Error fetching tenant settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tenant settings' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Yeni tenant'lar için default ayarlar oluşturur
function generateDefaultSettings(slug: string) {
  const name = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    tenant: {
      id: slug,
      name: name,
      slug: slug,
      businessName: name,
      businessAddress: 'Adres bilgisi güncellenecek',
      businessPhone: '+90 555 000 0000',
      businessEmail: `info@${slug}.com`,
    },
    workingHours: getDefaultWorkingHours(),
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: true,
      appointmentReminders: true,
      marketingEmails: false
    },
    paymentSettings: {
      acceptCash: true,
      acceptCard: true,
      acceptDigital: true,
      taxRate: 18
    },
        theme: {
          primaryColor: '#EC4899',
          secondaryColor: '#BE185D',
          logo: '',
          headerImage: ''
        },
        location: {
          latitude: '',
          longitude: '',
          address: ''
        },
    updatedAt: new Date().toISOString()
  };
}

function getDefaultWorkingHours() {
  return {
    monday: { start: "09:00", end: "18:00", closed: false },
    tuesday: { start: "09:00", end: "18:00", closed: false },
    wednesday: { start: "09:00", end: "18:00", closed: false },
    thursday: { start: "09:00", end: "18:00", closed: false },
    friday: { start: "09:00", end: "18:00", closed: false },
    saturday: { start: "09:00", end: "17:00", closed: false },
    sunday: { start: "10:00", end: "16:00", closed: true }
  };
}
