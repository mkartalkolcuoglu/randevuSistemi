import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET - List all pages
export async function GET() {
  try {
    console.log('GET /api/pages - Fetching all pages...');
    
    const pages = await prisma.page.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    });

    console.log('GET /api/pages - Found', pages.length, 'pages');

    return NextResponse.json({
      success: true,
      data: pages
    });
  } catch (error: any) {
    console.error('GET /api/pages - Error fetching pages:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch pages',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST - Create new page
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('POST /api/pages - Received data:', data);
    
    const { slug, title, content, isActive } = data;

    if (!slug || !title || !content) {
      console.log('POST /api/pages - Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('POST /api/pages - Creating page with slug:', slug);
    
    const page = await prisma.page.create({
      data: {
        slug,
        title,
        content,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    console.log('POST /api/pages - Page created successfully:', page.id);

    return NextResponse.json({
      success: true,
      data: page
    });
  } catch (error: any) {
    console.error('POST /api/pages - Error creating page:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta
    });
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A page with this slug already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create page',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

