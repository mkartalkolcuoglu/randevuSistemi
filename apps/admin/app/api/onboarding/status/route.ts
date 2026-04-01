import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../lib/prisma';

const BASE_STEPS = [
  'workingHours',
  'services',
  'staff',
  'location',
  'notifications',
  'theme',
];


export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tenant-session');
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const tenantId = session.tenantId;
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only show onboarding for owners
    if (session.userType !== 'owner') {
      return NextResponse.json({
        success: true,
        completed: true,
        completedSteps: BASE_STEPS,
        totalSteps: BASE_STEPS.length,
      });
    }

    const [tenant, settings, serviceCount, staffCount] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.settings.findFirst({ where: { tenantId } }),
      prisma.service.count({ where: { tenantId } }),
      prisma.staff.count({ where: { tenantId } }),
    ]);

    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const completedSteps: string[] = [];

    // Step 1: Working hours - check if any working hours are saved
    if (settings?.workingHours || tenant.workingHours) {
      completedSteps.push('workingHours');
    }

    // Step 2: Services
    if (serviceCount > 0) completedSteps.push('services');

    // Step 3: Staff
    if (staffCount > 0) completedSteps.push('staff');

    // Step 4: Location
    let theme: any = {};
    try {
      theme = tenant.theme ? JSON.parse(tenant.theme as string) : {};
    } catch {
      theme = {};
    }
    if (tenant.address || theme.location?.latitude || settings?.businessAddress) {
      completedSteps.push('location');
    }

    // Step 5: Notifications
    if (settings?.notificationSettings) {
      try {
        const ns = JSON.parse(settings.notificationSettings);
        if (ns && Object.keys(ns).length > 0) completedSteps.push('notifications');
      } catch {
        // not completed
      }
    }

    // Step 6: Theme/Logo - check if any theme data was saved
    if (theme.primaryColor || (theme.logo && !theme.logo.startsWith('https://ui-avatars.com/api/'))) {
      completedSteps.push('theme');
    }

    // Determine required steps based on card payment
    const cardPaymentEnabled = (tenant as any).cardPaymentEnabled === true;
    const requiredSteps = cardPaymentEnabled ? [...BASE_STEPS, 'documents'] : BASE_STEPS;

    // Step 7: Documents (only if card payment enabled)
    if (cardPaymentEnabled && theme.documents) {
      const docs = theme.documents;
      if (docs.completed || docs.iban || docs.taxDocument || docs.identityDocument) {
        completedSteps.push('documents');
      }
    }

    return NextResponse.json({
      success: true,
      completed: completedSteps.length === requiredSteps.length,
      completedSteps,
      totalSteps: requiredSteps.length,
      cardPaymentEnabled,
    });
  } catch (error) {
    console.error('[ONBOARDING STATUS] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
