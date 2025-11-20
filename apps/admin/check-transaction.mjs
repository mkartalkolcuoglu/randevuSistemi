import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    // Bugünkü randevuları ve transaction'ları kontrol et
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];
    
    console.log('🔍 Checking appointments for:', today, 'and', tomorrow);
    
    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          in: ['2025-11-22', '2025-11-21', '2025-11-20']
        },
        paymentType: {
          in: ['card', 'credit_card']
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`\n📅 Found ${appointments.length} card payment appointments:`);
    for (const apt of appointments) {
      console.log(`\nAppointment ${apt.id}:`);
      console.log(`  Customer: ${apt.customerName}`);
      console.log(`  Date: ${apt.date} ${apt.time}`);
      console.log(`  Status: ${apt.status}`);
      console.log(`  Payment: ${apt.paymentType} - ${apt.price}₺`);
      
      // Check if transaction exists
      const transaction = await prisma.transaction.findFirst({
        where: { appointmentId: apt.id }
      });
      
      if (transaction) {
        console.log(`  ✅ Transaction: ${transaction.id} (${transaction.amount}₺)`);
      } else {
        console.log(`  ❌ NO TRANSACTION FOUND!`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
