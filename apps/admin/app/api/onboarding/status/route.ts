import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../lib/prisma';

const STEP_NAMES = [
  'workingHours',
  'services',
  'staff',
  'location',
  'notifications',
  'theme',
  'documents',
] as const;

const DEFAULT_WORKING_HOURS: Record<string, { start: string; end: string; closed: boolean }> = {
  Pazartesi: { start: '09:00', end: '18:00', closed: false },
  Sali: { start: '09:00', end: '18:00', closed: false },
  Carsamba: { start: '09:00', end: '18:00', closed: false },
  Persembe: { start: '09:00', end: '18:00', closed: false },
  Cuma: { start: '09:00', end: '18:00', closed: false },
  Cumartesi: { start: '09:00', end: '17:00', closed: false },
  Pazar: { start: '09:00', end: '17:00', closed: true },
};

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
        completedSteps: STEP_NAMES as unknown as string[],
        totalSteps: STEP_NAMES.length,
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

    // Step 1: Working hours - check if modified from default
    if (settings?.workingHours) {
      try {
        const wh = JSON.parse(settings.workingHours);
        const isDefault = JSON.stringify(wh) === JSON.stringify(DEFAULT_WORKING_HOURS);
        if (!isDefault) completedSteps.push('workingHours');
      } catch {
        // not completed
      }
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
    if (theme.location?.latitude && theme.location?.longitude) {
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

    // Step 6: Theme/Logo
    const defaultLogo = 'https://ui-avatars.com/api/';
    if (theme.logo && !theme.logo.startsWith(defaultLogo)) {
      completedSteps.push('theme');
    }

    // Step 7: Documents
    if (theme.documents) {
      const docs = theme.documents;
      if (docs.iban || docs.taxDocument || docs.identityDocument) {
        completedSteps.push('documents');
      }
    }

    return NextResponse.json({
      success: true,
      completed: completedSteps.length === STEP_NAMES.length,
      completedSteps,
      totalSteps: STEP_NAMES.length,
    });
  } catch (error) {
    console.error('[ONBOARDING STATUS] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
