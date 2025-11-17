import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/prisma';
import SelectSubscriptionClient from './select-subscription-client';

export const dynamic = 'force-dynamic';

async function getTenantInfo() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('tenant-session');

  if (!sessionCookie) {
    return null;
  }

  try {
    const sessionData = JSON.parse(sessionCookie.value);

    const tenant = await prisma.tenant.findUnique({
      where: { id: sessionData.tenantId },
      select: {
        id: true,
        businessName: true,
        hasUsedTrial: true,
        subscriptionPlan: true,
        subscriptionEnd: true,
      }
    });

    return tenant;
  } catch (error) {
    console.error('Error getting tenant info:', error);
    return null;
  }
}

async function getActivePackages(hasUsedTrial: boolean) {
  try {
    const packages = await prisma.subscriptionPackage.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: 'asc'
      }
    });

    // Eğer trial kullanılmışsa, trial paketini filtrele
    if (hasUsedTrial) {
      return packages.filter(pkg => pkg.slug !== 'deneme-paketi');
    }

    return packages;
  } catch (error) {
    console.error('Error fetching packages:', error);
    return [];
  }
}

export default async function SelectSubscriptionPage() {
  const tenant = await getTenantInfo();

  if (!tenant) {
    redirect('/login');
  }

  // NOT: Subscription aktif kontrolü yapma - middleware zaten kontrol ediyor
  // Eğer buraya geldiyse, subscription dolmuş demektir
  // Bu kontrolü kaldırmak redirect loop'u önler

  const packages = await getActivePackages(tenant.hasUsedTrial);

  return (
    <SelectSubscriptionClient
      packages={packages}
      tenantId={tenant.id}
      businessName={tenant.businessName}
      hasUsedTrial={tenant.hasUsedTrial}
    />
  );
}
