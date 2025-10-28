import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.tenant.deleteMany()
  await prisma.integration.deleteMany()
  await prisma.supportTicket.deleteMany()
  await prisma.slaMetric.deleteMany()
  await prisma.admin.deleteMany()

  // Create admin user
  await prisma.admin.create({
    data: {
      id: "admin-1",
      username: "admin",
      password: "0192023a7bbd73250516f069df18b500", // MD5 hash of "admin123"
    }
  })
  
  console.log('✅ Created admin user: admin/admin123')

  // Create tenants
  await prisma.tenant.createMany({
    data: [
      {
        id: "1",
        businessName: "Demo Güzellik Salonu",
        slug: "demo-guzellik",
        domain: "demo-guzellik.randevu.com",
        ownerName: "Ayşe Kaya",
        ownerEmail: "ayse@demosalon.com",
        phone: "+90 212 555 0123",
        plan: "Premium",
        status: "active",
        address: "Beşiktaş Mahallesi, Güzellik Sokak No:123, 34357 Beşiktaş/İstanbul",
        businessType: "salon",
        businessDescription: "Profesyonel güzellik ve bakım hizmetleri",
        monthlyRevenue: 450,
        appointmentCount: 125,
        customerCount: 89,
        workingHours: JSON.stringify({
          monday: { start: '09:00', end: '18:00', closed: false },
          tuesday: { start: '09:00', end: '18:00', closed: false },
          wednesday: { start: '09:00', end: '18:00', closed: false },
          thursday: { start: '09:00', end: '18:00', closed: false },
          friday: { start: '09:00', end: '18:00', closed: false },
          saturday: { start: '09:00', end: '17:00', closed: false },
          sunday: { start: '10:00', end: '16:00', closed: true }
        }),
        theme: JSON.stringify({
               primaryColor: '#163974',
               secondaryColor: '#0F2A52',
          logo: '',
          headerImage: ''
        })
      },
      {
        id: "2",
        businessName: "Modern Berber",
        slug: "modern-berber",
        domain: "modern-berber.randevu.com",
        ownerName: "Mehmet Demir",
        ownerEmail: "mehmet@modernberber.com",
        phone: "+90 212 555 0456",
        plan: "Standard",
        status: "active",
        address: "Kadıköy Mahallesi, Berber Caddesi No:45, 34710 Kadıköy/İstanbul",
        businessType: "barber",
        businessDescription: "Modern erkek kuaförlük hizmetleri",
        monthlyRevenue: 350,
        appointmentCount: 98,
        customerCount: 67,
        workingHours: JSON.stringify({
          monday: { start: '09:00', end: '18:00', closed: false },
          tuesday: { start: '09:00', end: '18:00', closed: false },
          wednesday: { start: '09:00', end: '18:00', closed: false },
          thursday: { start: '09:00', end: '18:00', closed: false },
          friday: { start: '09:00', end: '18:00', closed: false },
          saturday: { start: '09:00', end: '17:00', closed: false },
          sunday: { start: '10:00', end: '16:00', closed: true }
        }),
        theme: JSON.stringify({
          primaryColor: '#163974',
          secondaryColor: '#0F2A52',
          logo: '',
          headerImage: ''
        })
      },
      {
        id: "3",
        businessName: "Sağlık Klinik",
        slug: "saglik-klinik",
        domain: "saglik-klinik.randevu.com",
        ownerName: "Dr. Fatma Öz",
        ownerEmail: "fatma@saglik.com",
        phone: "+90 212 555 0789",
        plan: "Enterprise",
        status: "active",
        address: "Şişli Mahallesi, Sağlık Sokak No:78, 34380 Şişli/İstanbul",
        businessType: "clinic",
        businessDescription: "Uzman doktor kadromuz ile sağlık hizmetleri",
        monthlyRevenue: 750,
        appointmentCount: 156,
        customerCount: 112,
        workingHours: JSON.stringify({
          monday: { start: '08:00', end: '18:00', closed: false },
          tuesday: { start: '08:00', end: '18:00', closed: false },
          wednesday: { start: '08:00', end: '18:00', closed: false },
          thursday: { start: '08:00', end: '18:00', closed: false },
          friday: { start: '08:00', end: '18:00', closed: false },
          saturday: { start: '09:00', end: '15:00', closed: false },
          sunday: { start: '10:00', end: '16:00', closed: true }
        }),
        theme: JSON.stringify({
          primaryColor: '#163974',
          secondaryColor: '#0F2A52',
          logo: '',
          headerImage: ''
        })
      },
      {
        id: "4",
        businessName: "Fitness Studio",
        slug: "fitness-studio",
        domain: "fitness-studio.randevu.com",
        ownerName: "Ali Yıldız",
        ownerEmail: "ali@fitness.com",
        phone: "+90 212 555 0321",
        plan: "Standard",
        status: "suspended",
        address: "Beyoğlu Mahallesi, Spor Caddesi No:12, 34440 Beyoğlu/İstanbul",
        businessType: "fitness",
        businessDescription: "Fitness ve spor hizmetleri",
        monthlyRevenue: 0,
        appointmentCount: 45,
        customerCount: 34,
        workingHours: JSON.stringify({
          monday: { start: '06:00', end: '22:00', closed: false },
          tuesday: { start: '06:00', end: '22:00', closed: false },
          wednesday: { start: '06:00', end: '22:00', closed: false },
          thursday: { start: '06:00', end: '22:00', closed: false },
          friday: { start: '06:00', end: '22:00', closed: false },
          saturday: { start: '08:00', end: '20:00', closed: false },
          sunday: { start: '09:00', end: '18:00', closed: false }
        }),
        theme: JSON.stringify({
          primaryColor: '#163974',
          secondaryColor: '#0F2A52',
          logo: '',
          headerImage: ''
        })
      }
    ]
  })

  // Create integrations
  await prisma.integration.createMany({
    data: [
      {
        name: "Iyzico Payment",
        type: "payment",
        status: "active",
        description: "Kredi kartı ödemeleri",
        tenantCount: 85
      },
      {
        name: "PayTR Payment",
        type: "payment",
        status: "active",
        description: "Alternatif ödeme yöntemleri",
        tenantCount: 23
      },
      {
        name: "Twilio SMS",
        type: "sms",
        status: "maintenance",
        description: "SMS bildirimleri",
        tenantCount: 92
      }
    ]
  })

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
