import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const tenant = await prisma.tenant.findUnique({
      where: { id }
    });
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Transform data to include parsed JSON fields
    const transformedTenant = {
      ...tenant,
      workingHours: tenant.workingHours ? JSON.parse(tenant.workingHours) : {},
      theme: tenant.theme ? JSON.parse(tenant.theme) : {}
    };

    return NextResponse.json({
      success: true,
      data: transformedTenant
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        businessName: data.businessName,
        slug: data.slug,
        domain: data.domain || `${data.slug}.randevu.com`,
        username: data.username,
        password: data.password,
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        phone: data.phone || '',
        address: data.address || '',
        businessType: data.businessType || 'other',
        businessDescription: data.businessDescription || '',
        status: data.status || 'active',
        workingHours: JSON.stringify(data.workingHours || {}),
        theme: JSON.stringify(data.theme || {})
      }
    });

    // Sync to admin panel
    try {
      const adminResponse = await fetch('http://localhost:3001/api/tenants/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          id: updatedTenant.id,
          domain: updatedTenant.domain
        })
      });

      if (!adminResponse.ok) {
        console.error('Failed to sync to admin panel:', await adminResponse.text());
      }
    } catch (syncError) {
      console.error('Error syncing to admin panel:', syncError);
    }

    return NextResponse.json({
      success: true,
      data: updatedTenant,
      message: 'Tenant updated successfully'
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.tenant.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}