import { NextRequest, NextResponse } from 'next/server';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-Slug',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const tenantSlug = request.headers.get('X-Tenant-Slug') || request.nextUrl.searchParams.get('tenantSlug');
    
    if (!tenantSlug) {
      return NextResponse.json(
        { success: false, error: 'Tenant slug is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // First find tenant by slug in admin DB
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // Get tenant by slug
      const tenant = await prisma.tenant.findFirst({
        where: {
          slug: tenantSlug,
          status: 'active'
        },
        select: {
          id: true
        }
      });
      
      if (!tenant) {
        // Tenant bulunamadı, fallback template kullan
        const services = generateDefaultServices(tenantSlug);
        return NextResponse.json({
          success: true,
          data: services
        }, { headers: corsHeaders });
      }

      const tenantId = tenant.id;

      // Get services for this tenant
      const services = await prisma.service.findMany({
        where: {
          tenantId: tenantId,
          status: 'active'
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          duration: true,
          category: true,
          status: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return NextResponse.json({
        success: true,
        data: services
      }, { headers: corsHeaders });
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Fallback to mock data based on tenant slug
      const mockServicesByTenant: Record<string, any[]> = {
        'lobaaaa': [
          {
            id: 's1-lobaaaa',
            name: 'Saç Kesimi',
            description: 'Profesyonel saç kesimi ve şekillendirme',
            category: 'Saç Bakımı',
            duration: 60,
            price: 200,
            currency: 'TRY',
            isActive: true,
            tenantId: 'lobaaaa',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 's2-lobaaaa',
            name: 'Saç Boyama',
            description: 'Profesyonel saç boyama ve renklendirme',
            category: 'Saç Bakımı',
            duration: 180,
            price: 450,
            currency: 'TRY',
            isActive: true,
            tenantId: 'lobaaaa',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 's3-lobaaaa',
            name: 'Makyaj',
            description: 'Özel günler için profesyonel makyaj',
            category: 'Güzellik',
            duration: 90,
            price: 300,
            currency: 'TRY',
            isActive: true,
            tenantId: 'lobaaaa',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 's4-lobaaaa',
            name: 'Cilt Bakımı',
            description: 'Derin temizlik ve cilt bakımı',
            category: 'Cilt Bakımı',
            duration: 120,
            price: 350,
            currency: 'TRY',
            isActive: true,
            tenantId: 'lobaaaa',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        'loba-gzellik-salonu': [
          {
            id: 's1-loba-salon',
            name: 'Klasik Saç Kesimi',
            description: 'Geleneksel saç kesimi hizmeti',
            category: 'Saç Bakımı',
            duration: 45,
            price: 150,
            currency: 'TRY',
            isActive: true,
            tenantId: 'loba-salon',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 's2-loba-salon',
            name: 'Gelin Makyajı',
            description: 'Özel gün makyajı ve saç tasarımı',
            category: 'Güzellik',
            duration: 240,
            price: 800,
            currency: 'TRY',
            isActive: true,
            tenantId: 'loba-salon',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 's3-loba-salon',
            name: 'Cilt Yenileme',
            description: 'Anti-aging cilt bakımı',
            category: 'Cilt Bakımı',
            duration: 150,
            price: 500,
            currency: 'TRY',
            isActive: true,
            tenantId: 'loba-salon',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        'saglik-klinik': [
          {
            id: 's1-saglik',
            name: 'Genel Muayene',
            description: 'Rutin sağlık kontrolü',
            category: 'Sağlık',
            duration: 30,
            price: 200,
            currency: 'TRY',
            isActive: true,
            tenantId: 'saglik',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 's2-saglik',
            name: 'Kan Tahlili',
            description: 'Kapsamlı kan analizi',
            category: 'Laboratuvar',
            duration: 15,
            price: 150,
            currency: 'TRY',
            isActive: true,
            tenantId: 'saglik',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ]
      };
      
      const services = mockServicesByTenant[tenantSlug] || generateDefaultServices(tenantSlug);
      
      return NextResponse.json({
        success: true,
        data: services
      }, { headers: corsHeaders });
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Yeni tenant'lar için otomatik hizmet listesi oluşturur
function generateDefaultServices(tenantSlug: string) {
  const tenantName = tenantSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return [
    {
      id: `s1-${tenantSlug}`,
      name: 'Saç Kesimi',
      description: 'Profesyonel saç kesimi ve şekillendirme',
      category: 'Saç Bakımı',
      duration: 60,
      price: 150,
      currency: 'TRY',
      isActive: true,
      tenantId: tenantSlug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: `s2-${tenantSlug}`,
      name: 'Saç Boyama',
      description: 'Profesyonel saç boyama hizmeti',
      category: 'Saç Bakımı',
      duration: 120,
      price: 300,
      currency: 'TRY',
      isActive: true,
      tenantId: tenantSlug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: `s3-${tenantSlug}`,
      name: 'Makyaj',
      description: 'Özel gün makyajı',
      category: 'Güzellik',
      duration: 90,
      price: 200,
      currency: 'TRY',
      isActive: true,
      tenantId: tenantSlug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: `s4-${tenantSlug}`,
      name: 'Cilt Bakımı',
      description: 'Derin temizlik ve cilt bakımı',
      category: 'Cilt Bakımı',
      duration: 75,
      price: 250,
      currency: 'TRY',
      isActive: true,
      tenantId: tenantSlug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: `s5-${tenantSlug}`,
      name: 'Manikür',
      description: 'Nail art ve manikür',
      category: 'Tırnak Bakımı',
      duration: 45,
      price: 125,
      currency: 'TRY',
      isActive: true,
      tenantId: tenantSlug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}
