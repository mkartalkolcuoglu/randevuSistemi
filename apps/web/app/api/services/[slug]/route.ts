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
    
      // Admin API'sinden tenant bilgisini al
      const tenantResponse = await fetch(`http://localhost:3000/api/tenant-settings/${slug}`);
      if (!tenantResponse.ok) {
        return NextResponse.json(
          { success: false, error: 'Tenant not found' },
          { status: 404, headers: corsHeaders }
        );
      }
    
    const responseText = await tenantResponse.text();
    let tenantData;
    try {
      tenantData = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse tenant response:', responseText);
      return NextResponse.json(
        { success: false, error: 'Invalid tenant response' },
        { status: 500, headers: corsHeaders }
      );
    }
    if (!tenantData.success || !tenantData.data?.tenant?.id) {
      return NextResponse.json(
        { success: false, error: 'Tenant data invalid' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    const tenantId = tenantData.data.tenant.id;
    console.log('Services API - Tenant ID:', tenantId);
    
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
        status: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: services
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('Error fetching services:', error);
    console.error('Error details:', error.message);
    return NextResponse.json(
      { success: false, error: `Internal server error: ${error.message}` },
      { status: 500, headers: corsHeaders }
    );
  }
}
