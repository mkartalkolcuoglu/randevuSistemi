import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const tenantData = await request.json();
    
    // Make server-side request to admin panel
    const adminResponse = await fetch('http://localhost:3001/api/tenants/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tenantData),
    });

    if (!adminResponse.ok) {
      console.error('Admin panel response not ok:', adminResponse.status, adminResponse.statusText);
      return NextResponse.json({
        success: false,
        error: `Admin panel error: ${adminResponse.status}`
      }, { status: 500 });
    }

    const result = await adminResponse.json();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Tenant synced to admin panel successfully'
      });
    } else {
      console.error('Admin panel returned error:', result);
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to sync tenant to admin panel'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error syncing tenant to admin:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to sync tenant to admin panel'
    }, { status: 500 });
  }
}
