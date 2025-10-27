import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkApiPermission } from '../../../lib/api-auth';

const prisma = new PrismaClient();

// GET - List all packages for a tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID gerekli' },
        { status: 400 }
      );
    }

    const packages = await prisma.package.findMany({
      where: { tenantId },
      include: {
        items: true,
        _count: {
          select: { customerPackages: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Paketler yüklenirken hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create a new package
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const permissionCheck = await checkApiPermission(request, 'packages', 'create');
    if (!permissionCheck.authorized) {
      return permissionCheck.error!;
    }

    const body = await request.json();
    const { tenantId, name, description, price, items } = body;

    // Validation
    if (!tenantId || !name || !price || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tüm zorunlu alanları doldurun' },
        { status: 400 }
      );
    }

    // Create package with items
    const newPackage = await prisma.package.create({
      data: {
        tenantId,
        name,
        description: description || null,
        price: parseFloat(price),
        items: {
          create: items.map((item: any) => ({
            itemType: item.itemType,
            itemId: item.itemId,
            itemName: item.itemName,
            quantity: parseInt(item.quantity)
          }))
        }
      },
      include: {
        items: true
      }
    });

    return NextResponse.json({
      success: true,
      data: newPackage,
      message: 'Paket başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Paket oluşturulurken hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update a package
export async function PUT(request: NextRequest) {
  try {
    // Check permission
    const permissionCheck = await checkApiPermission(request, 'packages', 'update');
    if (!permissionCheck.authorized) {
      return permissionCheck.error!;
    }

    const body = await request.json();
    const { id, name, description, price, items, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Paket ID gerekli' },
        { status: 400 }
      );
    }

    // Delete existing items and create new ones
    await prisma.packageItem.deleteMany({
      where: { packageId: id }
    });

    const updatedPackage = await prisma.package.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        isActive: isActive !== undefined ? isActive : true,
        items: {
          create: items.map((item: any) => ({
            itemType: item.itemType,
            itemId: item.itemId,
            itemName: item.itemName,
            quantity: parseInt(item.quantity)
          }))
        }
      },
      include: {
        items: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedPackage,
      message: 'Paket başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Paket güncellenirken hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete a package
export async function DELETE(request: NextRequest) {
  try {
    // Check permission
    const permissionCheck = await checkApiPermission(request, 'packages', 'delete');
    if (!permissionCheck.authorized) {
      return permissionCheck.error!;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Paket ID gerekli' },
        { status: 400 }
      );
    }

    // Check if package is assigned to any customers
    const assignedCount = await prisma.customerPackage.count({
      where: { packageId: id }
    });

    if (assignedCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Bu paket ${assignedCount} müşteriye atanmış. Önce müşteri atamalarını kaldırın.` 
        },
        { status: 400 }
      );
    }

    await prisma.package.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Paket başarıyla silindi'
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Paket silinirken hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

