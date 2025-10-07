import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const tenantData = await request.json();

    // Parse theme data if it's a string
    let themeData = tenantData.theme;
    if (typeof themeData === 'string') {
      try {
        themeData = JSON.parse(themeData);
      } catch (error) {
        console.error('Error parsing theme data:', error);
        themeData = {};
      }
    }

    // Parse working hours data if it's a string
    let workingHoursData = tenantData.workingHours;
    if (typeof workingHoursData === 'string') {
      try {
        workingHoursData = JSON.parse(workingHoursData);
      } catch (error) {
        console.error('Error parsing working hours data:', error);
        workingHoursData = {};
      }
    }

    // Ensure theme data is properly formatted
    const processedTheme = themeData || {};
    
    // Ensure working hours data is properly formatted
    const processedWorkingHours = workingHoursData || {};

    // Check if tenant already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: tenantData.id }
    });

    if (existingTenant) {
      // Update existing tenant
      await prisma.tenant.update({
        where: { id: tenantData.id },
        data: {
          businessName: tenantData.businessName,
          slug: tenantData.slug,
          domain: tenantData.domain || `${tenantData.slug}.randevu.com`,
          username: tenantData.username,
          password: tenantData.password,
          ownerName: tenantData.ownerName,
          ownerEmail: tenantData.ownerEmail,
          phone: tenantData.phone || '',
          address: tenantData.address || '',
          businessType: tenantData.businessType || 'other',
          businessDescription: tenantData.businessDescription || '',
          status: tenantData.status || 'active',
          workingHours: JSON.stringify(processedWorkingHours),
          theme: JSON.stringify(processedTheme)
        }
      });
    } else {
      // Create new tenant
      await prisma.tenant.create({
        data: {
          id: tenantData.id,
          businessName: tenantData.businessName,
          slug: tenantData.slug,
          domain: tenantData.domain || `${tenantData.slug}.randevu.com`,
          username: tenantData.username,
          password: tenantData.password,
          ownerName: tenantData.ownerName,
          ownerEmail: tenantData.ownerEmail,
          phone: tenantData.phone || '',
          address: tenantData.address || '',
          businessType: tenantData.businessType || 'other',
          businessDescription: tenantData.businessDescription || '',
          status: tenantData.status || 'active',
          workingHours: JSON.stringify(processedWorkingHours),
          theme: JSON.stringify(processedTheme)
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Tenant synced successfully'
    });

  } catch (error) {
    console.error('Error syncing tenant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync tenant' },
      { status: 500 }
    );
  }
}