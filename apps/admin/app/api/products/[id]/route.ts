import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../lib/prisma';

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

    try {
      // Ürünün bu tenant'a ait olduğunu kontrol et
      const existingProduct = await prisma.product.findFirst({
        where: {
          id: id,
          tenantId: tenantId
        }
      });
      
      if (!existingProduct) {
        return NextResponse.json(
          { success: false, error: 'Ürün bulunamadı' },
          { status: 404, headers: corsHeaders }
        );
      }

      const updatedProduct = await prisma.product.update({
        where: {
          id: id
        },
        data: {
          name: data.name || existingProduct.name,
          description: data.description !== undefined ? data.description : existingProduct.description,
          category: data.category !== undefined ? data.category : existingProduct.category,
          price: data.price !== undefined ? parseFloat(data.price) : existingProduct.price,
          cost: data.cost !== undefined ? parseFloat(data.cost) : existingProduct.cost,
          stock: (data.stock !== undefined || data.quantity !== undefined) ? parseInt(data.stock || data.quantity) : existingProduct.stock,
          minStock: data.minStock !== undefined ? parseInt(data.minStock) : existingProduct.minStock,
          barcode: data.barcode !== undefined ? data.barcode : existingProduct.barcode,
          sku: data.sku !== undefined ? data.sku : existingProduct.sku,
          supplier: data.supplier !== undefined ? data.supplier : existingProduct.supplier,
          status: data.status !== undefined ? data.status : existingProduct.status
        }
      });

      // API uyumluluğu için quantity alanını ekle
      const productWithQuantity = {
        ...updatedProduct,
        quantity: updatedProduct.stock
      };

      return NextResponse.json({
        success: true,
        message: 'Ürün başarıyla güncellendi',
        data: productWithQuantity
      }, { headers: corsHeaders });

    } catch (error) {
      console.error('Error updating product:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update product' },
        { status: 500, headers: corsHeaders }
      );
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

    try {
      // Ürünün bu tenant'a ait olduğunu kontrol et
      const existingProduct = await prisma.product.findFirst({
        where: {
          id: id,
          tenantId: tenantId
        }
      });
      
      if (!existingProduct) {
        return NextResponse.json(
          { success: false, error: 'Ürün bulunamadı' },
          { status: 404, headers: corsHeaders }
        );
      }

      await prisma.product.delete({
        where: {
          id: id
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Ürün başarıyla silindi'
      }, { headers: corsHeaders });

    } catch (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete product' },
        { status: 500, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
