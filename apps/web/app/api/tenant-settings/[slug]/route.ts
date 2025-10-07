import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

    // Admin veritabanına bağlan
    const prisma = new PrismaClient();
    
    try {
      // Tenant'ı slug ile bul - tüm gerekli alanları çek
      const tenant = await prisma.tenant.findFirst({
        where: {
          slug: slug,
          status: 'active'
        },
        select: {
          id: true,
          businessName: true,
          businessDescription: true,
          businessType: true,
          slug: true,
          address: true,
          phone: true,
          ownerEmail: true,
          workingHours: true,
          theme: true
        }
      });
      
      if (!tenant) {
        // Tenant bulunamadı, default ayarlar döndür
        const defaultSettings = generateDefaultSettings(slug);
        return NextResponse.json({
          success: true,
          data: defaultSettings
        }, { headers: corsHeaders });
      }

      const tenantId = tenant.id;

      // Tenant'ın doğrudan theme ve workingHours bilgilerini kullan
      const parsedSettings = {
        tenant: {
          id: tenant.id,
          name: tenant.businessName,
          slug: tenant.slug,
          businessName: tenant.businessName,
          businessDescription: tenant.businessDescription || '',
          businessType: tenant.businessType || '',
          businessAddress: tenant.address || 'Adres bilgisi güncellenecek',
          businessPhone: tenant.phone || '+90 555 000 0000',
          businessEmail: tenant.ownerEmail || `info@${slug}.com`,
        },
        workingHours: tenant.workingHours ? JSON.parse(tenant.workingHours) : getDefaultWorkingHours(),
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
            const parsedTheme = tenant.theme ? JSON.parse(tenant.theme) : {
              primaryColor: '#3B82F6',
              secondaryColor: '#1E40AF',
              logo: '',
              headerImage: ''
            };
            return parsedTheme;
          } catch (error) {
            console.error('Theme parse error:', error);
            return {
              primaryColor: '#3B82F6',
              secondaryColor: '#1E40AF',
              logo: '',
              headerImage: ''
            };
          }
        })(),
        location: (() => {
          try {
            const parsedTheme = tenant.theme ? JSON.parse(tenant.theme) : {};
            return {
              latitude: parsedTheme.location?.latitude || '',
              longitude: parsedTheme.location?.longitude || '',
              address: tenant.address || ''
            };
          } catch (error) {
            return {
              latitude: '',
              longitude: '',
              address: tenant.address || ''
            };
          }
        })(),
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
      await prisma.$disconnect();
    }
    
  } catch (error) {
    console.error('Error fetching tenant settings:', error);
    console.error('Error details:', error.message);
    return NextResponse.json(
      { success: false, error: `Failed to fetch tenant settings: ${error.message}` },
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
      id: slug, // Fallback olarak slug kullan, gerçek ID bulunamadığında
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
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
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
