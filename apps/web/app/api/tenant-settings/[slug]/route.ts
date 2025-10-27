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
        // Tenant bulunamadı, 404 döndür
        console.log(`Tenant not found for slug: ${slug}`);
        return NextResponse.json({
          success: false,
          error: `Tenant with slug '${slug}' not found`,
          code: 'TENANT_NOT_FOUND'
        }, { 
          status: 404, 
          headers: corsHeaders 
        });
      }

      const tenantId = tenant.id;

      // Fetch settings for appointmentTimeInterval (gracefully handle if Settings table doesn't exist)
      let appointmentTimeInterval = 30; // Default
      try {
        const settings = await prisma.settings.findUnique({
          where: { tenantId: tenantId },
          select: { appointmentTimeInterval: true }
        });
        if (settings?.appointmentTimeInterval) {
          appointmentTimeInterval = settings.appointmentTimeInterval;
        }
      } catch (settingsError) {
        console.warn('Settings table not available, using default appointmentTimeInterval:', settingsError.message);
        // Continue with default value
      }

      // Tenant'ın doğrudan theme ve workingHours bilgilerini kullan
      const parsedSettings = {
        appointmentTimeInterval: appointmentTimeInterval,
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
            let themeData = tenant.theme;
            
            // Eğer theme string ise parse et
            if (typeof themeData === 'string') {
              themeData = JSON.parse(themeData);
            }
            
            // Eğer hala string ise (double-encoded) tekrar parse et
            if (typeof themeData === 'string') {
              themeData = JSON.parse(themeData);
            }
            
            // Eğer theme bir object değilse veya gerekli alanlar yoksa default döndür
            if (!themeData || typeof themeData !== 'object') {
              return {
                primaryColor: '#3B82F6',
                secondaryColor: '#1E40AF',
                logo: '',
                headerImage: ''
              };
            }
            
            return {
              primaryColor: themeData.primaryColor || '#3B82F6',
              secondaryColor: themeData.secondaryColor || '#1E40AF',
              logo: themeData.logo || '',
              headerImage: themeData.headerImage || ''
            };
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
            let themeData = tenant.theme;
            
            // Eğer theme string ise parse et
            if (typeof themeData === 'string') {
              themeData = JSON.parse(themeData);
            }
            
            // Eğer hala string ise (double-encoded) tekrar parse et
            if (typeof themeData === 'string') {
              themeData = JSON.parse(themeData);
            }
            
            return {
              latitude: themeData?.location?.latitude || '',
              longitude: themeData?.location?.longitude || '',
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
      
      // Database hatası durumunda da 404 döndür (tenant bulunamadı)
      return NextResponse.json({
        success: false,
        error: `Database error: tenant '${slug}' could not be retrieved`,
        code: 'DATABASE_ERROR'
      }, { 
        status: 500, 
        headers: corsHeaders 
      });
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
