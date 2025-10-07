import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    console.log('🔍 Fetching tenant with slug:', slug);
    
    // Tenant'ı database'den bul
    const tenant = await prisma.tenant.findUnique({
      where: { slug: slug },
      select: {
        id: true,
        businessName: true,
        slug: true,
        businessDescription: true,
        address: true,
        phone: true,
        ownerEmail: true,
        businessType: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log('🔍 Found tenant:', tenant);
    
    if (!tenant) {
      console.log('❌ Tenant not found for slug:', slug);
      return NextResponse.json({
        success: false,
        error: `Tenant not found: ${slug}`
      }, { 
        status: 404, 
        headers: corsHeaders 
      });
    }
    
    // Tenant data'yı frontend format'ına çevir
    const tenantData = {
      id: tenant.id,
      name: tenant.businessName,
      slug: tenant.slug,
      description: tenant.businessDescription || '',
      contactEmail: tenant.ownerEmail || '',
      contactPhone: tenant.phone || '',
      address: tenant.address || '',
      isActive: tenant.status === 'active',
      createdAt: tenant.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: tenant.updatedAt?.toISOString() || new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: tenantData
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  } finally {
    await prisma.$disconnect();
  }
}
