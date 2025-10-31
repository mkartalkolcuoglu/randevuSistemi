import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Fetch from project-admin API
    const projectAdminUrl = process.env.PROJECT_ADMIN_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://yonetim.netrandevu.com' 
        : 'http://localhost:3002');
    
    const response = await fetch(
      `${projectAdminUrl}/api/pages/${slug}`,
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

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

