import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    console.log('🔍 Checking cancelled card appointments...\n');
    
    const allCancelled = await prisma.appointment.findMany({
      where: { status: 'cancelled' },
      select: {
        id: true,
        customerName: true,
        paymentType: true,
        date: true,
        time: true
      }
    });
    
    console.log(`📊 Total cancelled appointments: ${allCancelled.length}`);
    if (allCancelled.length > 0) {
      console.log('\nPayment types:');
      const byType = allCancelled.reduce((acc, apt) => {
        acc[apt.paymentType] = (acc[apt.paymentType] || 0) + 1;
        return acc;
      }, {});
      console.log(byType);
      
      console.log('\nSample:');
      allCancelled.slice(0, 3).forEach(apt => {
        console.log(`- ${apt.customerName} | ${apt.paymentType} | ${apt.date}`);
      });
    }
    
    const cancelledCard = await prisma.appointment.findMany({
      where: {
        status: 'cancelled',
        paymentType: 'card'
      }
    });
    
    console.log(`\n✅ Cancelled + Card: ${cancelledCard.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
