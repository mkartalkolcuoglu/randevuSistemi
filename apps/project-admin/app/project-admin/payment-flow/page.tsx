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
        userBasket: true
      }
    });

    // Her payment için tenant ve randevu bilgilerini al
    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        let tenantName = 'Bilinmiyor';
        let serviceName = null;
        let packageName = null;
        let productName = null;

        // Tenant bilgisi
        if (payment.tenantId) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: payment.tenantId },
            select: { businessName: true }
          });
          if (tenant) {
            tenantName = tenant.businessName;
          }
        }

        // Appointment bilgisi
        if (payment.appointmentId) {
          const appointment = await prisma.appointment.findUnique({
            where: { id: payment.appointmentId },
            select: { serviceName: true }
          });
          if (appointment) {
            serviceName = appointment.serviceName;
          }
        }

        // userBasket'ten paket veya ürün bilgisi çıkar
        if (payment.userBasket) {
          try {
            const basket = JSON.parse(payment.userBasket);
            // Basket formatı: "Ürün Adı 1, Miktar 1, Fiyat 1"
            const parts = basket.split(',');
            if (parts.length > 0) {
              const itemName = parts[0].trim();
              // Eğer "Paket" kelimesi içeriyorsa paket, değilse ürün olarak kabul et
              if (itemName.toLowerCase().includes('paket') || itemName.toLowerCase().includes('package')) {
                packageName = itemName;
              } else if (!serviceName) {
                // Sadece servis yoksa ürün olarak kabul et
                productName = itemName;
              }
            }
          } catch (e) {
            // JSON parse hatası, devam et
          }
        }

        return {
          ...payment,
          tenantName,
          serviceName,
          packageName,
          productName,
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
        paymentType: 'card'
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

    console.log('✅ Found cancelled card payments:', appointmentsWithDetails.length);
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

  console.log('📊 Payment Flow Data:', {
    paymentsCount: payments.length,
    cancelledCardPaymentsCount: cancelledCardPayments.length
  });

  return <PaymentFlowClient payments={payments} cancelledCardPayments={cancelledCardPayments} />;
}
