import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Çıkış başarılı'
  });

  // Clear auth cookie
  response.cookies.delete('project-admin-auth');

  return response;
}

