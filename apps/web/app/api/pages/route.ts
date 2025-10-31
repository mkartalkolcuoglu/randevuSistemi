import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch from project-admin API
    const response = await fetch(
      `${process.env.PROJECT_ADMIN_URL || 'http://localhost:3002'}/api/pages`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

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

