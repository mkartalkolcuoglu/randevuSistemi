import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET - List all packages
export async function GET() {
  try {
    const packages = await prisma.subscriptionPackage.findMany({
      orderBy: { displayOrder: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

// POST - Create new package
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, durationDays, price, description, features, isActive, isFeatured } = body;

    // Validation
    if (!name || !slug || !durationDays) {
      return NextResponse.json(
        { success: false, error: 'Name, slug, and duration are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPackage = await prisma.subscriptionPackage.findUnique({
      where: { slug }
    });

    if (existingPackage) {
      return NextResponse.json(
        { success: false, error: 'Package with this slug already exists' },
        { status: 400 }
      );
    }

    // Get max display order
    const maxOrder = await prisma.subscriptionPackage.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    });

    const newPackage = await prisma.subscriptionPackage.create({
      data: {
        name,
        slug,
        durationDays: parseInt(durationDays),
        price: parseFloat(price) || 0,
        description,
        features: features ? JSON.stringify(features) : null,
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured || false,
        displayOrder: (maxOrder?.displayOrder || 0) + 1
      }
    });

    return NextResponse.json({
      success: true,
      data: newPackage
    });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create package' },
      { status: 500 }
    );
  }
}

