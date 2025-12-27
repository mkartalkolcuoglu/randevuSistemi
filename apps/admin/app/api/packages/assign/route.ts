import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkApiPermission } from '../../../../lib/api-auth';

const prisma = new PrismaClient();

// POST - Assign package to customer
export async function POST(request: NextRequest) {
  try {
    // Check permission (assigning package requires create permission)
    const permissionCheck = await checkApiPermission(request, 'packages', 'create');
    if (!permissionCheck.authorized) {
      return permissionCheck.error!;
    }

    const body = await request.json();
    const { packageId, customerId, tenantId, staffId, paymentType, expiresAt } = body;

    // Validation
    if (!packageId || !customerId || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'Paket, müşteri ve tenant bilgisi gerekli' },
        { status: 400 }
      );
    }

    if (!staffId) {
      return NextResponse.json(
        { success: false, error: 'Personel bilgisi gerekli' },
        { status: 400 }
      );
    }

    // Get package details
    const packageData = await prisma.package.findUnique({
      where: { id: packageId }
    });

    if (!packageData) {
      return NextResponse.json(
        { success: false, error: 'Paket bulunamadı' },
        { status: 404 }
      );
    }

    // Get package items separately (no relation in schema)
    const packageItems = await prisma.packageItem.findMany({
      where: { packageId }
    });

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

    // Get staff details
    const staff = await prisma.staff.findUnique({
      where: { id: staffId }
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Personel bulunamadı' },
        { status: 404 }
      );
    }

    // Check if customer already has this package
    const existingPackage = await prisma.customerPackage.findFirst({
      where: {
        customerId,
        packageId
      }
    });

    if (existingPackage) {
      console.error('❌ Duplicate package assignment attempt:', {
        customerId,
        packageId,
        existingPackageId: existingPackage.id
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bu müşteriye bu paket zaten atanmış. Lütfen sayfayı yenileyin.'
        },
        { status: 400 }
      );
    }

    // Create customer package assignment
    const customerPackage = await prisma.customerPackage.create({
      data: {
        customerId,
        packageId,
        tenantId,
        staffId: staff.id,
        staffName: `${staff.firstName} ${staff.lastName}`,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: 'active'
      }
    });

    // Create usages separately (no relation in schema)
    const usages = await Promise.all(
      packageItems.map(item =>
        prisma.customerPackageUsage.create({
          data: {
            customerPackageId: customerPackage.id,
            itemType: item.itemType,
            itemId: item.itemId,
            itemName: item.itemName,
            totalQuantity: item.quantity,
            usedQuantity: 0,
            remainingQuantity: item.quantity
          }
        })
      )
    );

    const customerPackageWithDetails = {
      ...customerPackage,
      usages,
      package: packageData
    };

    // Record transaction in Kasa
    const today = new Date().toISOString().split('T')[0];
    await prisma.transaction.create({
      data: {
        tenantId,
        type: 'package',
        amount: packageData.price,
        description: `${packageData.name} paketi - ${customer.firstName} ${customer.lastName} (Satan: ${staff.firstName} ${staff.lastName})`,
        paymentType: paymentType || 'cash',
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        staffId: staff.id,
        staffName: `${staff.firstName} ${staff.lastName}`,
        packageId: packageData.id,
        date: today
      }
    });

    return NextResponse.json({
      success: true,
      data: customerPackageWithDetails,
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
        orderBy: { assignedAt: 'desc' }
      });

      // Get related data separately (no relations in schema)
      const packageData = await prisma.package.findUnique({
        where: { id: packageId }
      });

      const customerPackagesWithDetails = await Promise.all(
        customerPackages.map(async (cp) => {
          const customer = await prisma.customer.findUnique({
            where: { id: cp.customerId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          });
          const usages = await prisma.customerPackageUsage.findMany({
            where: { customerPackageId: cp.id }
          });
          return {
            ...cp,
            customer,
            usages,
            package: packageData ? {
              id: packageData.id,
              name: packageData.name,
              price: packageData.price
            } : null
          };
        })
      );

      console.log('📦 Found customer packages:', customerPackagesWithDetails.length);

      return NextResponse.json({
        success: true,
        data: customerPackagesWithDetails
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
      orderBy: { assignedAt: 'desc' }
    });

    // Get related data separately (no relations in schema)
    const customerPackagesWithDetails = await Promise.all(
      customerPackages.map(async (cp) => {
        const packageData = await prisma.package.findUnique({
          where: { id: cp.packageId }
        });
        const packageItems = packageData
          ? await prisma.packageItem.findMany({
              where: { packageId: packageData.id }
            })
          : [];
        const usages = await prisma.customerPackageUsage.findMany({
          where: { customerPackageId: cp.id }
        });
        return {
          ...cp,
          package: packageData ? { ...packageData, items: packageItems } : null,
          usages
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: customerPackagesWithDetails
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

