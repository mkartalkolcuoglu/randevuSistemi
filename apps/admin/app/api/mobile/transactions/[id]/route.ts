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

// GET - Get single transaction by ID
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

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: 'İşlem bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...transaction,
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Get transaction error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Update transaction
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

    // Only staff and owners can update transactions
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if transaction exists and belongs to tenant
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { success: false, message: 'İşlem bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      type,
      amount,
      description,
      paymentType,
      customerId,
      customerName,
      productId,
      productName,
      quantity,
      date,
    } = body;

    // Validation
    if (!type || amount === undefined || !description || !date) {
      return NextResponse.json(
        { success: false, message: 'Tür, tutar, açıklama ve tarih zorunludur' },
        { status: 400 }
      );
    }

    let cost: number | undefined = existingTransaction.cost || undefined;
    let profit: number | undefined = existingTransaction.profit || undefined;

    // If it's a sale and product/quantity changed, update stock
    if (existingTransaction.type === 'sale' && existingTransaction.productId) {
      // Restore old stock
      const oldProduct = await prisma.product.findUnique({
        where: { id: existingTransaction.productId },
      });

      if (oldProduct && existingTransaction.quantity) {
        await prisma.product.update({
          where: { id: existingTransaction.productId },
          data: { stock: oldProduct.stock + existingTransaction.quantity },
        });
      }
    }

    // Deduct new stock if it's a sale with product
    if (type === 'sale' && productId && quantity) {
      const newProduct = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!newProduct) {
        return NextResponse.json(
          { success: false, message: 'Ürün bulunamadı' },
          { status: 404 }
        );
      }

      if (newProduct.stock < quantity) {
        return NextResponse.json(
          { success: false, message: 'Yetersiz stok' },
          { status: 400 }
        );
      }

      await prisma.product.update({
        where: { id: productId },
        data: { stock: newProduct.stock - quantity },
      });

      // Recalculate profit
      const totalCost = (newProduct.cost || 0) * quantity;
      cost = totalCost;
      profit = amount - totalCost;
    } else if (type !== 'sale') {
      // Reset sale-specific fields for non-sale transactions
      cost = undefined;
      profit = undefined;
    }

    // Update transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        type,
        amount: parseFloat(amount),
        description: description.trim(),
        paymentType: paymentType || null,
        customerId: customerId || null,
        customerName: customerName || null,
        productId: type === 'sale' ? (productId || null) : null,
        productName: type === 'sale' ? (productName || null) : null,
        quantity: type === 'sale' ? (quantity ? parseInt(quantity) : null) : null,
        cost: cost || null,
        profit: profit || null,
        date,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'İşlem güncellendi',
      data: {
        ...updatedTransaction,
        createdAt: updatedTransaction.createdAt.toISOString(),
        updatedAt: updatedTransaction.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Update transaction error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete transaction
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

    // Only staff and owners can delete transactions
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if transaction exists and belongs to tenant
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { success: false, message: 'İşlem bulunamadı' },
        { status: 404 }
      );
    }

    // If it's a sale, restore stock
    if (
      existingTransaction.type === 'sale' &&
      existingTransaction.productId &&
      existingTransaction.quantity
    ) {
      const product = await prisma.product.findUnique({
        where: { id: existingTransaction.productId },
      });

      if (product) {
        await prisma.product.update({
          where: { id: existingTransaction.productId },
          data: { stock: product.stock + existingTransaction.quantity },
        });
      }
    }

    // Delete transaction
    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'İşlem silindi',
    });
  } catch (error: any) {
    console.error('Delete transaction error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
