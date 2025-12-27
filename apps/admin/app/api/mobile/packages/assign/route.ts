import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to verify token and get user info
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userType: string;
      tenantId: string;
      staffId?: string;
      ownerId?: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// POST - Assign package to customer
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff and owners can assign packages
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { packageId, customerId, staffId, paymentType, expiresAt } = body;

    // Validation
    if (!packageId || !customerId) {
      return NextResponse.json(
        { success: false, message: 'Paket ve müşteri bilgisi gerekli' },
        { status: 400 }
      );
    }

    if (!staffId) {
      return NextResponse.json(
        { success: false, message: 'Satış yapan personel bilgisi gerekli' },
        { status: 400 }
      );
    }

    // Get package details
    const packageData = await prisma.package.findFirst({
      where: {
        id: packageId,
        tenantId: auth.tenantId,
      },
    });

    if (!packageData) {
      return NextResponse.json(
        { success: false, message: 'Paket bulunamadı' },
        { status: 404 }
      );
    }

    // Get package items
    const packageItems = await prisma.packageItem.findMany({
      where: { packageId },
    });

    // Get customer details
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId: auth.tenantId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    // Get staff details
    const staff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        tenantId: auth.tenantId,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, message: 'Personel bulunamadı' },
        { status: 404 }
      );
    }

    // Check if customer already has this package
    const existingAssignment = await prisma.customerPackage.findFirst({
      where: {
        customerId,
        packageId,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { success: false, message: 'Bu müşteriye bu paket zaten atanmış' },
        { status: 400 }
      );
    }

    // Create customer package assignment
    const customerPackage = await prisma.customerPackage.create({
      data: {
        customerId,
        packageId,
        tenantId: auth.tenantId,
        staffId: staff.id,
        staffName: `${staff.firstName} ${staff.lastName}`,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: 'active',
      },
    });

    // Create usage records for each package item
    const usages = await Promise.all(
      packageItems.map((item) =>
        prisma.customerPackageUsage.create({
          data: {
            customerPackageId: customerPackage.id,
            itemType: item.itemType,
            itemId: item.itemId,
            itemName: item.itemName,
            totalQuantity: item.quantity,
            usedQuantity: 0,
            remainingQuantity: item.quantity,
          },
        })
      )
    );

    // Record transaction in Kasa
    const today = new Date().toISOString().split('T')[0];
    await prisma.transaction.create({
      data: {
        tenantId: auth.tenantId,
        type: 'package',
        amount: packageData.price,
        description: `${packageData.name} paketi - ${customer.firstName} ${customer.lastName} (Satan: ${staff.firstName} ${staff.lastName})`,
        paymentType: paymentType || 'cash',
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        staffId: staff.id,
        staffName: `${staff.firstName} ${staff.lastName}`,
        packageId: packageData.id,
        date: today,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Paket müşteriye atandı ve ödeme kaydedildi',
      data: {
        id: customerPackage.id,
        customerId: customerPackage.customerId,
        packageId: customerPackage.packageId,
        staffName: customerPackage.staffName,
        status: customerPackage.status,
        assignedAt: customerPackage.assignedAt.toISOString(),
        expiresAt: customerPackage.expiresAt?.toISOString() || null,
        usages: usages.map((u) => ({
          id: u.id,
          itemType: u.itemType,
          itemName: u.itemName,
          totalQuantity: u.totalQuantity,
          usedQuantity: u.usedQuantity,
          remainingQuantity: u.remainingQuantity,
        })),
        package: {
          id: packageData.id,
          name: packageData.name,
          price: packageData.price,
        },
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
        },
      },
    });
  } catch (error: any) {
    console.error('Assign package error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// GET - Get assigned customers for a package or customer's packages
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get('packageId');
    const customerId = searchParams.get('customerId');

    // Get assigned customers for a specific package
    if (packageId) {
      const customerPackages = await prisma.customerPackage.findMany({
        where: {
          packageId,
          tenantId: auth.tenantId,
        },
        orderBy: { assignedAt: 'desc' },
      });

      const packageData = await prisma.package.findUnique({
        where: { id: packageId },
      });

      const results = await Promise.all(
        customerPackages.map(async (cp) => {
          const customer = await prisma.customer.findUnique({
            where: { id: cp.customerId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          });
          const usages = await prisma.customerPackageUsage.findMany({
            where: { customerPackageId: cp.id },
          });
          return {
            id: cp.id,
            customerId: cp.customerId,
            packageId: cp.packageId,
            staffId: cp.staffId,
            staffName: cp.staffName,
            status: cp.status,
            assignedAt: cp.assignedAt.toISOString(),
            expiresAt: cp.expiresAt?.toISOString() || null,
            customer,
            usages: usages.map((u) => ({
              id: u.id,
              itemType: u.itemType,
              itemName: u.itemName,
              totalQuantity: u.totalQuantity,
              usedQuantity: u.usedQuantity,
              remainingQuantity: u.remainingQuantity,
            })),
            package: packageData
              ? {
                  id: packageData.id,
                  name: packageData.name,
                  price: packageData.price,
                }
              : null,
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: results,
        total: results.length,
      });
    }

    // Get packages for a specific customer
    if (customerId) {
      const customerPackages = await prisma.customerPackage.findMany({
        where: {
          customerId,
          tenantId: auth.tenantId,
        },
        orderBy: { assignedAt: 'desc' },
      });

      const results = await Promise.all(
        customerPackages.map(async (cp) => {
          const packageData = await prisma.package.findUnique({
            where: { id: cp.packageId },
          });
          const packageItems = packageData
            ? await prisma.packageItem.findMany({
                where: { packageId: packageData.id },
              })
            : [];
          const usages = await prisma.customerPackageUsage.findMany({
            where: { customerPackageId: cp.id },
          });
          return {
            id: cp.id,
            customerId: cp.customerId,
            packageId: cp.packageId,
            staffId: cp.staffId,
            staffName: cp.staffName,
            status: cp.status,
            assignedAt: cp.assignedAt.toISOString(),
            expiresAt: cp.expiresAt?.toISOString() || null,
            package: packageData
              ? {
                  id: packageData.id,
                  name: packageData.name,
                  description: packageData.description,
                  price: packageData.price,
                  items: packageItems.map((item) => ({
                    id: item.id,
                    itemType: item.itemType,
                    itemName: item.itemName,
                    quantity: item.quantity,
                  })),
                }
              : null,
            usages: usages.map((u) => ({
              id: u.id,
              itemType: u.itemType,
              itemName: u.itemName,
              totalQuantity: u.totalQuantity,
              usedQuantity: u.usedQuantity,
              remainingQuantity: u.remainingQuantity,
            })),
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: results,
        total: results.length,
      });
    }

    return NextResponse.json(
      { success: false, message: 'packageId veya customerId parametresi gerekli' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Get package assignments error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove package assignment from customer
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff and owners can remove package assignments
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const customerPackageId = searchParams.get('customerPackageId');

    if (!customerPackageId) {
      return NextResponse.json(
        { success: false, message: 'customerPackageId parametresi gerekli' },
        { status: 400 }
      );
    }

    // Check if assignment exists and belongs to tenant
    const assignment = await prisma.customerPackage.findFirst({
      where: {
        id: customerPackageId,
        tenantId: auth.tenantId,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, message: 'Paket ataması bulunamadı' },
        { status: 404 }
      );
    }

    // Delete usage records first
    await prisma.customerPackageUsage.deleteMany({
      where: { customerPackageId },
    });

    // Delete the assignment
    await prisma.customerPackage.delete({
      where: { id: customerPackageId },
    });

    return NextResponse.json({
      success: true,
      message: 'Paket müşteriden kaldırıldı',
    });
  } catch (error: any) {
    console.error('Remove package assignment error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
