const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// Read DATABASE_URL from .env.production
const envPath = '/Users/kartal.kolcuoglu/Desktop/randevu/apps/admin/.env.production';
if (!fs.existsSync(envPath)) {
  console.error('.env.production not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL="(.+?)"/);

if (!dbUrlMatch) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

process.env.DATABASE_URL = dbUrlMatch[1];
const prisma = new PrismaClient();

async function checkCardPayments() {
  try {
    console.log('\n📊 Checking card payment appointments...\n');

    // Find completed appointments with card payment
    const cardAppointments = await prisma.appointment.findMany({
      where: {
        paymentType: 'card',
        status: { in: ['completed', 'confirmed'] }
      },
      orderBy: { date: 'desc' },
      take: 10,
      select: {
        id: true,
        customerName: true,
        serviceName: true,
        price: true,
        paymentType: true,
        status: true,
        date: true,
        tenantId: true,
        packageInfo: true
      }
    });

    console.log(`Found ${cardAppointments.length} card payment appointments\n`);

    for (const apt of cardAppointments) {
      console.log(`\n📋 Appointment: ${apt.customerName} - ${apt.serviceName}`);
      console.log(`   ID: ${apt.id}`);
      console.log(`   Price: ${apt.price} TL`);
      console.log(`   Payment: ${apt.paymentType}`);
      console.log(`   Status: ${apt.status}`);
      console.log(`   Date: ${apt.date}`);
      console.log(`   Has Package: ${apt.packageInfo ? 'YES' : 'NO'}`);

      // Check if transaction exists
      const transaction = await prisma.transaction.findFirst({
        where: {
          appointmentId: apt.id,
          type: 'appointment'
        }
      });

      if (transaction) {
        console.log(`   ✅ Transaction EXISTS: ${transaction.id} (${transaction.amount} TL, ${transaction.paymentType})`);
      } else {
        console.log(`   ❌ Transaction MISSING!`);
      }
    }

    console.log('\n✅ Done!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCardPayments();
