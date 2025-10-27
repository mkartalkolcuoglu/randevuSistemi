import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../lib/prisma';
import { checkApiPermission } from '../../../lib/api-auth';

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

    try {
      console.log('Prisma instance:', !!prisma);
      console.log('Prisma product model:', !!prisma?.product);
      
      // Bu tenant'ın ürünlerini getir
      const products = await prisma.product.findMany({
        where: {
          tenantId: tenantId
        },
        orderBy: {
          name: 'asc'
        }
      });

      // API uyumluluğu için quantity alanını ekle
      const productsWithQuantity = products.map(product => ({
        ...product,
        quantity: product.stock
      }));

      return NextResponse.json({
        success: true,
        data: productsWithQuantity
      }, { headers: corsHeaders });

    } catch (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch products' },
        { status: 500, headers: corsHeaders }
      );
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
    // Check permission
    const permissionCheck = await checkApiPermission(request, 'stock', 'create');
    if (!permissionCheck.authorized) {
      return permissionCheck.error!;
    }

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
    if (!data.name || (!data.stock && !data.quantity) || !data.price) {
      return NextResponse.json(
        { success: false, error: 'Ürün adı, stok ve fiyat gereklidir' },
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      const newProduct = await prisma.product.create({
        data: {
          tenantId: tenantId,
          name: data.name,
          description: data.description || '',
          category: data.category || '',
          price: parseFloat(data.price) || 0,
          cost: parseFloat(data.cost) || 0,
          stock: parseInt(data.stock || data.quantity) || 0,
          minStock: parseInt(data.minStock) || 0,
          barcode: data.barcode || '',
          sku: data.sku || '',
          supplier: data.supplier || '',
          status: data.status || 'active'
        }
      });

      // API uyumluluğu için quantity alanını ekle
      const productWithQuantity = {
        ...newProduct,
        quantity: newProduct.stock
      };

      return NextResponse.json({
        success: true,
        message: 'Ürün başarıyla eklendi',
        data: productWithQuantity
      }, { headers: corsHeaders });

    } catch (error) {
      console.error('Error creating product:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create product' },
        { status: 500, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
