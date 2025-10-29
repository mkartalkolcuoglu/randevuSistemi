import { requireAuth, requirePageAccess } from '../../../lib/auth-utils';
import CustomersClient from './customers-client';
import UnauthorizedAccess from '../../../components/UnauthorizedAccess';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

async function getCustomers(tenantId: string) {
  try {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
    return customers;
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

export default async function CustomersPage() {
  try {
    const user = await requireAuth();
    
    // Check permission
    try {
      await requirePageAccess('customers');
    } catch (error) {
      return <UnauthorizedAccess />;
    }

    const customers = await getCustomers(user.tenantId);
    return <CustomersClient initialCustomers={customers} tenantId={user.tenantId} user={user} />;
  } catch (error) {
    console.error('Error in CustomersPage:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Hata Oluştu</h1>
          <p className="text-gray-600">Müşteriler sayfası yüklenirken bir hata oluştu.</p>
          <p className="text-sm text-gray-500 mt-2">{error instanceof Error ? error.message : 'Bilinmeyen hata'}</p>
        </div>
      </div>
    );
  }
}