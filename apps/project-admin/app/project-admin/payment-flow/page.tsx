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
        productName: true  // Paket/ürün adı
      }
    });

    // Her payment için tenant ve randevu bilgilerini al
    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        let tenantName = 'Bilinmiyor';
        let serviceName = null;
        let packageName = null;
        let productName = payment.productName || null; // Veritabanından gelen productName'i kullan

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

        // Eğer productName yoksa (eski kayıtlar), userBasket'ten parse et
        if (!productName && payment.userBasket) {
          try {
            // userBasket base64 encoded JSON olabilir
            let basket = payment.userBasket;
            try {
              basket = Buffer.from(payment.userBasket, 'base64').toString('utf-8');
            } catch (e) {
              // Base64 değilse, direkt kullan
            }

            const basketData = JSON.parse(basket);
            // Basket formatı: [["Ürün Adı", "Fiyat", "Miktar"]]
            if (Array.isArray(basketData) && basketData.length > 0 && Array.isArray(basketData[0])) {
              const itemName = basketData[0][0];
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
            console.error('Error parsing userBasket:', e);
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
  // Middleware already handles authentication
  const payments = await getPayments();

  return <PaymentFlowClient payments={payments} />;
}
