import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new Response(null, { 
    status: 200, 
    headers: corsHeaders 
  });
}

// POST - Check if customer has packages by phone
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, tenantId, slug } = body;

    console.log('📞 Customer package check request:', { phone, tenantId, slug });

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası gerekli' },
        { status: 400, headers: corsHeaders }
      );
    }

    // If slug is provided instead of tenantId, find tenant first
    let actualTenantId = tenantId;
    if (!actualTenantId && slug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug }
      });
      if (tenant) {
        actualTenantId = tenant.id;
        console.log('✅ Tenant found by slug:', actualTenantId);
      }
    }

    if (!actualTenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant bilgisi bulunamadı' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find customer by phone and tenantId
    const customer = await prisma.customer.findFirst({
      where: {
        phone,
        tenantId: actualTenantId
      }
    });

    console.log('👤 Customer search result:', customer ? 'Found' : 'Not found');

    if (!customer) {
      return NextResponse.json({
        success: true,
        hasPackages: false,
        customer: null,
        packages: []
      }, { headers: corsHeaders });
    }

    // Get active packages for this customer
    const customerPackages = await prisma.customerPackage.findMany({
      where: {
        customerId: customer.id,
        tenantId: actualTenantId,
        status: 'active'
      },
      include: {
        package: {
          include: {
            items: true
          }
        },
        usages: {
          where: {
            remainingQuantity: {
              gt: 0 // Only show items with remaining quantity
            }
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    // Filter out packages with no remaining items
    const activePackages = customerPackages.filter(cp => cp.usages.length > 0);

    return NextResponse.json({
      success: true,
      hasPackages: activePackages.length > 0,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone
      },
      packages: activePackages
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error checking customer packages:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Paket kontrolü yapılırken hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  } finally {
    await prisma.$disconnect();
  }
}

