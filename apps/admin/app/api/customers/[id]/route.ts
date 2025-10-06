import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
const Database = require('better-sqlite3');
const path = require('path');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü
    const cookieStore = await cookies();
    const tenantSession = cookieStore.get('tenant-session');
    
    if (!tenantSession) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessionData = JSON.parse(tenantSession.value);
    const tenantId = sessionData.tenantId;
    const { id } = await params;
    
    // SQLite veritabanı bağlantısı
    const dbPath = path.resolve(process.cwd(), 'prisma', 'admin.db');
    const db = new Database(dbPath);
    
    const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND tenantId = ?').get(id, tenantId);
    
    db.close();
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü
    const cookieStore = await cookies();
    const tenantSession = cookieStore.get('tenant-session');
    
    if (!tenantSession) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessionData = JSON.parse(tenantSession.value);
    const tenantId = sessionData.tenantId;
    const { id } = await params;
    const data = await request.json();
    
    // SQLite veritabanı bağlantısı
    const dbPath = path.resolve(process.cwd(), 'prisma', 'admin.db');
    const db = new Database(dbPath);
    
    const update = db.prepare(`
      UPDATE customers 
      SET firstName = ?, lastName = ?, email = ?, phone = ?, dateOfBirth = ?, 
          gender = ?, address = ?, notes = ?, status = ?, updatedAt = ?
      WHERE id = ? AND tenantId = ?
    `);

    const result = update.run(
      data.firstName || '',
      data.lastName || '',
      data.email || '',
      data.phone || '',
      data.dateOfBirth || null,
      data.gender || null,
      data.address || '',
      data.notes || '',
      data.status || 'active',
      new Date().toISOString(),
      id,
      tenantId
    );

    if (result.changes === 0) {
      db.close();
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Güncellenmiş müşteriyi getir
    const updatedCustomer = db.prepare('SELECT * FROM customers WHERE id = ? AND tenantId = ?').get(id, tenantId);
    
    db.close();

    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü
    const cookieStore = await cookies();
    const tenantSession = cookieStore.get('tenant-session');
    
    if (!tenantSession) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessionData = JSON.parse(tenantSession.value);
    const tenantId = sessionData.tenantId;
    const { id } = await params;
    
    // SQLite veritabanı bağlantısı
    const dbPath = path.resolve(process.cwd(), 'prisma', 'admin.db');
    const db = new Database(dbPath);
    
    const deleteStmt = db.prepare('DELETE FROM customers WHERE id = ? AND tenantId = ?');
    const result = deleteStmt.run(id, tenantId);
    
    db.close();

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 400 }
    );
  }
}