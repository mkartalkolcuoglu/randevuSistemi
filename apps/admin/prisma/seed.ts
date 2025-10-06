import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding admin database...')

  // Clear existing data
  await prisma.appointment.deleteMany()
  await prisma.task.deleteMany()
  await prisma.service.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.settings.deleteMany()

  // Create staff
  const staff = await prisma.staff.createMany({
    data: [
      {
        id: "1",
        firstName: "Merve",
        lastName: "Kaya",
        email: "merve@salon.com",
        phone: "+90 532 123 4567",
        position: "Kuaför",
        status: "active"
      },
      {
        id: "2",
        firstName: "Ayşe",
        lastName: "Demir",
        email: "ayse@salon.com",
        phone: "+90 532 234 5678",
        position: "Estetisyen",
        status: "active"
      },
      {
        id: "3",
        firstName: "Fatma",
        lastName: "Yılmaz",
        email: "fatma@salon.com",
        phone: "+90 532 345 6789",
        position: "Masöz",
        status: "active"
      }
    ]
  })

  // Create customers
  const customers = await prisma.customer.createMany({
    data: [
      {
        id: "1",
        firstName: "Elif",
        lastName: "Özkan",
        email: "elif@email.com",
        phone: "+90 533 111 2233",
        birthDate: new Date("1990-05-15"),
        status: "active"
      },
      {
        id: "2",
        firstName: "Zeynep",
        lastName: "Çelik",
        email: "zeynep@email.com",
        phone: "+90 533 222 3344",
        birthDate: new Date("1985-08-22"),
        status: "active"
      },
      {
        id: "3",
        firstName: "Selin",
        lastName: "Kara",
        email: "selin@email.com",
        phone: "+90 533 333 4455",
        birthDate: new Date("1992-12-10"),
        status: "active"
      }
    ]
  })

  // Create services
  const services = await prisma.service.createMany({
    data: [
      {
        id: "1",
        name: "Saç Kesimi",
        description: "Profesyonel saç kesimi ve şekillendirme",
        price: 150,
        duration: 45,
        category: "Saç Bakımı",
        status: "active"
      },
      {
        id: "2",
        name: "Manikür",
        description: "El bakımı ve oje uygulaması",
        price: 80,
        duration: 30,
        category: "Tırnak Bakımı",
        status: "active"
      },
      {
        id: "3",
        name: "Pedikür",
        description: "Ayak bakımı ve oje uygulaması",
        price: 100,
        duration: 45,
        category: "Tırnak Bakımı",
        status: "active"
      },
      {
        id: "4",
        name: "Cilt Bakımı",
        description: "Profesyonel cilt bakım uygulaması",
        price: 200,
        duration: 60,
        category: "Cilt Bakımı",
        status: "active"
      }
    ]
  })

  // Create appointments
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const appointments = await prisma.appointment.createMany({
    data: [
      {
        id: "1",
        customerId: "1",
        customerName: "Elif Özkan",
        serviceId: "1",
        serviceName: "Saç Kesimi",
        staffId: "1",
        staffName: "Merve Kaya",
        date: today.toISOString().split('T')[0],
        time: "10:00",
        status: "scheduled",
        price: 150,
        duration: 45
      },
      {
        id: "2",
        customerId: "2",
        customerName: "Zeynep Çelik",
        serviceId: "2",
        serviceName: "Manikür",
        staffId: "2",
        staffName: "Ayşe Demir",
        date: today.toISOString().split('T')[0],
        time: "14:30",
        status: "scheduled",
        price: 80,
        duration: 30
      },
      {
        id: "3",
        customerId: "3",
        customerName: "Selin Kara",
        serviceId: "4",
        serviceName: "Cilt Bakımı",
        staffId: "2",
        staffName: "Ayşe Demir",
        date: tomorrow.toISOString().split('T')[0],
        time: "11:00",
        status: "scheduled",
        price: 200,
        duration: 60
      }
    ]
  })

  // Create tasks
  const tasks = await prisma.task.createMany({
    data: [
      {
        id: "1",
        title: "Müşteri geri bildirimlerini değerlendir",
        description: "Geçen haftaki müşteri yorumlarını incele ve iyileştirme önerilerini hazırla",
        assignedTo: "Merve Kaya",
        priority: "high",
        status: "pending",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
      },
      {
        id: "2",
        title: "Yeni ürün stoklarını kontrol et",
        description: "Saç bakım ürünleri ve kozmetik malzemelerinin stok durumunu kontrol et",
        assignedTo: "Ayşe Demir",
        priority: "medium",
        status: "in_progress",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
      },
      {
        id: "3",
        title: "Sosyal medya paylaşımlarını planla",
        description: "Gelecek hafta için Instagram ve Facebook paylaşımlarını hazırla",
        assignedTo: "Fatma Yılmaz",
        priority: "low",
        status: "completed"
      }
    ]
  })

  // Create settings
  const settings = await prisma.settings.create({
    data: {
      businessName: "Güzellik Merkezi",
      businessAddress: "Beşiktaş Mahallesi, Güzellik Sokak No:123, 34357 Beşiktaş/İstanbul",
      businessPhone: "+90 212 555 0123",
      businessEmail: "info@guzellikmerkezi.com",
      workingHours: JSON.stringify({
        monday: { start: "09:00", end: "18:00", closed: false },
        tuesday: { start: "09:00", end: "18:00", closed: false },
        wednesday: { start: "09:00", end: "18:00", closed: false },
        thursday: { start: "09:00", end: "18:00", closed: false },
        friday: { start: "09:00", end: "18:00", closed: false },
        saturday: { start: "09:00", end: "17:00", closed: false },
        sunday: { start: "10:00", end: "16:00", closed: true }
      }),
      notificationSettings: JSON.stringify({
        emailNotifications: true,
        smsNotifications: true,
        appointmentReminders: true,
        marketingEmails: false
      }),
      paymentSettings: JSON.stringify({
        acceptCash: true,
        acceptCard: true,
        acceptDigital: true,
        taxRate: 18
      })
    }
  })

  console.log('✅ Admin database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
