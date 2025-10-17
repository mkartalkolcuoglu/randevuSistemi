import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

/**
 * Check all tenants and auto-disable expired subscriptions
 * This endpoint should be called by a cron job or scheduled task
 */
export async function POST() {
  try {
    const now = new Date();

    // Find all active tenants with expired subscriptions
    const expiredTenants = await prisma.tenant.findMany({
      where: {
        status: 'active',
        subscriptionEnd: {
          lt: now // subscription end is less than now (expired)
        }
      }
    });

    // Update all expired tenants to inactive status
    const updatePromises = expiredTenants.map(tenant =>
      prisma.tenant.update({
        where: { id: tenant.id },
        data: { status: 'inactive' }
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `${expiredTenants.length} tenant(s) disabled due to expired subscriptions`,
      data: {
        count: expiredTenants.length,
        tenants: expiredTenants.map(t => ({
          id: t.id,
          businessName: t.businessName,
          subscriptionPlan: t.subscriptionPlan,
          subscriptionEnd: t.subscriptionEnd
        }))
      }
    });

  } catch (error) {
    console.error('Error checking subscriptions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check subscriptions' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check subscription status without modifying
 */
export async function GET() {
  try {
    const now = new Date();

    // Find all tenants with expired subscriptions (regardless of status)
    const expiredTenants = await prisma.tenant.findMany({
      where: {
        subscriptionEnd: {
          lt: now
        }
      },
      select: {
        id: true,
        businessName: true,
        status: true,
        subscriptionPlan: true,
        subscriptionStart: true,
        subscriptionEnd: true
      }
    });

    // Find tenants expiring soon (within 7 days)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringSoon = await prisma.tenant.findMany({
      where: {
        status: 'active',
        subscriptionEnd: {
          gte: now,
          lte: sevenDaysFromNow
        }
      },
      select: {
        id: true,
        businessName: true,
        status: true,
        subscriptionPlan: true,
        subscriptionStart: true,
        subscriptionEnd: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        expired: {
          count: expiredTenants.length,
          tenants: expiredTenants
        },
        expiringSoon: {
          count: expiringSoon.length,
          tenants: expiringSoon
        }
      }
    });

  } catch (error) {
    console.error('Error getting subscription status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}

