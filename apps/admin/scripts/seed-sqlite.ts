import { db } from '../lib/sqlite';

console.log('🌱 Seeding admin SQLite database...');

// Clear existing data
db.prepare('DELETE FROM appointments').run();
db.prepare('DELETE FROM tasks').run();
db.prepare('DELETE FROM services').run();
db.prepare('DELETE FROM customers').run();
db.prepare('DELETE FROM staff').run();
db.prepare('DELETE FROM settings').run();
db.prepare('DELETE FROM tenants').run();

// Create sample tenant
const tenantId = 'demo-tenant-1';
const insertTenant = db.prepare(`
  INSERT INTO tenants (
    id, businessName, slug, username, password, ownerName, ownerEmail, 
    phone, address, businessType, businessDescription, status, 
    workingHours, theme, createdAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertTenant.run(
  tenantId,
  'Demo Güzellik Salonu',
  'demo-guzellik',
  'demosalon',
  'demo123',
  'Ayşe Kaya',
  'ayse@demosalon.com',
  '+90 212 555 0123',
  'Beşiktaş Mahallesi, Güzellik Sokak No:123, 34357 Beşiktaş/İstanbul',
  'salon',
  'Profesyonel güzellik ve bakım hizmetleri',
  'active',
  JSON.stringify({
    monday: { start: '09:00', end: '18:00', closed: false },
    tuesday: { start: '09:00', end: '18:00', closed: false },
    wednesday: { start: '09:00', end: '18:00', closed: false },
    thursday: { start: '09:00', end: '18:00', closed: false },
    friday: { start: '09:00', end: '18:00', closed: false },
    saturday: { start: '09:00', end: '17:00', closed: false },
    sunday: { start: '10:00', end: '16:00', closed: true }
  }),
  JSON.stringify({
    primaryColor: '#EC4899',
    secondaryColor: '#BE185D',
    logo: '',
    headerImage: ''
  }),
  new Date().toISOString()
);

// Create staff
const staff = [
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
];

const insertStaff = db.prepare(`
  INSERT INTO staff (
    id, tenantId, firstName, lastName, email, phone, position, status, createdAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

staff.forEach(s => {
  insertStaff.run(
    s.id, tenantId, s.firstName, s.lastName, s.email, s.phone, s.position, s.status,
    new Date().toISOString()
  );
});

// Create customers
const customers = [
  {
    id: "1",
    firstName: "Elif",
    lastName: "Özkan",
    email: "elif@email.com",
    phone: "+90 533 111 2233",
    birthDate: new Date("1990-05-15").toISOString(),
    status: "active"
  },
  {
    id: "2",
    firstName: "Zeynep",
    lastName: "Çelik",
    email: "zeynep@email.com",
    phone: "+90 533 222 3344",
    birthDate: new Date("1985-08-22").toISOString(),
    status: "active"
  },
  {
    id: "3",
    firstName: "Selin",
    lastName: "Kara",
    email: "selin@email.com",
    phone: "+90 533 333 4455",
    birthDate: new Date("1992-12-10").toISOString(),
    status: "active"
  }
];

const insertCustomer = db.prepare(`
  INSERT INTO customers (
    id, tenantId, firstName, lastName, email, phone, birthDate, status, createdAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

customers.forEach(c => {
  insertCustomer.run(
    c.id, tenantId, c.firstName, c.lastName, c.email, c.phone, c.birthDate, c.status,
    new Date().toISOString()
  );
});

// Create services
const services = [
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
];

const insertService = db.prepare(`
  INSERT INTO services (
    id, tenantId, name, description, price, duration, category, status, createdAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

services.forEach(s => {
  insertService.run(
    s.id, tenantId, s.name, s.description, s.price, s.duration, s.category, s.status,
    new Date().toISOString()
  );
});

// Create appointments
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const appointments = [
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
];

const insertAppointment = db.prepare(`
  INSERT INTO appointments (
    id, tenantId, customerId, customerName, serviceId, serviceName, 
    staffId, staffName, date, time, status, price, duration, createdAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

appointments.forEach(a => {
  insertAppointment.run(
    a.id, tenantId, a.customerId, a.customerName, a.serviceId, a.serviceName,
    a.staffId, a.staffName, a.date, a.time, a.status, a.price, a.duration,
    new Date().toISOString()
  );
});

// Create tasks
const tasks = [
  {
    id: "1",
    title: "Müşteri geri bildirimlerini değerlendir",
    description: "Geçen haftaki müşteri yorumlarını incele ve iyileştirme önerilerini hazırla",
    assignedTo: "Merve Kaya",
    priority: "high",
    status: "pending",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "2",
    title: "Yeni ürün stoklarını kontrol et",
    description: "Saç bakım ürünleri ve kozmetik malzemelerinin stok durumunu kontrol et",
    assignedTo: "Ayşe Demir",
    priority: "medium",
    status: "in_progress",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "3",
    title: "Sosyal medya paylaşımlarını planla",
    description: "Gelecek hafta için Instagram ve Facebook paylaşımlarını hazırla",
    assignedTo: "Fatma Yılmaz",
    priority: "low",
    status: "completed",
    dueDate: null
  }
];

const insertTask = db.prepare(`
  INSERT INTO tasks (
    id, tenantId, title, description, assignedTo, priority, status, dueDate, createdAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

tasks.forEach(t => {
  insertTask.run(
    t.id, tenantId, t.title, t.description, t.assignedTo, t.priority, t.status, t.dueDate,
    new Date().toISOString()
  );
});

// Create settings
const insertSettings = db.prepare(`
  INSERT INTO settings (
    id, tenantId, businessName, businessAddress, businessPhone, businessEmail,
    workingHours, notificationSettings, paymentSettings
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertSettings.run(
  `settings-${tenantId}`,
  tenantId,
  "Demo Güzellik Salonu",
  "Beşiktaş Mahallesi, Güzellik Sokak No:123, 34357 Beşiktaş/İstanbul",
  "+90 212 555 0123",
  "ayse@demosalon.com",
  JSON.stringify({
    monday: { start: "09:00", end: "18:00", closed: false },
    tuesday: { start: "09:00", end: "18:00", closed: false },
    wednesday: { start: "09:00", end: "18:00", closed: false },
    thursday: { start: "09:00", end: "18:00", closed: false },
    friday: { start: "09:00", end: "18:00", closed: false },
    saturday: { start: "09:00", end: "17:00", closed: false },
    sunday: { start: "10:00", end: "16:00", closed: true }
  }),
  JSON.stringify({
    emailNotifications: true,
    smsNotifications: true,
    appointmentReminders: true,
    marketingEmails: false
  }),
  JSON.stringify({
    acceptCash: true,
    acceptCard: true,
    acceptDigital: true,
    taxRate: 18
  })
);

console.log('✅ Admin SQLite database seeded successfully!');
console.log(`✅ Demo tenant created:`);
console.log(`   Business: Demo Güzellik Salonu`);
console.log(`   Username: demosalon`);
console.log(`   Password: demo123`);
console.log(`   Login URL: http://localhost:3001/login`);

// Verify the data
const tenantCount = db.prepare('SELECT COUNT(*) as count FROM tenants').get() as { count: number };
const staffCount = db.prepare('SELECT COUNT(*) as count FROM staff').get() as { count: number };
const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number };
const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get() as { count: number };
const appointmentCount = db.prepare('SELECT COUNT(*) as count FROM appointments').get() as { count: number };

console.log(`📊 Database statistics:`);
console.log(`   Tenants: ${tenantCount.count}`);
console.log(`   Staff: ${staffCount.count}`);
console.log(`   Customers: ${customerCount.count}`);
console.log(`   Services: ${serviceCount.count}`);
console.log(`   Appointments: ${appointmentCount.count}`);

db.close();
