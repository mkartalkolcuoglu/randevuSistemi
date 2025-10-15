import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Check if customer has packages by phone
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, tenantId } = body;

    if (!phone || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası ve tenant bilgisi gerekli' },
        { status: 400 }
      );
    }

    // Find customer by phone and tenantId
    const customer = await prisma.customer.findFirst({
      where: {
        phone,
        tenantId
      }
    });

    if (!customer) {
      return NextResponse.json({
        success: true,
        hasPackages: false,
        customer: null,
        packages: []
      });
    }

    // Get active packages for this customer
    const customerPackages = await prisma.customerPackage.findMany({
      where: {
        customerId: customer.id,
        tenantId,
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
    });
  } catch (error) {
    console.error('Error checking customer packages:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Paket kontrolü yapılırken hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

