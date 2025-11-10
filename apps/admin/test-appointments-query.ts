// Quick test to see if Prisma can query appointments
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testAppointments() {
  try {
    console.log('🔍 Testing appointments query...');

    const tenantId = 'cmgtljuhy0000jp04w9vtngz2';

    const appointments = await prisma.appointment.findMany({
      where: { tenantId },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ],
      take: 5
    });

    console.log('✅ Found', appointments.length, 'appointments');

    if (appointments.length > 0) {
      console.log('📋 First appointment:', appointments[0]);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('❌ Message:', error.message);
      console.error('❌ Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testAppointments();
