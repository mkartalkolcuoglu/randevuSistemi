import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
const Database = require('better-sqlite3');
const path = require('path');

export async function GET(request: NextRequest) {
  try {
    // Session'dan tenant ID'yi al
    const cookieStore = await cookies();
    const tenantSession = cookieStore.get('tenant-session');
    
    if (!tenantSession) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let tenantId;
    try {
      const sessionData = JSON.parse(tenantSession.value);
      tenantId = sessionData.tenantId;
    } catch (error) {
      tenantId = tenantSession.value;
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';


    // Database bağlantısı
    const dbPath = path.join(process.cwd(), 'prisma', 'admin.db');
    const db = new Database(dbPath);

    try {
      // Build SQL query
      let whereClause = 'WHERE tenantId = ?';
      let params = [tenantId];
      
      if (search) {
        whereClause += ' AND (firstName LIKE ? OR lastName LIKE ? OR email LIKE ? OR phone LIKE ?)';
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }
      
      if (status !== 'all') {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM customers ${whereClause}`;
      const totalResult = db.prepare(countQuery).get(...params);
      const total = totalResult.total;

      // Get paginated data
      const offset = (page - 1) * limit;
      const dataQuery = `SELECT * FROM customers ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
      const customers = db.prepare(dataQuery).all(...params, limit, offset);

      return NextResponse.json({
        success: true,
        data: customers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });

    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Session'dan tenant ID'yi al
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

    const data = await request.json();
    
    // SQLite veritabanı bağlantısı
    const dbPath = path.resolve(process.cwd(), 'prisma', 'admin.db');
    const db = new Database(dbPath);

    // Müşteri oluştur
    const id = `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const insert = db.prepare(`
      INSERT INTO customers (id, tenantId, firstName, lastName, email, phone, dateOfBirth, gender, address, notes, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      id,
      tenantId,
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
      new Date().toISOString()
    );

    const newCustomer = {
      id,
      tenantId,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phone: data.phone || '',
      dateOfBirth: data.dateOfBirth || null,
      gender: data.gender || null,
      address: data.address || '',
      notes: data.notes || '',
      status: data.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.close();

    return NextResponse.json({ 
      success: true, 
      data: newCustomer 
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 400 }
    );
  }
}