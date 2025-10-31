import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch from project-admin API
    const projectAdminUrl = process.env.PROJECT_ADMIN_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://yonetim.netrandevu.com' 
        : 'http://localhost:3002');
    
    const response = await fetch(
      `${projectAdminUrl}/api/pages`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.json();

    // Filter only active pages
    if (data.success) {
      data.data = data.data.filter((page: any) => page.isActive);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

