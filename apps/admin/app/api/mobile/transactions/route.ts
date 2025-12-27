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

// GET - Get all transactions for tenant
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const dateFilter = searchParams.get('dateFilter') || 'today';

    // Build date filter
    let dateStart: string | undefined;
    let dateEnd: string | undefined;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (startDate && endDate) {
      dateStart = startDate;
      dateEnd = endDate;
    } else {
      switch (dateFilter) {
        case 'today':
          dateStart = todayStr;
          dateEnd = todayStr;
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateStart = weekAgo.toISOString().split('T')[0];
          dateEnd = todayStr;
          break;
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          dateStart = monthStart.toISOString().split('T')[0];
          dateEnd = todayStr;
          break;
        case 'all':
          // No date filter
          break;
      }
    }

    // Build where clause
    const where: any = {
      tenantId: auth.tenantId,
    };

    if (dateStart && dateEnd) {
      where.date = {
        gte: dateStart,
        lte: dateEnd,
      };
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Calculate summary
    const income = transactions
      .filter((t) => ['income', 'sale', 'appointment', 'package'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalProfit = transactions.reduce((sum, t) => sum + (t.profit || 0), 0);

    // Format transactions for mobile
    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      tenantId: t.tenantId,
      type: t.type,
      amount: t.amount,
      description: t.description,
      paymentType: t.paymentType,
      customerId: t.customerId,
      customerName: t.customerName,
      productId: t.productId,
      productName: t.productName,
      quantity: t.quantity,
      cost: t.cost,
      profit: t.profit,
      appointmentId: t.appointmentId,
      packageId: t.packageId,
      staffId: t.staffId,
      staffName: t.staffName,
      date: t.date,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedTransactions,
      summary: {
        income,
        expense,
        profit: income - expense,
        totalProfit,
        transactionCount: transactions.length,
      },
    });
  } catch (error: any) {
    console.error('Get transactions error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create new transaction
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff and owners can create transactions
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
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
      appointmentId,
      packageId,
      staffId,
      staffName,
      date,
    } = body;

    // Validation
    if (!type || amount === undefined || !description || !date) {
      return NextResponse.json(
        { success: false, message: 'Tür, tutar, açıklama ve tarih zorunludur' },
        { status: 400 }
      );
    }

    let cost: number | undefined;
    let profit: number | undefined;

    // Handle product sale - update stock
    if (type === 'sale' && productId && quantity) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return NextResponse.json(
          { success: false, message: 'Ürün bulunamadı' },
          { status: 404 }
        );
      }

      if (product.stock < quantity) {
        return NextResponse.json(
          { success: false, message: 'Yetersiz stok' },
          { status: 400 }
        );
      }

      // Update stock
      await prisma.product.update({
        where: { id: productId },
        data: { stock: product.stock - quantity },
      });

      // Calculate profit
      const totalCost = (product.cost || 0) * quantity;
      cost = totalCost;
      profit = amount - totalCost;
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        tenantId: auth.tenantId,
        type,
        amount: parseFloat(amount),
        description: description.trim(),
        paymentType: paymentType || null,
        customerId: customerId || null,
        customerName: customerName || null,
        productId: productId || null,
        productName: productName || null,
        quantity: quantity ? parseInt(quantity) : null,
        cost: cost || null,
        profit: profit || null,
        appointmentId: appointmentId || null,
        packageId: packageId || null,
        staffId: staffId || auth.staffId || null,
        staffName: staffName || null,
        date,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'İşlem eklendi',
      data: {
        ...transaction,
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Create transaction error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
