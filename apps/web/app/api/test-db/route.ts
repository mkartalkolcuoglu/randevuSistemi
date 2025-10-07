import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('🔍 Testing database connection...');
    
    // 1. Basit connection test
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // 2. Tenant tablosu var mı?
    const tenantCount = await prisma.tenant.count();
    console.log('✅ Tenant table exists, count:', tenantCount);
    
    // 3. İlk birkaç tenant'ı listele
    const tenants = await prisma.tenant.findMany({
      take: 5,
      select: {
        id: true,
        slug: true,
        businessName: true,
        status: true
      }
    });
    console.log('✅ Found tenants:', tenants);
    
    // 4. loba-spa var mı?
    const lobaSpa = await prisma.tenant.findUnique({
      where: { slug: 'loba-spa' },
      select: {
        id: true,
        slug: true,
        businessName: true,
        status: true
      }
    });
    console.log('✅ loba-spa tenant:', lobaSpa);
    
    return NextResponse.json({
      success: true,
      message: 'Database test successful',
      data: {
        connected: true,
        tenantCount,
        allTenants: tenants,
        lobaSpa: lobaSpa
      }
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: {
        name: error.name,
        message: error.message,
        code: error.code
      }
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}
