import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    // Check if slug exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true }
    });

    return NextResponse.json({
      exists: !!existingTenant,
      slug: slug
    });

  } catch (error) {
    console.error('Error checking slug:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

