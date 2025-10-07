import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Web app admin veritabanına bağlanır
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
    
    // Tenant'ı direkt database'den bul
    const tenant = await prisma.tenant.findUnique({
      where: { slug: slug },
      select: { id: true }
    });
    
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    const tenantId = tenant.id;
    console.log('Staff API - Tenant ID:', tenantId);
    
    const staff = await prisma.staff.findMany({
      where: {
        tenantId: tenantId,
        status: 'active'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        specializations: true,
        experience: true,
        avatar: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: staff
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('Error fetching staff:', error);
    console.error('Error details:', error.message);
    return NextResponse.json(
      { success: false, error: `Internal server error: ${error.message}` },
      { status: 500, headers: corsHeaders }
    );
  }
}
