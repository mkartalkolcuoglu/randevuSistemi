import { NextRequest, NextResponse } from 'next/server';

const ADMIN_API = 'https://admin.netrandevu.com/api/mobile';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const tenantId = request.headers.get('X-Tenant-ID');

    if (!authHeader || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const response = await fetch(`${ADMIN_API}/settings`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'X-Tenant-ID': tenantId,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('PWA Settings GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const tenantId = request.headers.get('X-Tenant-ID');

    if (!authHeader || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${ADMIN_API}/settings`, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'X-Tenant-ID': tenantId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('PWA Settings PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
