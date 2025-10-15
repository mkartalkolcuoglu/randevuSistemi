import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function md5Hash(password: string): string {
  return crypto.createHash('md5').update(password).digest('hex');
}

async function main() {
  console.log('🌱 Seeding admin user...');

  const username = 'yonetim';
  const password = 'Ozan.1903*?';
  const hashedPassword = md5Hash(password);

  console.log(`Username: ${username}`);
  console.log(`Password: ${password}`);
  console.log(`MD5 Hash: ${hashedPassword}`);

  // Check if admin already exists
  const existingAdmin = await prisma.admin.findUnique({
    where: { username }
  });

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists. Updating password...');
    await prisma.admin.update({
      where: { username },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });
    console.log('✅ Admin password updated!');
  } else {
    console.log('✨ Creating new admin user...');
    await prisma.admin.create({
      data: {
        username,
        password: hashedPassword
      }
    });
    console.log('✅ Admin user created!');
  }

  console.log('\n📋 Admin Credentials:');
  console.log('Username:', username);
  console.log('Password:', password);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

