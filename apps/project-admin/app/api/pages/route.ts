import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List all pages
export async function GET() {
  try {
    const pages = await prisma.page.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: pages
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

// POST - Create new page
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { slug, title, content, isActive } = data;

    if (!slug || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const page = await prisma.page.create({
      data: {
        slug,
        title,
        content,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({
      success: true,
      data: page
    });
  } catch (error: any) {
    console.error('Error creating page:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A page with this slug already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create page' },
      { status: 500 }
    );
  }
}

