import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as {
      userType: string;
      tenantId: string;
      staffId?: string;
    };
  } catch {
    return null;
  }
}

// GET - List tasks
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || auth.userType === 'customer') {
      return NextResponse.json({ success: false, message: 'Yetki gerekli' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    const where: any = { tenantId: auth.tenantId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { assignedTo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
    };

    return NextResponse.json({ success: true, data: tasks, stats });
  } catch (error: any) {
    console.error('Get tasks error:', error);
    return NextResponse.json({ success: false, message: 'Bir hata oluştu' }, { status: 500 });
  }
}

// POST - Create task
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || auth.userType === 'customer') {
      return NextResponse.json({ success: false, message: 'Yetki gerekli' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, assignedTo, priority, dueDate } = body;

    if (!title?.trim()) {
      return NextResponse.json({ success: false, message: 'Görev başlığı gerekli' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        tenantId: auth.tenantId,
        title: title.trim(),
        description: description?.trim() || null,
        assignedTo: assignedTo?.trim() || 'Atanmamış',
        priority: priority || 'medium',
        status: 'pending',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    console.error('Create task error:', error);
    return NextResponse.json({ success: false, message: 'Bir hata oluştu' }, { status: 500 });
  }
}
