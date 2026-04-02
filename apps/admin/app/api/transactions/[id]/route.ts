import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkApiPermission } from '../../../../lib/api-auth';
import { createAuditLog, getIpFromRequest } from '../../../../lib/audit';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transaction = await prisma.transaction.findUnique({
      where: { id }
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check permission
    const permissionCheck = await checkApiPermission(request, 'kasa', 'update');
    if (!permissionCheck.authorized) {
      return permissionCheck.error!;
    }

    const data = await request.json();

    // Get old transaction to handle stock changes
    const oldTransaction = await prisma.transaction.findUnique({
      where: { id }
    });

    if (!oldTransaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // If it's a sale and product/quantity changed, update stock
    if (oldTransaction.type === 'sale' && oldTransaction.productId) {
      // Restore old stock
      const oldProduct = await prisma.product.findUnique({
        where: { id: oldTransaction.productId }
      });

      if (oldProduct && oldTransaction.quantity) {
        await prisma.product.update({
          where: { id: oldTransaction.productId },
          data: { stock: oldProduct.stock + oldTransaction.quantity }
        });
      }

      // Deduct new stock if product is still selected
      if (data.productId && data.quantity) {
        const newProduct = await prisma.product.findUnique({
          where: { id: data.productId }
        });

        if (!newProduct) {
          return NextResponse.json(
            { success: false, error: 'Product not found' },
            { status: 404 }
          );
        }

        if (newProduct.stock < data.quantity) {
          return NextResponse.json(
            { success: false, error: 'Insufficient stock' },
            { status: 400 }
          );
        }

        await prisma.product.update({
          where: { id: data.productId },
          data: { stock: newProduct.stock - data.quantity }
        });

        // Recalculate profit
        const totalCost = (newProduct.cost || 0) * data.quantity;
        data.cost = totalCost;
        data.profit = data.amount - totalCost;
      }
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
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
        date: data.date
      }
    });

    // Audit log
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('tenant-session');
      let userName = undefined;
      let userType = 'owner';
      let userId = undefined;
      let tenantId = oldTransaction.tenantId;
      if (sessionCookie) {
        try {
          const sessionData = JSON.parse(sessionCookie.value);
          userName = sessionData.ownerName;
          userType = sessionData.userType || 'owner';
          userId = sessionData.staffId;
          tenantId = sessionData.tenantId || tenantId;
        } catch {}
      }
      const changes: string[] = [];
      if (oldTransaction.amount !== transaction.amount) {
        changes.push(`tutar ${oldTransaction.amount}→${transaction.amount}₺`);
      }
      if (oldTransaction.description !== transaction.description) {
        changes.push(`açıklama "${oldTransaction.description}"→"${transaction.description}"`);
      }
      if (oldTransaction.type !== transaction.type) {
        changes.push(`tür ${oldTransaction.type}→${transaction.type}`);
      }
      if (oldTransaction.paymentType !== transaction.paymentType) {
        changes.push(`ödeme türü ${oldTransaction.paymentType}→${transaction.paymentType}`);
      }
      const summary = changes.length > 0
        ? `İşlem güncellendi: ${changes.join(', ')}`
        : `İşlem güncellendi: ${transaction.description}`;
      await createAuditLog({
        tenantId,
        userId,
        userName,
        userType,
        action: 'update',
        entity: 'transaction',
        entityId: id,
        summary,
        oldValues: oldTransaction,
        newValues: transaction,
        ipAddress: getIpFromRequest(request),
        source: 'admin',
      });
    } catch (auditError) {
      console.error('Audit log error (transaction update):', auditError);
    }

    return NextResponse.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update transaction' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check permission
    const permissionCheck = await checkApiPermission(request, 'kasa', 'delete');
    if (!permissionCheck.authorized) {
      return permissionCheck.error!;
    }

    // Get transaction to restore stock if it's a sale
    const transaction = await prisma.transaction.findUnique({
      where: { id }
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // If it's a sale, restore stock
    if (transaction.type === 'sale' && transaction.productId && transaction.quantity) {
      const product = await prisma.product.findUnique({
        where: { id: transaction.productId }
      });

      if (product) {
        await prisma.product.update({
          where: { id: transaction.productId },
          data: { stock: product.stock + transaction.quantity }
        });
      }
    }

    await prisma.transaction.delete({
      where: { id }
    });

    // Audit log
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('tenant-session');
      let userName = undefined;
      let userType = 'owner';
      let userId = undefined;
      let tenantId = transaction.tenantId;
      if (sessionCookie) {
        try {
          const sessionData = JSON.parse(sessionCookie.value);
          userName = sessionData.ownerName;
          userType = sessionData.userType || 'owner';
          userId = sessionData.staffId;
          tenantId = sessionData.tenantId || tenantId;
        } catch {}
      }
      await createAuditLog({
        tenantId,
        userId,
        userName,
        userType,
        action: 'delete',
        entity: 'transaction',
        entityId: id,
        summary: `İşlem silindi: ${transaction.description} ${transaction.amount}₺`,
        oldValues: transaction,
        ipAddress: getIpFromRequest(request),
        source: 'admin',
      });
    } catch (auditError) {
      console.error('Audit log error (transaction delete):', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete transaction' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

