import { NextRequest, NextResponse } from 'next/server';

const ADMIN_API = 'https://admin.netrandevu.com/api/mobile';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const tenantId = request.headers.get('X-Tenant-ID');

    if (!authHeader || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const response = await fetch(`${ADMIN_API}/services/${id}`, {
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
    console.error('PWA Services GET by ID Error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const tenantId = request.headers.get('X-Tenant-ID');

    if (!authHeader || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const response = await fetch(`${ADMIN_API}/services/${id}`, {
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
    console.error('PWA Services PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const tenantId = request.headers.get('X-Tenant-ID');

    if (!authHeader || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const response = await fetch(`${ADMIN_API}/services/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': authHeader,
        'X-Tenant-ID': tenantId,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('PWA Services PATCH Error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const tenantId = request.headers.get('X-Tenant-ID');

    if (!authHeader || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const response = await fetch(`${ADMIN_API}/services/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'X-Tenant-ID': tenantId,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('PWA Services DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
