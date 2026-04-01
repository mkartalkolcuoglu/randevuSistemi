import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '../../otp/verify/route';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('customer-session');
  if (!sessionCookie) {
    return NextResponse.json({ loggedIn: false });
  }

  const session = verifySessionToken(sessionCookie.value);
  if (!session) {
    return NextResponse.json({ loggedIn: false });
  }

  return NextResponse.json({ loggedIn: true, phone: session.phone });
}
