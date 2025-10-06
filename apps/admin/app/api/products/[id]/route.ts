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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
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
      tenantId = tenantSession.value;
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401, headers: corsHeaders }
      );
    }

    const data = await request.json();

    // Database bağlantısı
    const dbPath = path.join(process.cwd(), 'prisma', 'admin.db');
    const db = new Database(dbPath);

    try {
      // Ürünün bu tenant'a ait olduğunu kontrol et
      const existingProduct = db.prepare('SELECT * FROM products WHERE id = ? AND tenantId = ?').get(id, tenantId);
      
      if (!existingProduct) {
        return NextResponse.json(
          { success: false, error: 'Ürün bulunamadı' },
          { status: 404, headers: corsHeaders }
        );
      }

      const updateResult = db.prepare(`
        UPDATE products SET 
          name = ?, quantity = ?, price = ?, updatedAt = ?
        WHERE id = ? AND tenantId = ?
      `).run(
        data.name || existingProduct.name,
        data.quantity !== undefined ? parseInt(data.quantity) : existingProduct.quantity,
        data.price !== undefined ? parseFloat(data.price) : existingProduct.price,
        new Date().toISOString(),
        id,
        tenantId
      );

      if (updateResult.changes === 0) {
        return NextResponse.json(
          { success: false, error: 'Ürün güncellenemedi' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Güncellenmiş ürünü getir
      const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

      return NextResponse.json({
        success: true,
        message: 'Ürün başarıyla güncellendi',
        data: updatedProduct
      }, { headers: corsHeaders });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
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
      // Ürünün bu tenant'a ait olduğunu kontrol et
      const existingProduct = db.prepare('SELECT * FROM products WHERE id = ? AND tenantId = ?').get(id, tenantId);
      
      if (!existingProduct) {
        return NextResponse.json(
          { success: false, error: 'Ürün bulunamadı' },
          { status: 404, headers: corsHeaders }
        );
      }

      const deleteResult = db.prepare('DELETE FROM products WHERE id = ? AND tenantId = ?').run(id, tenantId);

      if (deleteResult.changes === 0) {
        return NextResponse.json(
          { success: false, error: 'Ürün silinemedi' },
          { status: 400, headers: corsHeaders }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Ürün başarıyla silindi'
      }, { headers: corsHeaders });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
