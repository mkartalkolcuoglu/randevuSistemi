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

    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${ADMIN_API}/transactions${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
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
    console.error('PWA Transactions GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const response = await fetch(`${ADMIN_API}/transactions`, {
      method: 'POST',
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
    console.error('PWA Transactions POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
