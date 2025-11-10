// Test Prisma connection and query
// Run with: npx tsx test-prisma-connection.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  try {
    console.log('🔍 Testing Prisma connection...');

    // Test 1: Count appointments
    const count = await prisma.appointment.count();
    console.log('✅ Total appointments:', count);

    // Test 2: Fetch 1 appointment
    const appointment = await prisma.appointment.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    console.log('✅ Latest appointment:', appointment);

    // Test 3: Fetch with specific tenantId
    const tenantId = 'cmgtljuhy0000jp04w9vtngz2';
    const tenantAppointments = await prisma.appointment.findMany({
      where: { tenantId },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log(`✅ Appointments for tenant ${tenantId}:`, tenantAppointments.length);

    if (tenantAppointments.length > 0) {
      console.log('First appointment:', tenantAppointments[0]);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
