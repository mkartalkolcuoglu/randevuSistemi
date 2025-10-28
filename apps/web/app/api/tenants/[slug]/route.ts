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
        workingHours: true, // ✅ Added for working hours functionality
        createdAt: true
        // Note: Web DB Tenant model doesn't have updatedAt field
      }
    });
    
    console.log('🔍 Found tenant:', tenant);
    console.log('🕒 CRITICAL: tenant.workingHours from DB (Web DB):', tenant?.workingHours, typeof tenant?.workingHours);
    
    // ✅ CRITICAL FIX: If workingHours is empty in Web DB, fetch from Admin API
    let finalWorkingHours = tenant?.workingHours;
    
    if (!finalWorkingHours && tenant) {
      console.log('⚠️ workingHours empty in Web DB, fetching from Admin API...');
      try {
        const adminApiUrl = `https://admin.netrandevu.com/api/public/tenant/${slug}`;
        console.log('📡 Fetching from Admin API:', adminApiUrl);
        
        const adminResponse = await fetch(adminApiUrl, {
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });
        
        if (adminResponse.ok) {
          const adminData = await adminResponse.json();
          if (adminData.success && adminData.data?.workingHours) {
            finalWorkingHours = adminData.data.workingHours;
            console.log('✅ Got workingHours from Admin API:', typeof finalWorkingHours);
          }
        } else {
          console.warn('⚠️ Admin API returned:', adminResponse.status);
        }
      } catch (error) {
        console.error('❌ Error fetching from Admin API:', error);
      }
    }
    
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
      workingHours: finalWorkingHours || null, // ✅ Include working hours (from Web DB or Admin API fallback)
      isActive: tenant.status === 'active',
      createdAt: tenant.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: tenant.updatedAt?.toISOString() || new Date().toISOString()
    };
    
    console.log('📦 Final tenantData.workingHours:', finalWorkingHours ? 'HAS DATA ✅' : 'EMPTY ❌');
    
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
