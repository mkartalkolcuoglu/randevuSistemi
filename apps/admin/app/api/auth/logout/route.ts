import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Delete all session cookies
    cookieStore.delete('tenant-session');
    cookieStore.delete('tenant_session');
    
    return NextResponse.json({
      success: true,
      message: 'Çıkış başarılı'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Çıkış işlemi sırasında hata oluştu' },
      { status: 500 }
    );
  }
}