import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { verifySessionToken } from '../otp/verify/route';
import { formatPhoneForSMS } from '../../../lib/netgsm-client';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('customer-session');
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Oturum bulunamadı', code: 'NO_SESSION' },
        { status: 401 }
      );
    }

    const session = verifySessionToken(sessionCookie.value);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Oturum süresi dolmuş', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    const phone = session.phone;
    const formattedPhone = formatPhoneForSMS(phone);

    const phoneVariants = [
      formattedPhone,
      formattedPhone.replace('90', '0'),
      formattedPhone.replace('90', ''),
    ];

    // Find all customers with this phone
    const customers = await prisma.customer.findMany({
      where: {
        phone: { in: phoneVariants },
      },
    });

    if (customers.length === 0) {
      return NextResponse.json({ success: true, packages: [] });
    }

    const customerIds = customers.map(c => c.id);

    // Use raw query with actual snake_case table names
    const packages = await prisma.$queryRawUnsafe(`
      SELECT
        cp.id, cp."customerId", cp."packageId", cp."tenantId", cp."assignedAt", cp."expiresAt", cp.status,
        p.name as "packageName", p.description as "packageDescription",
        t."businessName" as "tenantName"
      FROM customer_packages cp
      JOIN packages p ON p.id = cp."packageId"
      JOIN tenants t ON t.id = cp."tenantId"
      WHERE cp."customerId" = ANY($1::text[]) AND cp.status = 'active'
      ORDER BY cp."assignedAt" DESC
    `, customerIds);

    // Get usages for each package
    const packageIds = (packages as any[]).map(p => p.id);
    const usages = packageIds.length > 0 ? await prisma.$queryRawUnsafe(`
      SELECT id, "customerPackageId", "itemType", "itemId", "itemName",
             "totalQuantity", "usedQuantity", "remainingQuantity"
      FROM customer_package_usage
      WHERE "customerPackageId" = ANY($1::text[]) AND "remainingQuantity" > 0
    `, packageIds) : [];

    // Group usages by package
    const packagesWithUsages = (packages as any[]).map(pkg => ({
      ...pkg,
      package: { name: pkg.packageName, description: pkg.packageDescription },
      usages: (usages as any[]).filter(u => u.customerPackageId === pkg.id),
    }));

    return NextResponse.json({
      success: true,
      packages: packagesWithUsages,
    });
  } catch (error) {
    console.error('Error fetching customer packages:', error);
    return NextResponse.json(
      { success: false, error: 'Paketler yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}
