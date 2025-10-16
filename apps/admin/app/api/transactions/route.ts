import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      );
    }

    const where: any = { tenantId };

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Calculate totals
    const income = transactions
      .filter(t => ['income', 'sale', 'appointment', 'package'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const profit = transactions
      .reduce((sum, t) => sum + (t.profit || 0), 0);
    
    console.log('📊 Transaction Summary:', {
      totalTransactions: transactions.length,
      incomeTransactions: transactions.filter(t => ['income', 'sale', 'appointment', 'package'].includes(t.type)).length,
      expenseTransactions: transactions.filter(t => t.type === 'expense').length,
      income,
      expense,
      profit: income - expense,
      totalProfit: profit
    });

    return NextResponse.json({
      success: true,
      data: transactions,
      summary: {
        income,
        expense,
        profit: income - expense,
        totalProfit: profit
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.tenantId || !data.type || !data.amount || !data.description || !data.date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Handle product sale - update stock
    if (data.type === 'sale' && data.productId && data.quantity) {
      const product = await prisma.product.findUnique({
        where: { id: data.productId }
      });

      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      if (product.stock < data.quantity) {
        return NextResponse.json(
          { success: false, error: 'Insufficient stock' },
          { status: 400 }
        );
      }

      // Update stock
      await prisma.product.update({
        where: { id: data.productId },
        data: { stock: product.stock - data.quantity }
      });

      // Calculate profit
      const totalCost = (product.cost || 0) * data.quantity;
      data.cost = totalCost;
      data.profit = data.amount - totalCost;
    }

    const transaction = await prisma.transaction.create({
      data: {
        tenantId: data.tenantId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        paymentType: data.paymentType,
        customerId: data.customerId,
        customerName: data.customerName,
        productId: data.productId,
        productName: data.productName,
        quantity: data.quantity,
        cost: data.cost,
        profit: data.profit,
        appointmentId: data.appointmentId,
        date: data.date
      }
    });

    return NextResponse.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create transaction';
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction', details: errorMessage },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

