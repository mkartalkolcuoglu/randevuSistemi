import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// POST - Reorder packages (move up/down)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packageId, direction } = body; // direction: 'up' or 'down'

    if (!packageId || !direction) {
      return NextResponse.json(
        { success: false, error: 'Package ID and direction are required' },
        { status: 400 }
      );
    }

    // Get current package
    const currentPackage = await prisma.subscriptionPackage.findUnique({
      where: { id: packageId }
    });

    if (!currentPackage) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    // Get target package (to swap with)
    const targetPackage = await prisma.subscriptionPackage.findFirst({
      where: {
        displayOrder: direction === 'up' 
          ? { lt: currentPackage.displayOrder }
          : { gt: currentPackage.displayOrder }
      },
      orderBy: {
        displayOrder: direction === 'up' ? 'desc' : 'asc'
      }
    });

    if (!targetPackage) {
      return NextResponse.json(
        { success: false, error: 'Cannot move in that direction' },
        { status: 400 }
      );
    }

    // Swap display orders
    await prisma.$transaction([
      prisma.subscriptionPackage.update({
        where: { id: currentPackage.id },
        data: { displayOrder: targetPackage.displayOrder }
      }),
      prisma.subscriptionPackage.update({
        where: { id: targetPackage.id },
        data: { displayOrder: currentPackage.displayOrder }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Package order updated'
    });
  } catch (error) {
    console.error('Error reordering packages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder packages' },
      { status: 500 }
    );
  }
}

