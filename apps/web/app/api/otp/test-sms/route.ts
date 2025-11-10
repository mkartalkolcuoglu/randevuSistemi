import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '../../../../lib/netgsm-client';

/**
 * Test SMS endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone required' },
        { status: 400 }
      );
    }

    console.log('Testing SMS to:', phone);

    // Test SMS gönder
    const result = await sendSMS({
      to: phone,
      message: 'NetRandevu test mesaji. Bu bir test mesajidir.'
    });

    return NextResponse.json({
      success: result.success,
      result,
      env: {
        NETGSM_USERCODE: process.env.NETGSM_USERCODE ? '***' + process.env.NETGSM_USERCODE.slice(-4) : 'NOT_SET',
        NETGSM_PASSWORD: process.env.NETGSM_PASSWORD ? '***' : 'NOT_SET',
        NETGSM_MSGHEADER: process.env.NETGSM_MSGHEADER || 'EMPTY'
      }
    });

  } catch (error) {
    console.error('SMS test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null
      },
      { status: 500 }
    );
  }
}
