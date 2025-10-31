import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch from project-admin API
    const response = await fetch(
      `${process.env.PROJECT_ADMIN_URL || 'http://localhost:3002'}/api/packages`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

