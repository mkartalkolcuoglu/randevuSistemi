import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        businesses: []
      });
    }

    // Search for businesses by name
    const tenants = await prisma.tenant.findMany({
      where: {
        AND: [
          {
            businessName: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            status: 'active'
          }
        ]
      },
      select: {
        slug: true,
        businessName: true,
        address: true,
        phone: true
      },
      take: 10,
      orderBy: {
        businessName: 'asc'
      }
    });

    const businesses = tenants.map(t => ({
      slug: t.slug,
      name: t.businessName,
      address: t.address || '',
      phone: t.phone || ''
    }));

    return NextResponse.json({
      success: true,
      businesses
    });

  } catch (error) {
    console.error('Business search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'İşletmeler aranırken bir hata oluştu',
        businesses: []
      },
      { status: 500 }
    );
  }
}
