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
      where: { id: tenantId }
      // Don't use select - return all fields including theme, workingHours, etc.
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Also fetch settings (for appointmentTimeInterval)
    const settings = await prisma.settings.findUnique({
      where: { tenantId: tenantId }
    });

    // Merge tenant and settings data
    const mergedData = {
      ...tenant,
      appointmentTimeInterval: settings?.appointmentTimeInterval || 30
    };

    // Return full tenant info (including theme, workingHours, subscription, etc.)
    return NextResponse.json({
      success: true,
      data: mergedData
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
    
    // Combine themeSettings and location into theme field
    if (data.themeSettings || data.location) {
      const themeData: any = {};
      
      // Add theme settings
      if (data.themeSettings) {
        Object.assign(themeData, data.themeSettings);
      }
      
      // Add location to theme
      if (data.location) {
        themeData.location = data.location;
      }
      
      updateData.theme = JSON.stringify(themeData);
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

    // Also update or create settings (for appointmentTimeInterval)
    if (data.appointmentTimeInterval !== undefined) {
      const existingSettings = await prisma.settings.findUnique({
        where: { tenantId: tenantId }
      });

      if (existingSettings) {
        await prisma.settings.update({
          where: { tenantId: tenantId },
          data: {
            appointmentTimeInterval: parseInt(data.appointmentTimeInterval)
          }
        });
      } else {
        // Create settings if they don't exist
        await prisma.settings.create({
          data: {
            tenantId: tenantId,
            businessName: data.businessName || updatedTenant.businessName,
            appointmentTimeInterval: parseInt(data.appointmentTimeInterval)
          }
        });
      }
    }

    console.log('✅ Tenant settings updated successfully');

    return NextResponse.json({
      success: true,
      data: {
        ...updatedTenant,
        appointmentTimeInterval: data.appointmentTimeInterval || 30
      }
    });

  } catch (error) {
    console.error('❌ Error updating tenant settings:', error);
    return NextResponse.json(
      { success: false, error: 'Ayarlar güncellenirken hata oluştu', details: error.message },
      { status: 500 }
    );
  }
}
