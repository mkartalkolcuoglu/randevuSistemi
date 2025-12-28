import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to verify token
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userType: string;
      tenantId?: string;
      customerId?: string;
      phone?: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET - Get customer's active packages for a specific tenant
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    console.log('📦 Customer packages API - auth:', auth);

    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    if (auth.userType !== 'customer') {
      return NextResponse.json(
        { success: false, message: 'Bu işlem sadece müşteriler için' },
        { status: 403 }
      );
    }

    // Get tenantId from header
    const tenantId = request.headers.get('X-Tenant-ID');
    console.log('📦 Customer packages API - tenantId:', tenantId);

    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Tenant ID gerekli' },
        { status: 400 }
      );
    }

    // Get customer's phone from original record
    const originalCustomer = await prisma.customer.findUnique({
      where: { id: auth.customerId },
      select: { phone: true }
    });
    console.log('📦 Original customer:', originalCustomer);

    if (!originalCustomer?.phone) {
      console.log('📦 No phone found for original customer');
      return NextResponse.json({
        success: true,
        data: {
          hasPackages: false,
          packages: []
        }
      });
    }

    // Find customer in target tenant
    const customer = await prisma.customer.findFirst({
      where: {
        phone: originalCustomer.phone,
        tenantId: tenantId
      }
    });
    console.log('📦 Customer in target tenant:', customer);

    if (!customer) {
      console.log('📦 No customer found in target tenant');
      return NextResponse.json({
        success: true,
        data: {
          hasPackages: false,
          packages: []
        }
      });
    }

    // Get active packages for this customer in this tenant
    const customerPackages = await prisma.customerPackage.findMany({
      where: {
        customerId: customer.id,
        tenantId: tenantId,
        status: 'active'
      },
      orderBy: { assignedAt: 'desc' }
    });
    console.log('📦 Customer packages found:', customerPackages.length, customerPackages);

    // Get package details and usages for each customer package
    const packagesWithDetails = await Promise.all(
      customerPackages.map(async (cp) => {
        // Get package info
        const packageInfo = await prisma.package.findUnique({
          where: { id: cp.packageId }
        });

        // Get package items
        const packageItems = await prisma.packageItem.findMany({
          where: { packageId: cp.packageId }
        });

        // Get usage info - only items with remaining quantity
        const usages = await prisma.customerPackageUsage.findMany({
          where: {
            customerPackageId: cp.id,
            remainingQuantity: { gt: 0 }
          }
        });
        console.log('📦 Package usages for', cp.id, ':', usages.length, usages);

        return {
          id: cp.id,
          packageId: cp.packageId,
          packageName: packageInfo?.name || 'Bilinmeyen Paket',
          packageDescription: packageInfo?.description,
          assignedAt: cp.assignedAt,
          expiresAt: cp.expiresAt,
          status: cp.status,
          items: usages.map(usage => ({
            id: usage.id,
            itemType: usage.itemType,
            itemId: usage.itemId,
            itemName: usage.itemName,
            totalQuantity: usage.totalQuantity,
            usedQuantity: usage.usedQuantity,
            remainingQuantity: usage.remainingQuantity
          }))
        };
      })
    );

    // Filter out packages with no remaining items
    const activePackages = packagesWithDetails.filter(cp => cp.items.length > 0);
    console.log('📦 Active packages after filter:', activePackages.length);

    // Create a map of serviceId -> package info for easy lookup
    const servicePackageMap: Record<string, {
      packageId: string;
      packageName: string;
      usageId: string;
      remainingQuantity: number;
      customerPackageId: string;
    }> = {};

    activePackages.forEach(pkg => {
      pkg.items.forEach(item => {
        if (item.itemType === 'service') {
          servicePackageMap[item.itemId] = {
            packageId: pkg.packageId,
            packageName: pkg.packageName,
            usageId: item.id,
            remainingQuantity: item.remainingQuantity,
            customerPackageId: pkg.id
          };
        }
      });
    });

    console.log('📦 Service package map:', servicePackageMap);
    console.log('📦 Final response - hasPackages:', activePackages.length > 0);

    return NextResponse.json({
      success: true,
      data: {
        hasPackages: activePackages.length > 0,
        packages: activePackages,
        servicePackageMap
      }
    });
  } catch (error) {
    console.error('📦 Get customer packages error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
