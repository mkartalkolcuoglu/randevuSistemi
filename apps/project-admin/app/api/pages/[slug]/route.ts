import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// GET - Get page by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const page = await prisma.page.findUnique({
      where: { slug }
    });

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: page
    });
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

// PUT - Update page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const data = await request.json();
    const { title, content, isActive } = data;

    const page = await prisma.page.update({
      where: { slug },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({
      success: true,
      data: page
    });
  } catch (error: any) {
    console.error('Error updating page:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update page' },
      { status: 500 }
    );
  }
}

// DELETE - Delete page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await prisma.page.delete({
      where: { slug }
    });

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting page:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}

