import PaymentFlowClient from './payment-flow-client';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

async function getPayments() {
  try {
    // Tüm başarılı ödemeleri al (kredi kartı ve EFT)
    const payments = await prisma.payment.findMany({
      where: {
        status: 'success',
        paymentType: {
          in: ['card', 'eft']
        }
      },
      orderBy: {
        paidAt: 'desc'
      },
      select: {
        id: true,
        tenantId: true,
        appointmentId: true,
        customerId: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        merchantOid: true,
        amount: true,
        paymentType: true,
        status: true,
        paidAt: true,
        createdAt: true,
        userBasket: true,
        productName: true,
      }
    });

    // Her payment için tenant ve randevu bilgilerini al
    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        let tenantName = 'Bilinmiyor';
        let itemName: string | null = null;

        // Tenant bilgisi
        if (payment.tenantId) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: payment.tenantId },
            select: { businessName: true }
          });
          if (tenant) tenantName = tenant.businessName;
        }

        // 1. Doğrudan Payment.productName alanı
        if (payment.productName) {
          itemName = payment.productName;
        }

        // 2. Appointment'tan serviceName
        if (!itemName && payment.appointmentId) {
          const appointment = await prisma.appointment.findUnique({
            where: { id: payment.appointmentId },
            select: { serviceName: true }
          });
          if (appointment?.serviceName) itemName = appointment.serviceName;
        }

        // 3. userBasket'ten parse et
        if (!itemName && payment.userBasket) {
          try {
            const basket = JSON.parse(payment.userBasket);
            if (typeof basket === 'string') {
              const parts = basket.split(',');
              if (parts.length > 0 && parts[0].trim()) itemName = parts[0].trim();
            } else if (Array.isArray(basket) && basket.length > 0) {
              itemName = basket[0]?.name || basket[0] || null;
            }
          } catch {}
        }

        return {
          ...payment,
          tenantName,
          serviceName: itemName,
          packageName: null,
          productName: null,
          paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
          createdAt: payment.createdAt.toISOString()
        };
      })
    );

    return paymentsWithDetails;
  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
}

async function getCancelledCardPayments() {
  try {
    // İptal edilmiş randevuları al (kredi kartı ödemeli)
    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'cancelled',
        paymentType: {
          in: ['card', 'credit_card']
        }
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
          tenantName,
          createdAt: appointment.createdAt.toISOString(),
          updatedAt: appointment.updatedAt.toISOString(),
          refundCompletedAt: appointment.refundCompletedAt ? appointment.refundCompletedAt.toISOString() : null
        };
      })
    );

    return appointmentsWithDetails;
  } catch (error) {
    console.error('Error fetching cancelled card payments:', error);
    return [];
  }
}

export default async function PaymentFlowPage() {
  // Middleware already handles authentication
  const payments = await getPayments();
  const cancelledCardPayments = await getCancelledCardPayments();

  return <PaymentFlowClient payments={payments} cancelledCardPayments={cancelledCardPayments} />;
}
