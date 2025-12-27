import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to verify token and get user info
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userType: string;
      tenantId: string;
      staffId?: string;
      ownerId?: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET - Get single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Ürün bulunamadı' },
        { status: 404 }
      );
    }

    // Calculate stock status
    let stockStatus = 'inStock';
    if (product.stock === 0) {
      stockStatus = 'outOfStock';
    } else if (product.stock <= (product.minStock || 5)) {
      stockStatus = 'lowStock';
    }

    return NextResponse.json({
      success: true,
      data: {
        id: product.id,
        tenantId: product.tenantId,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        minStock: product.minStock,
        barcode: product.barcode,
        sku: product.sku,
        supplier: product.supplier,
        status: product.status,
        stockStatus,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Get product error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff and owners can update products
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if product exists and belongs to tenant
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: 'Ürün bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      price,
      cost,
      stock,
      minStock,
      barcode,
      sku,
      supplier,
      status,
    } = body;

    // Validation
    if (!name || stock === undefined || price === undefined) {
      return NextResponse.json(
        { success: false, message: 'Ürün adı, stok ve fiyat zorunludur' },
        { status: 400 }
      );
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description !== undefined ? (description?.trim() || null) : existingProduct.description,
        category: category !== undefined ? (category?.trim() || null) : existingProduct.category,
        price: parseFloat(price) || 0,
        cost: cost !== undefined ? (parseFloat(cost) || 0) : existingProduct.cost,
        stock: parseInt(stock) || 0,
        minStock: minStock !== undefined ? (parseInt(minStock) || 0) : existingProduct.minStock,
        barcode: barcode !== undefined ? (barcode?.trim() || null) : existingProduct.barcode,
        sku: sku !== undefined ? (sku?.trim() || null) : existingProduct.sku,
        supplier: supplier !== undefined ? (supplier?.trim() || null) : existingProduct.supplier,
        status: status || existingProduct.status,
      },
    });

    // Calculate stock status
    let stockStatus = 'inStock';
    if (updatedProduct.stock === 0) {
      stockStatus = 'outOfStock';
    } else if (updatedProduct.stock <= (updatedProduct.minStock || 5)) {
      stockStatus = 'lowStock';
    }

    return NextResponse.json({
      success: true,
      message: 'Ürün güncellendi',
      data: {
        ...updatedProduct,
        stockStatus,
        createdAt: updatedProduct.createdAt.toISOString(),
        updatedAt: updatedProduct.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Update product error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update stock quantity or toggle status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff and owners can update products
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if product exists and belongs to tenant
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: 'Ürün bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action, quantity, status } = body;

    let updateData: any = {};
    let message = '';

    // Handle different actions
    if (action === 'addStock') {
      // Add stock
      updateData.stock = existingProduct.stock + (parseInt(quantity) || 0);
      message = `Stok eklendi (+${quantity})`;
    } else if (action === 'removeStock') {
      // Remove stock
      const newStock = existingProduct.stock - (parseInt(quantity) || 0);
      updateData.stock = Math.max(0, newStock);
      message = `Stok düşüldü (-${quantity})`;
    } else if (action === 'setStock') {
      // Set exact stock
      updateData.stock = parseInt(quantity) || 0;
      message = `Stok güncellendi (${quantity})`;
    } else if (action === 'toggleStatus') {
      // Toggle status
      updateData.status = existingProduct.status === 'active' ? 'inactive' : 'active';
      message = updateData.status === 'active' ? 'Ürün aktif edildi' : 'Ürün pasif yapıldı';
    } else if (status !== undefined) {
      // Set status directly
      updateData.status = status;
      message = status === 'active' ? 'Ürün aktif edildi' : 'Ürün pasif yapıldı';
    } else {
      return NextResponse.json(
        { success: false, message: 'Geçersiz işlem' },
        { status: 400 }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    // Calculate stock status
    let stockStatus = 'inStock';
    if (updatedProduct.stock === 0) {
      stockStatus = 'outOfStock';
    } else if (updatedProduct.stock <= (updatedProduct.minStock || 5)) {
      stockStatus = 'lowStock';
    }

    return NextResponse.json({
      success: true,
      message,
      data: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        stock: updatedProduct.stock,
        status: updatedProduct.status,
        stockStatus,
      },
    });
  } catch (error: any) {
    console.error('Patch product error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff and owners can delete products
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if product exists and belongs to tenant
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: 'Ürün bulunamadı' },
        { status: 404 }
      );
    }

    // Delete product
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Ürün silindi',
    });
  } catch (error: any) {
    console.error('Delete product error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
