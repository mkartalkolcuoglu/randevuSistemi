import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

/**
 * GET /api/public/check-blacklist?phone=5551234567&tenantSlug=ayse-kuafor
 * Check if a phone number is blacklisted for a specific tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const tenantSlug = searchParams.get('tenantSlug');

    if (!phone || !tenantSlug) {
      return NextResponse.json(
        { success: false, error: 'Phone and tenantSlug are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('🔍 [BLACKLIST CHECK] Phone:', phone, 'Tenant:', tenantSlug);

    // Get tenant ID from slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true }
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if customer with this phone is blacklisted
    const customer = await prisma.customer.findFirst({
      where: {
        phone: phone,
        tenantId: tenant.id
      },
      select: {
        isBlacklisted: true,
        noShowCount: true
      }
    });

    const isBlacklisted = customer?.isBlacklisted || false;
    const noShowCount = customer?.noShowCount || 0;

    console.log('📊 [BLACKLIST CHECK] Result:', { isBlacklisted, noShowCount });

    return NextResponse.json({
      success: true,
      isBlacklisted,
      noShowCount
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ [BLACKLIST CHECK] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  } finally {
    await prisma.$disconnect();
  }
}

