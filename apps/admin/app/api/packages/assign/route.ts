import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Assign package to customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packageId, customerId, tenantId, paymentType, expiresAt } = body;

    // Validation
    if (!packageId || !customerId || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'Paket, müşteri ve tenant bilgisi gerekli' },
        { status: 400 }
      );
    }

    // Get package details with items
    const packageData = await prisma.package.findUnique({
      where: { id: packageId },
      include: { items: true }
    });

    if (!packageData) {
      return NextResponse.json(
        { success: false, error: 'Paket bulunamadı' },
        { status: 404 }
      );
    }

    // Get customer details
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    // Create customer package assignment
    const customerPackage = await prisma.customerPackage.create({
      data: {
        customerId,
        packageId,
        tenantId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: 'active',
        usages: {
          create: packageData.items.map(item => ({
            itemType: item.itemType,
            itemId: item.itemId,
            itemName: item.itemName,
            totalQuantity: item.quantity,
            usedQuantity: 0,
            remainingQuantity: item.quantity
          }))
        }
      },
      include: {
        usages: true,
        package: true
      }
    });

    // Record transaction in Kasa
    const today = new Date().toISOString().split('T')[0];
    await prisma.transaction.create({
      data: {
        tenantId,
        type: 'package',
        amount: packageData.price,
        description: `${packageData.name} paketi - ${customer.firstName} ${customer.lastName}`,
        paymentType: paymentType || 'cash',
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        packageId: packageData.id,
        date: today
      }
    });

    return NextResponse.json({
      success: true,
      data: customerPackage,
      message: 'Paket başarıyla müşteriye atandı ve ödeme kaydedildi'
    });
  } catch (error) {
    console.error('Error assigning package:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Paket atanırken hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET - Get customer packages or assigned customers for a package
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const tenantId = searchParams.get('tenantId');
    const packageId = searchParams.get('packageId');

    // If packageId is provided, return assigned customers for that package
    if (packageId) {
      console.log('🔍 Fetching assigned customers for packageId:', packageId);
      
      const customerPackages = await prisma.customerPackage.findMany({
        where: { packageId },
        include: {
          customer: true,
          usages: true,
          package: true
        },
        orderBy: { assignedAt: 'desc' }
      });

      console.log('📦 Found customer packages:', customerPackages.length);
      console.log('👥 Customer packages data:', JSON.stringify(customerPackages, null, 2));

      return NextResponse.json({
        success: true,
        data: customerPackages
      });
    }

    // Otherwise, return customer packages (existing behavior)
    if (!customerId && !tenantId) {
      return NextResponse.json(
        { success: false, error: 'Müşteri ID, Tenant ID veya Paket ID gerekli' },
        { status: 400 }
      );
    }

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (tenantId) where.tenantId = tenantId;

    const customerPackages = await prisma.customerPackage.findMany({
      where,
      include: {
        package: {
          include: {
            items: true
          }
        },
        usages: true
      },
      orderBy: { assignedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: customerPackages
    });
  } catch (error) {
    console.error('Error fetching customer packages:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Müşteri paketleri yüklenirken hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Remove customer package assignment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerPackageId = searchParams.get('customerPackageId');

    if (!customerPackageId) {
      return NextResponse.json(
        { success: false, error: 'Müşteri paket ID gerekli' },
        { status: 400 }
      );
    }

    // First, delete all usages
    await prisma.customerPackageUsage.deleteMany({
      where: { customerPackageId }
    });

    // Then delete the customer package
    await prisma.customerPackage.delete({
      where: { id: customerPackageId }
    });

    return NextResponse.json({
      success: true,
      message: 'Paket müşteriden başarıyla kaldırıldı'
    });
  } catch (error) {
    console.error('Error removing customer package:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Paket kaldırılırken hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

