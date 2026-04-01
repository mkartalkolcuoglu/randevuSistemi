import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';

    if (search.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const tenants = await prisma.tenant.findMany({
      where: {
        status: 'active',
        businessName: { contains: search, mode: 'insensitive' },
      },
      select: {
        id: true,
        businessName: true,
        slug: true,
        businessDescription: true,
      },
      take: 10,
      orderBy: { businessName: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: tenants.map(t => ({
        id: t.id,
        name: t.businessName,
        slug: t.slug,
        description: t.businessDescription,
      })),
    });
  } catch (error) {
    console.error('Error searching tenants:', error);
    return NextResponse.json(
      { success: false, error: 'Arama yapılırken hata oluştu' },
      { status: 500 }
    );
  }
}
