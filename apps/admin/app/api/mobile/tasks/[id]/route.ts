import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as {
      userType: string;
      tenantId: string;
    };
  } catch {
    return null;
  }
}

// PUT - Update task
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || auth.userType === 'customer') {
      return NextResponse.json({ success: false, message: 'Yetki gerekli' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.task.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Görev bulunamadı' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo.trim();
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    console.error('Update task error:', error);
    return NextResponse.json({ success: false, message: 'Bir hata oluştu' }, { status: 500 });
  }
}

// DELETE - Delete task
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || auth.userType === 'customer') {
      return NextResponse.json({ success: false, message: 'Yetki gerekli' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.task.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Görev bulunamadı' }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Görev silindi' });
  } catch (error: any) {
    console.error('Delete task error:', error);
    return NextResponse.json({ success: false, message: 'Bir hata oluştu' }, { status: 500 });
  }
}
