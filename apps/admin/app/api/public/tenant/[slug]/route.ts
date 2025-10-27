import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// CORS headers for cross-origin requests from Web App
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

/**
 * PUBLIC API: Get tenant data by slug (for Web App to access Admin DB)
 * This endpoint allows Web App to fetch tenant settings from Admin DB
 * when Web DB doesn't have the data yet.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    console.log('🌐 PUBLIC API: Fetching tenant with slug:', slug);
    
    // Fetch tenant from Admin DB
    const tenant = await prisma.tenant.findUnique({
      where: { slug: slug },
      select: {
        id: true,
        businessName: true,
        slug: true,
        businessDescription: true,
        workingHours: true, // ⭐ Critical: workingHours from Admin DB
        theme: true,
        createdAt: true
        // Note: Tenant model doesn't have updatedAt field in Admin DB
      }
    });
    
    if (!tenant) {
      console.log('❌ PUBLIC API: Tenant not found for slug:', slug);
      return NextResponse.json({
        success: false,
        error: `Tenant not found: ${slug}`
      }, { 
        status: 404, 
        headers: corsHeaders 
      });
    }
    
    console.log('✅ PUBLIC API: Found tenant:', tenant.businessName);
    console.log('🕒 PUBLIC API: workingHours:', tenant.workingHours ? 'HAS DATA' : 'EMPTY');
    
    // Return tenant data
    const tenantData = {
      id: tenant.id,
      businessName: tenant.businessName,
      slug: tenant.slug,
      businessDescription: tenant.businessDescription || '',
      workingHours: tenant.workingHours || null, // ⭐ This is the critical field
      theme: tenant.theme || null,
      createdAt: tenant.createdAt?.toISOString() || new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: tenantData
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('❌ PUBLIC API Error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

