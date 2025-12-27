import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
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

// GET - Get all products for tenant
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active', 'inactive', 'lowStock', 'outOfStock'
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      tenantId: auth.tenantId,
    };

    // Filter by status
    if (status === 'active') {
      where.status = 'active';
    } else if (status === 'inactive') {
      where.status = 'inactive';
    } else if (status === 'lowStock') {
      where.stock = { gt: 0, lte: 5 }; // Low stock: 1-5
    } else if (status === 'outOfStock') {
      where.stock = 0;
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Search by name, barcode, sku
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // Calculate stock status for each product
    const productsWithStatus = products.map((product) => {
      let stockStatus = 'inStock';
      if (product.stock === 0) {
        stockStatus = 'outOfStock';
      } else if (product.stock <= (product.minStock || 5)) {
        stockStatus = 'lowStock';
      }

      return {
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
      };
    });

    // Calculate statistics
    const stats = {
      total: products.length,
      active: products.filter((p) => p.status === 'active').length,
      inactive: products.filter((p) => p.status === 'inactive').length,
      inStock: products.filter((p) => p.stock > (p.minStock || 5)).length,
      lowStock: products.filter((p) => p.stock > 0 && p.stock <= (p.minStock || 5)).length,
      outOfStock: products.filter((p) => p.stock === 0).length,
    };

    // Get unique categories
    const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

    return NextResponse.json({
      success: true,
      data: productsWithStatus,
      stats,
      categories,
      total: products.length,
    });
  } catch (error: any) {
    console.error('Get products error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff and owners can create products
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
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

    // Create product
    const product = await prisma.product.create({
      data: {
        tenantId: auth.tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null,
        price: parseFloat(price) || 0,
        cost: parseFloat(cost) || 0,
        stock: parseInt(stock) || 0,
        minStock: parseInt(minStock) || 0,
        barcode: barcode?.trim() || null,
        sku: sku?.trim() || null,
        supplier: supplier?.trim() || null,
        status: status || 'active',
      },
    });

    // Calculate stock status
    let stockStatus = 'inStock';
    if (product.stock === 0) {
      stockStatus = 'outOfStock';
    } else if (product.stock <= (product.minStock || 5)) {
      stockStatus = 'lowStock';
    }

    return NextResponse.json({
      success: true,
      message: 'Ürün eklendi',
      data: {
        ...product,
        stockStatus,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Create product error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
