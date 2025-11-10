import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get IP from request headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  return NextResponse.json({
    'x-forwarded-for': forwarded,
    'x-real-ip': realIp,
    'all-headers': Object.fromEntries(request.headers.entries())
  });
}
