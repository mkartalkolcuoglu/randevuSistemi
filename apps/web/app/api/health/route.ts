import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    appointments_api: 'available',
    git_commit: '66853d0'
  });
}

