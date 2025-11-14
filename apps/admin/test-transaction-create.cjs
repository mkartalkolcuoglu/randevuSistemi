const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Read DATABASE_URL from .env.local
const envPath = path.join(__dirname, '.env.local');
let dbUrl = null;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const dbUrlMatch = envContent.match(/DATABASE_URL="?(.+?)"?$/m);
  if (dbUrlMatch) {
    dbUrl = dbUrlMatch[1].replace(/"/g, '');
  }
}

if (!dbUrl) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

process.env.DATABASE_URL = dbUrl;
const prisma = new PrismaClient();

async function testCardPaymentTransactions() {
  try {
    console.log('\n🔍 Analyzing card payment transactions issue...\n');

    // 1. Find card payment appointments
    console.log('1️⃣ Finding card payment appointments...\n');
    const cardAppointments = await prisma.appointment.findMany({
      where: {
        paymentType: 'card',
        status: { in: ['completed', 'confirmed'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`   Found ${cardAppointments.length} card payment appointments\n`);

    // 2. Check which ones have transactions
    for (const apt of cardAppointments) {
      console.log(`\n📋 Appointment ID: ${apt.id}`);
      console.log(`   Customer: ${apt.customerName}`);
      console.log(`   Service: ${apt.serviceName}`);
      console.log(`   Price: ${apt.price} TL`);
      console.log(`   Payment Type: ${apt.paymentType}`);
      console.log(`   Status: ${apt.status}`);
      console.log(`   Date: ${apt.date}`);
      console.log(`   Has Package: ${apt.packageInfo ? 'YES' : 'NO'}`);

      const transaction = await prisma.transaction.findFirst({
        where: {
          appointmentId: apt.id,
          type: 'appointment'
        }
      });

      if (transaction) {
        console.log(`   ✅ Transaction EXISTS`);
        console.log(`      Transaction ID: ${transaction.id}`);
        console.log(`      Amount: ${transaction.amount} TL`);
        console.log(`      Payment Type: ${transaction.paymentType}`);

        if (transaction.paymentType !== apt.paymentType) {
          console.log(`   ⚠️  MISMATCH! Appointment: ${apt.paymentType}, Transaction: ${transaction.paymentType}`);
        }
      } else {
        console.log(`   ❌ Transaction MISSING!`);
        console.log(`   🔧 This should have been created when status changed to ${apt.status}`);
      }
    }

    // 3. Summary
    console.log('\n\n📊 SUMMARY\n');

    const total = cardAppointments.length;
    let withTransaction = 0;
    let withoutTransaction = 0;
    let mismatch = 0;

    for (const apt of cardAppointments) {
      const transaction = await prisma.transaction.findFirst({
        where: { appointmentId: apt.id, type: 'appointment' }
      });

      if (transaction) {
        withTransaction++;
        if (transaction.paymentType !== apt.paymentType) {
          mismatch++;
        }
      } else {
        withoutTransaction++;
      }
    }

    console.log(`Total card payment appointments: ${total}`);
    console.log(`With transaction: ${withTransaction}`);
    console.log(`Without transaction: ${withoutTransaction}`);
    console.log(`Payment type mismatch: ${mismatch}`);

    if (withoutTransaction > 0) {
      console.log(`\n⚠️  PROBLEM: ${withoutTransaction} card payment appointments don't have transactions!`);
    }

    if (mismatch > 0) {
      console.log(`\n⚠️  PROBLEM: ${mismatch} transactions have wrong payment type!`);
    }

    console.log('\n✅ Analysis complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCardPaymentTransactions();
