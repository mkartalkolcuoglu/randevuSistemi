import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import PaymentFlowClient from './payment-flow-client';
import { prisma } from '../../lib/prisma';

export const dynamic = 'force-dynamic';

// Project Admin kontrolü
async function checkProjectAdmin() {
  const cookieStore = await cookies();
  const projectAdminCookie = cookieStore.get('project-admin');

  if (!projectAdminCookie || projectAdminCookie.value !== 'true') {
    return false;
  }

  return true;
}

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
          productName
        };
      })
    );

    return paymentsWithDetails;
  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
}

export default async function PaymentFlowPage() {
  // Project admin kontrolü
  const isProjectAdmin = await checkProjectAdmin();

  if (!isProjectAdmin) {
    redirect('/admin');
  }

  const payments = await getPayments();

  return <PaymentFlowClient payments={payments} />;
}
