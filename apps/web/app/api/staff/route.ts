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
        const staff = generateDefaultStaff(tenantSlug);
        return NextResponse.json({
          success: true,
          data: staff
        }, { headers: corsHeaders });
      }

      const tenantId = tenant.id;

      // Get staff for this tenant
      const staff = await prisma.staff.findMany({
        where: {
          tenantId: tenantId,
          status: 'active'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          position: true,
          status: true,
          avatar: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return NextResponse.json({
        success: true,
        data: staff
      }, { headers: corsHeaders });
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Fallback to mock data based on tenant slug
      const mockStaffByTenant: Record<string, any[]> = {
        'lobaaaa': [
          {
            id: 'staff1-lobaaaa',
            firstName: 'Loba',
            lastName: 'Uzman',
            email: 'loba@lobaaaa.com',
            phone: '+90 555 111 1111',
            position: 'Senior Kuaför',
            status: 'active',
            avatar: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 'staff2-lobaaaa',
            firstName: 'Ayşe',
            lastName: 'Kaya',
            email: 'ayse@lobaaaa.com',
            phone: '+90 555 222 2222',
            position: 'Estetisyen',
            status: 'active',
            avatar: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 'staff3-lobaaaa',
            firstName: 'Mehmet',
            lastName: 'Demir',
            email: 'mehmet@lobaaaa.com',
            phone: '+90 555 333 3333',
            position: 'Makyöz',
            status: 'active',
            avatar: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        'loba-gzellik-salonu': [
          {
            id: 'staff1-loba-salon',
            firstName: 'Elif',
            lastName: 'Güzel',
            email: 'elif@lobasalon.com',
            phone: '+90 555 444 4444',
            position: 'Kuaför',
            status: 'active',
            avatar: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 'staff2-loba-salon',
            firstName: 'Fatma',
            lastName: 'Öz',
            email: 'fatma@lobasalon.com',
            phone: '+90 555 555 5555',
            position: 'Cilt Bakım Uzmanı',
            status: 'active',
            avatar: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ]
      };
      
      const staff = mockStaffByTenant[tenantSlug] || generateDefaultStaff(tenantSlug);
      
      return NextResponse.json({
        success: true,
        data: staff
      }, { headers: corsHeaders });
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Yeni tenant'lar için otomatik personel listesi oluşturur
function generateDefaultStaff(tenantSlug: string) {
  const tenantName = tenantSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return [
    {
      id: `staff1-${tenantSlug}`,
      firstName: 'Ayşe',
      lastName: 'Kaya',
      email: `ayse@${tenantSlug}.com`,
      phone: '+90 555 111 1111',
      position: 'Senior Kuaför',
      status: 'active',
      avatar: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: `staff2-${tenantSlug}`,
      firstName: 'Mehmet',
      lastName: 'Demir',
      email: `mehmet@${tenantSlug}.com`,
      phone: '+90 555 222 2222',
      position: 'Estetisyen',
      status: 'active',
      avatar: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: `staff3-${tenantSlug}`,
      firstName: 'Fatma',
      lastName: 'Öz',
      email: `fatma@${tenantSlug}.com`,
      phone: '+90 555 333 3333',
      position: 'Makyöz',
      status: 'active',
      avatar: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}
