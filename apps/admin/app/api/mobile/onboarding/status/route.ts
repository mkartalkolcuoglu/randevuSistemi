import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const BASE_STEPS = [
  'workingHours',
  'services',
  'staff',
  'location',
  'notifications',
  'theme',
];


export async function GET(request: NextRequest) {
  try {
    // JWT auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const tenantId = decoded.tenantId || request.headers.get('X-Tenant-ID');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    }

    // Only show onboarding for owners
    if (decoded.userType !== 'owner') {
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

    // Step 4: Location - check address or coordinates
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
      } catch {}
    }

    // Step 6: Theme/Logo - check if any theme customization was done
    const defaultLogo = 'https://ui-avatars.com/api/';
    const hasCustomLogo = theme.logo && !theme.logo.startsWith(defaultLogo);
    const hasCustomColor = theme.primaryColor && theme.primaryColor !== '#163974';
    if (hasCustomLogo || hasCustomColor) {
      completedSteps.push('theme');
    }

    // Card payment documents step
    const cardPaymentEnabled = (tenant as any).cardPaymentEnabled === true;
    const requiredSteps = cardPaymentEnabled ? [...BASE_STEPS, 'documents'] : BASE_STEPS;

    if (cardPaymentEnabled && theme.documents) {
      const docs = theme.documents;
      if (docs.iban || docs.taxDocument || docs.identityDocument) {
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
    console.error('[MOBILE ONBOARDING STATUS] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
