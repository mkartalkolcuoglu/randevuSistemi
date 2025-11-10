import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

/**
 * Test endpoint to check if OTP table exists
 */
export async function GET(request: NextRequest) {
  try {
    // Check if we can connect to database
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'otp_verifications'
      );
    `;

    // Try to count OTP records
    const count = await prisma.otpVerification.count();

    // Check environment variables
    const envCheck = {
      NETGSM_USERCODE: !!process.env.NETGSM_USERCODE,
      NETGSM_PASSWORD: !!process.env.NETGSM_PASSWORD,
      DATABASE_URL: !!process.env.DATABASE_URL,
    };

    return NextResponse.json({
      success: true,
      message: 'OTP system test',
      database: {
        tableExists,
        otpCount: count,
      },
      environment: envCheck,
      prismaModels: Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_'))
    });

  } catch (error) {
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
