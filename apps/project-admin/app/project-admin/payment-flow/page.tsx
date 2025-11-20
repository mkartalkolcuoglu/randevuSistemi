import PaymentFlowClient from './payment-flow-client';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

async function getPayments() {
  try {
    // İptal edilmiş randevuları al (kredi kartı ödemeli)
    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'cancelled',
        paymentType: 'card',
        paymentStatus: 'paid' // Ödemesi alınmış olan
      },
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        id: true,
        tenantId: true,
        customerId: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        serviceName: true,
        staffName: true,
        date: true,
        time: true,
        price: true,
        paymentType: true,
        refundCompleted: true,
        refundCompletedAt: true,
        refundNotes: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Her appointment için tenant bilgisini al
    const appointmentsWithDetails = await Promise.all(
      appointments.map(async (appointment) => {
        let tenantName = 'Bilinmiyor';

        // Tenant bilgisi
        if (appointment.tenantId) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: appointment.tenantId },
            select: { businessName: true }
          });
          if (tenant) {
            tenantName = tenant.businessName;
          }
        }

        return {
          ...appointment,
          tenantName
        };
      })
    );

    return appointmentsWithDetails;
  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
}

export default async function PaymentFlowPage() {
  // Middleware already handles authentication
  const payments = await getPayments();

  return <PaymentFlowClient payments={payments} />;
}
