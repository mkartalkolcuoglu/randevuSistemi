import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get last 5 payments
    const payments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        merchantOid: true,
        status: true,
        tenantId: true,
        customerEmail: true,
        amount: true,
        userBasket: true,
        createdAt: true,
        paidAt: true
      }
    });

    return NextResponse.json({
      success: true,
      payments: payments.map(p => ({
        ...p,
        basketType: p.userBasket ? JSON.parse(p.userBasket).type : null,
        basketPreview: p.userBasket ? JSON.parse(p.userBasket).businessName || JSON.parse(p.userBasket).serviceName : null
      }))
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
