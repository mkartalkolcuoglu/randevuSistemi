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
    const sessionCookie = cookieStore.get('tenant-session');

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

/**
 * PUT /api/tenant-info
 * Updates the current tenant's settings
 */
export async function PUT(request: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('tenant-session');

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

    const data = await request.json();
    console.log('📝 Updating tenant settings for:', tenantId);

    // Prepare update data
    const updateData: any = {
      businessName: data.businessName,
      businessType: data.businessType,
      businessDescription: data.businessDescription,
      address: data.businessAddress,
      ownerName: data.ownerName,
      ownerEmail: data.ownerEmail,
      phone: data.phone,
      username: data.username
    };

    // Convert JSON objects to strings for database storage
    if (data.workingHours) {
      updateData.workingHours = JSON.stringify(data.workingHours);
    }
    if (data.location) {
      updateData.location = JSON.stringify(data.location);
    }
    if (data.themeSettings) {
      updateData.themeSettings = JSON.stringify(data.themeSettings);
    }

    // Only update password if provided
    if (data.password && data.password.trim() !== '') {
      updateData.password = data.password;
    }

    // Update tenant in database
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData
    });

    console.log('✅ Tenant settings updated successfully');

    return NextResponse.json({
      success: true,
      data: updatedTenant
    });

  } catch (error) {
    console.error('❌ Error updating tenant settings:', error);
    return NextResponse.json(
      { success: false, error: 'Ayarlar güncellenirken hata oluştu', details: error.message },
      { status: 500 }
    );
  }
}
