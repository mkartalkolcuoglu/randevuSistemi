import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/sqlite';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(id);
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Transform data to include parsed JSON fields
    const responseData = {
      ...tenant,
      workingHours: (tenant as any).workingHours ? JSON.parse((tenant as any).workingHours) : null,
      theme: (tenant as any).theme ? JSON.parse((tenant as any).theme) : null
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tenant' },
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
    
    const update = db.prepare(`
      UPDATE tenants SET 
        businessName = ?, slug = ?, ownerName = ?, ownerEmail = ?, 
        phone = ?, status = ?, address = ?, businessType = ?, 
        businessDescription = ?, workingHours = ?, theme = ?, username = ?, password = ?
      WHERE id = ?
    `);

    const result = update.run(
      data.businessName,
      data.slug,
      data.ownerName,
      data.ownerEmail,
      data.phone,
      data.status,
      data.address,
      data.businessType,
      data.businessDescription,
      data.workingHours ? JSON.stringify(data.workingHours) : undefined,
      data.theme ? JSON.stringify(data.theme) : undefined,
      data.username,
      data.password,
      id
    );

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Get updated tenant
    const updatedTenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(id);

    // Transform response data
    const responseData = {
      ...updatedTenant,
      workingHours: (updatedTenant as any).workingHours ? JSON.parse((updatedTenant as any).workingHours) : null,
      theme: (updatedTenant as any).theme ? JSON.parse((updatedTenant as any).theme) : null
    };

    return NextResponse.json({
      success: true,
      message: 'Tenant updated successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update tenant' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const deleteStmt = db.prepare('DELETE FROM tenants WHERE id = ?');
    const result = deleteStmt.run(id);

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete tenant' },
      { status: 400 }
    );
  }
}