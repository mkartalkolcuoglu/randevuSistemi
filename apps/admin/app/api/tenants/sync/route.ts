import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/sqlite';

export async function POST(request: NextRequest) {
  try {
    const tenantData = await request.json();

    // Check if tenant already exists
    const existingTenant = db.prepare('SELECT id FROM tenants WHERE id = ?').get(tenantData.id);

    if (existingTenant) {
      // Update existing tenant
      const updateStmt = db.prepare(`
        UPDATE tenants SET 
          businessName = ?, slug = ?, domain = ?, username = ?, password = ?, ownerName = ?, 
          ownerEmail = ?, phone = ?, address = ?, businessType = ?, businessDescription = ?, 
          status = ?, updatedAt = ?
        WHERE id = ?
      `);
      
      updateStmt.run(
        tenantData.businessName,
        tenantData.slug,
        tenantData.domain || `${tenantData.slug}.randevu.com`,
        tenantData.username,
        tenantData.password,
        tenantData.ownerName,
        tenantData.ownerEmail,
        tenantData.phone || '',
        tenantData.address || '',
        tenantData.businessType || 'other',
        tenantData.businessDescription || '',
        tenantData.status || 'active',
        new Date().toISOString(),
        tenantData.id
      );
    } else {
      // Create new tenant
      const insertStmt = db.prepare(`
        INSERT INTO tenants (
          id, businessName, slug, domain, username, password, ownerName, ownerEmail, 
          phone, address, businessType, businessDescription, status, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertStmt.run(
        tenantData.id,
        tenantData.businessName,
        tenantData.slug,
        tenantData.domain || `${tenantData.slug}.randevu.com`,
        tenantData.username,
        tenantData.password,
        tenantData.ownerName,
        tenantData.ownerEmail,
        tenantData.phone || '',
        tenantData.address || '',
        tenantData.businessType || 'other',
        tenantData.businessDescription || '',
        tenantData.status || 'active',
        new Date().toISOString()
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tenant synced successfully'
    });
  } catch (error) {
    console.error('Error syncing tenant:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to sync tenant'
    }, { status: 500 });
  }
}