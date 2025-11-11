import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

/**
 * Debug endpoint to check payment details
 * GET /api/payment/debug?merchant_oid=XXX
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantOid = searchParams.get('merchant_oid');

    if (!merchantOid) {
      return NextResponse.json({
        success: false,
        error: 'merchant_oid required'
      }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { merchantOid }
    });

    if (!payment) {
      return NextResponse.json({
        success: false,
        error: 'Payment not found'
      }, { status: 404 });
    }

    // Parse userBasket if exists
    let basketData = null;
    if (payment.userBasket) {
      try {
        basketData = JSON.parse(payment.userBasket);
      } catch (e) {
        basketData = { error: 'Failed to parse userBasket' };
      }
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        merchantOid: payment.merchantOid,
        status: payment.status,
        amount: payment.amount,
        tenantId: payment.tenantId,
        customerName: payment.customerName,
        customerEmail: payment.customerEmail,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        basketData
      }
    });

  } catch (error) {
    console.error('❌ [DEBUG] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
