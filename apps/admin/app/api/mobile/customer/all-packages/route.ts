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

// GET - Get all customer packages from all tenants
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
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

    // Get customer's phone from original record
    const originalCustomer = await prisma.customer.findUnique({
      where: { id: auth.customerId },
      select: { phone: true }
    });

    if (!originalCustomer?.phone) {
      return NextResponse.json({
        success: true,
        data: {
          packages: [],
          totalPackages: 0
        }
      });
    }

    // Find all customer records with this phone (across all tenants)
    const allCustomerRecords = await prisma.customer.findMany({
      where: { phone: originalCustomer.phone },
      select: { id: true, tenantId: true }
    });

    const customerIds = allCustomerRecords.map(c => c.id);

    // Get all active packages for these customers
    const customerPackages = await prisma.customerPackage.findMany({
      where: {
        customerId: { in: customerIds },
        status: 'active'
      },
      orderBy: { assignedAt: 'desc' }
    });

    // Get package details and usages for each customer package
    const packagesWithDetails = await Promise.all(
      customerPackages.map(async (cp) => {
        // Get package info
        const packageInfo = await prisma.package.findUnique({
          where: { id: cp.packageId }
        });

        // Get tenant info
        const tenant = await prisma.tenant.findUnique({
          where: { id: cp.tenantId },
          select: { id: true, businessName: true, slug: true, logo: true }
        });

        // Get usage info - only items with remaining quantity
        const usages = await prisma.customerPackageUsage.findMany({
          where: {
            customerPackageId: cp.id,
            remainingQuantity: { gt: 0 }
          }
        });

        // Map usages to items - using itemId and itemName from schema
        const usageItems = usages.map((usage) => ({
          id: usage.id,
          serviceId: usage.itemId,
          serviceName: usage.itemName || 'Bilinmeyen Hizmet',
          totalQuantity: usage.totalQuantity,
          usedQuantity: usage.usedQuantity,
          remainingQuantity: usage.remainingQuantity
        }));

        return {
          id: cp.id,
          packageId: cp.packageId,
          packageName: packageInfo?.name || 'Bilinmeyen Paket',
          packageDescription: packageInfo?.description,
          tenant: tenant,
          assignedAt: cp.assignedAt,
          expiresAt: cp.expiresAt,
          status: cp.status,
          items: usageItems
        };
      })
    );

    // Filter out packages with no remaining items
    const activePackages = packagesWithDetails.filter(cp => cp.items.length > 0);

    // Group by tenant
    const packagesByTenant: Record<string, any[]> = {};
    activePackages.forEach(pkg => {
      const tenantId = pkg.tenant?.id || 'unknown';
      if (!packagesByTenant[tenantId]) {
        packagesByTenant[tenantId] = [];
      }
      packagesByTenant[tenantId].push(pkg);
    });

    return NextResponse.json({
      success: true,
      data: {
        packages: activePackages,
        packagesByTenant,
        totalPackages: activePackages.length
      }
    });
  } catch (error) {
    console.error('Get all customer packages error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
