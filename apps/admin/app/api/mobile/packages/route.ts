import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
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

// GET - List all packages
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
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const search = searchParams.get('search') || '';

    // Build where clause
    const whereClause: any = {
      tenantId: auth.tenantId,
    };

    // Only show active packages by default
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    // Get packages
    const packages = await prisma.package.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Filter by search if provided
    let filteredPackages = packages;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPackages = packages.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(searchLower) ||
          pkg.description?.toLowerCase().includes(searchLower)
      );
    }

    // Get items and customer count for each package
    const packagesWithDetails = await Promise.all(
      filteredPackages.map(async (pkg) => {
        const items = await prisma.packageItem.findMany({
          where: { packageId: pkg.id },
        });
        const customerCount = await prisma.customerPackage.count({
          where: { packageId: pkg.id },
        });
        return {
          id: pkg.id,
          tenantId: pkg.tenantId,
          name: pkg.name,
          description: pkg.description,
          price: pkg.price,
          isActive: pkg.isActive,
          items: items.map((item) => ({
            id: item.id,
            itemType: item.itemType,
            itemId: item.itemId,
            itemName: item.itemName,
            quantity: item.quantity,
          })),
          customerCount,
          createdAt: pkg.createdAt.toISOString(),
          updatedAt: pkg.updatedAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: packagesWithDetails,
      total: packagesWithDetails.length,
    });
  } catch (error: any) {
    console.error('Get packages error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create a new package
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff and owners can create packages
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, price, items } = body;

    // Validation
    if (!name || !price) {
      return NextResponse.json(
        { success: false, message: 'Paket adı ve fiyatı zorunludur' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'En az bir paket içeriği ekleyin' },
        { status: 400 }
      );
    }

    // Create package
    const newPackage = await prisma.package.create({
      data: {
        tenantId: auth.tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        price: parseFloat(price),
        isActive: true,
      },
    });

    // Create items
    const createdItems = await Promise.all(
      items.map((item: any) =>
        prisma.packageItem.create({
          data: {
            packageId: newPackage.id,
            itemType: item.itemType,
            itemId: item.itemId,
            itemName: item.itemName,
            quantity: parseInt(item.quantity),
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: 'Paket oluşturuldu',
      data: {
        id: newPackage.id,
        name: newPackage.name,
        description: newPackage.description,
        price: newPackage.price,
        isActive: newPackage.isActive,
        items: createdItems.map((item) => ({
          id: item.id,
          itemType: item.itemType,
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
        })),
      },
    });
  } catch (error: any) {
    console.error('Create package error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
