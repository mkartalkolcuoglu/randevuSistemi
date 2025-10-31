import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch notifications for a tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    console.log('🔔 [API] GET notifications for tenantId:', tenantId);

    if (!tenantId) {
      console.error('🔔 [API] Missing tenantId');
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      );
    }

    const notifications = await prisma.notification.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Last 50 notifications
    });

    console.log('🔔 [API] Found', notifications.length, 'notifications');
    console.log('🔔 [API] Notifications:', notifications);

    return NextResponse.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('🔔 [API] Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, type, title, message, link } = body;

    if (!tenantId || !type || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        tenantId,
        type,
        title,
        message,
        link: link || null
      }
    });

    return NextResponse.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

