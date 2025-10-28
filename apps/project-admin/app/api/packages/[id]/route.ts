import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// GET - Get single package
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const packageData = await prisma.subscriptionPackage.findUnique({
      where: { id }
    });

    if (!packageData) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: packageData
    });
  } catch (error) {
    console.error('Error fetching package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch package' },
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
    const { id } = await params;
    const body = await request.json();
    const { name, slug, durationDays, price, description, features, isActive, isFeatured } = body;

    // Check if package exists
    const existingPackage = await prisma.subscriptionPackage.findUnique({
      where: { id }
    });

    if (!existingPackage) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    // Check if slug is taken by another package
    if (slug && slug !== existingPackage.slug) {
      const slugTaken = await prisma.subscriptionPackage.findUnique({
        where: { slug }
      });

      if (slugTaken) {
        return NextResponse.json(
          { success: false, error: 'Package with this slug already exists' },
          { status: 400 }
        );
      }
    }

    const updatedPackage = await prisma.subscriptionPackage.update({
      where: { id },
      data: {
        name,
        slug,
        durationDays: durationDays ? parseInt(durationDays) : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        description,
        features: features ? JSON.stringify(features) : undefined,
        isActive,
        isFeatured
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedPackage
    });
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update package' },
      { status: 500 }
    );
  }
}

// DELETE - Delete package (with tenant check - Seçenek A)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if package exists
    const packageData = await prisma.subscriptionPackage.findUnique({
      where: { id }
    });

    if (!packageData) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    // Check if any tenants are using this package (Seçenek A)
    const tenantsUsingPackage = await prisma.tenant.count({
      where: {
        subscriptionPlan: packageData.slug
      }
    });

    if (tenantsUsingPackage > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bu paket silinemez',
          details: `${tenantsUsingPackage} adet işletme bu paketi kullanıyor. Paketi silmeden önce bu işletmelerin paketlerini değiştirmeniz gerekmektedir.`,
          tenantsCount: tenantsUsingPackage
        },
        { status: 409 } // 409 Conflict
      );
    }

    await prisma.subscriptionPackage.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete package' },
      { status: 500 }
    );
  }
}

