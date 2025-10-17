import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tenant-info
 * Returns the current tenant's subscription information from local database
 */
export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('admin-session');

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    const tenantId = session.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID not found in session' },
        { status: 400 }
      );
    }

    // Fetch tenant info from local admin database
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        businessName: true,
        status: true,
        subscriptionPlan: true,
        subscriptionStart: true,
        subscriptionEnd: true
      }
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Return tenant info with subscription fields
    return NextResponse.json({
      success: true,
      data: tenant
    });

  } catch (error) {
    console.error('Error fetching tenant info:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
