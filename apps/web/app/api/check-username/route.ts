import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

/**
 * Check if username is available
 *
 * GET /api/check-username?username=XXX
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({
        success: false,
        error: 'Username is required'
      }, { status: 400 });
    }

    // Kullanıcı adını normalize et (küçük harf, trim)
    const normalizedUsername = username.toLowerCase().trim();

    // Check if username exists in Tenant table
    const existingTenant = await prisma.tenant.findUnique({
      where: { username: normalizedUsername },
      select: { id: true, username: true }
    });

    if (existingTenant) {
      return NextResponse.json({
        success: true,
        available: false,
        message: 'Bu kullanıcı adı daha önce alınmış'
      });
    }

    return NextResponse.json({
      success: true,
      available: true,
      message: 'Kullanıcı adı müsait'
    });

  } catch (error) {
    console.error('❌ [CHECK USERNAME] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Kullanıcı adı kontrolü yapılırken bir hata oluştu'
    }, { status: 500 });
  }
}
