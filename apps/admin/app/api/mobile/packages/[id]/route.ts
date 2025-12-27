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

// GET - Get single package by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const pkg = await prisma.package.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!pkg) {
      return NextResponse.json(
        { success: false, message: 'Paket bulunamadı' },
        { status: 404 }
      );
    }

    // Get items
    const items = await prisma.packageItem.findMany({
      where: { packageId: pkg.id },
    });

    // Get customer count
    const customerCount = await prisma.customerPackage.count({
      where: { packageId: pkg.id },
    });

    return NextResponse.json({
      success: true,
      data: {
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
      },
    });
  } catch (error: any) {
    console.error('Get package error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Update package
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff and owners can update packages
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if package exists and belongs to tenant
    const existingPkg = await prisma.package.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingPkg) {
      return NextResponse.json(
        { success: false, message: 'Paket bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, price, isActive, items } = body;

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

    // Delete existing items
    await prisma.packageItem.deleteMany({
      where: { packageId: id },
    });

    // Update package
    const updatedPkg = await prisma.package.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: parseFloat(price),
        isActive: isActive !== undefined ? isActive : existingPkg.isActive,
      },
    });

    // Create new items
    const createdItems = await Promise.all(
      items.map((item: any) =>
        prisma.packageItem.create({
          data: {
            packageId: id,
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
      message: 'Paket güncellendi',
      data: {
        id: updatedPkg.id,
        name: updatedPkg.name,
        description: updatedPkg.description,
        price: updatedPkg.price,
        isActive: updatedPkg.isActive,
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
    console.error('Update package error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Toggle package status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff and owners can toggle package status
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if package exists and belongs to tenant
    const existingPkg = await prisma.package.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingPkg) {
      return NextResponse.json(
        { success: false, message: 'Paket bulunamadı' },
        { status: 404 }
      );
    }

    // Toggle status
    const updatedPkg = await prisma.package.update({
      where: { id },
      data: {
        isActive: !existingPkg.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: updatedPkg.isActive ? 'Paket aktif edildi' : 'Paket pasif yapıldı',
      data: {
        id: updatedPkg.id,
        isActive: updatedPkg.isActive,
      },
    });
  } catch (error: any) {
    console.error('Toggle package status error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete package
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff and owners can delete packages
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if package exists and belongs to tenant
    const existingPkg = await prisma.package.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingPkg) {
      return NextResponse.json(
        { success: false, message: 'Paket bulunamadı' },
        { status: 404 }
      );
    }

    // Check if package is assigned to any customers
    const assignedCount = await prisma.customerPackage.count({
      where: { packageId: id },
    });

    if (assignedCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Bu paket ${assignedCount} müşteriye atanmış. Önce müşteri atamalarını kaldırın.`,
        },
        { status: 400 }
      );
    }

    // Delete items first
    await prisma.packageItem.deleteMany({
      where: { packageId: id },
    });

    // Delete package
    await prisma.package.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Paket silindi',
    });
  } catch (error: any) {
    console.error('Delete package error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
