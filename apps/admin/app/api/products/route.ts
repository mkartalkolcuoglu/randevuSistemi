import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
const Database = require('better-sqlite3');
const path = require('path');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    // Session'dan tenant ID'yi al
    const cookieStore = await cookies();
    const tenantSession = cookieStore.get('tenant-session');
    
    if (!tenantSession) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    let tenantId;
    try {
      const sessionData = JSON.parse(tenantSession.value);
      tenantId = sessionData.tenantId;
    } catch (error) {
      // Fallback: assume direct tenant ID
      tenantId = tenantSession.value;
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Database bağlantısı
    const dbPath = path.join(process.cwd(), 'prisma', 'admin.db');
    const db = new Database(dbPath);

    try {
      // Bu tenant'ın ürünlerini getir
      const products = db.prepare(`
        SELECT * FROM products 
        WHERE tenantId = ? 
        ORDER BY name ASC
      `).all(tenantId);

      return NextResponse.json({
        success: true,
        data: products
      }, { headers: corsHeaders });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
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
        { status: 401, headers: corsHeaders }
      );
    }

    let tenantId;
    try {
      const sessionData = JSON.parse(tenantSession.value);
      tenantId = sessionData.tenantId;
    } catch (error) {
      // Fallback: assume direct tenant ID
      tenantId = tenantSession.value;
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401, headers: corsHeaders }
      );
    }

    const data = await request.json();

    // Validation
    if (!data.name || !data.quantity || !data.price) {
      return NextResponse.json(
        { success: false, error: 'Ürün adı, adet ve fiyat gereklidir' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Database bağlantısı
    const dbPath = path.join(process.cwd(), 'prisma', 'admin.db');
    const db = new Database(dbPath);

    try {
      const productId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      const newProduct = {
        id: productId,
        tenantId: tenantId,
        name: data.name,
        quantity: parseInt(data.quantity),
        price: parseFloat(data.price),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.prepare(`
        INSERT INTO products (id, tenantId, name, quantity, price, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newProduct.id,
        newProduct.tenantId,
        newProduct.name,
        newProduct.quantity,
        newProduct.price,
        newProduct.status,
        newProduct.createdAt,
        newProduct.updatedAt
      );

      return NextResponse.json({
        success: true,
        message: 'Ürün başarıyla eklendi',
        data: newProduct
      }, { headers: corsHeaders });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
