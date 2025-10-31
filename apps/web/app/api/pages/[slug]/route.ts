import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Fetch from project-admin API
    const response = await fetch(
      `${process.env.PROJECT_ADMIN_URL || 'http://localhost:3002'}/api/pages/${slug}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

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

