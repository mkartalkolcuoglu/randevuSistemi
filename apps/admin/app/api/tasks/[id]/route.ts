import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { cookies } from 'next/headers';

async function getTenantId() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('tenant-session');
  if (!sessionCookie) return null;
  try {
    const session = JSON.parse(sessionCookie.value);
    return session.tenantId || null;
  } catch { return null; }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const task = await prisma.task.findFirst({
      where: { id, tenantId }
    });

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.task.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const data = await request.json();
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        assignedTo: data.assignedTo,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate) : null
      }
    });

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ success: false, error: 'Failed to update task' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.task.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete task' }, { status: 400 });
  }
}
