import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const priority = searchParams.get('priority') || 'all';

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { assignedTo: { contains: search } }
      ];
    }
    
    if (status !== 'all') {
      where.status = status;
    }
    
    if (priority !== 'all') {
      where.priority = priority;
    }

    // Get total count
    const total = await prisma.task.count({ where });

    // Get paginated data
    const tasks = await prisma.task.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: tasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const newTask = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        assignedTo: data.assignedTo,
        priority: data.priority || 'medium',
        status: data.status || 'pending',
        dueDate: data.dueDate ? new Date(data.dueDate) : null
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: newTask 
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 400 }
    );
  }
}