import { db } from '../lib/sqlite';

console.log('🌱 Seeding SQLite database...');

// Clear existing data
db.prepare('DELETE FROM tenants').run();

// Insert sample tenants
const tenants = [
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
      primaryColor: '#EC4899',
      secondaryColor: '#BE185D',
      logo: '',
      headerImage: ''
    }),
    createdAt: new Date().toISOString()
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
      primaryColor: '#059669',
      secondaryColor: '#ecfdf5',
      logo: '',
      headerImage: ''
    }),
    createdAt: new Date().toISOString()
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
      primaryColor: '#dc2626',
      secondaryColor: '#fef2f2',
      logo: '',
      headerImage: ''
    }),
    createdAt: new Date().toISOString()
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
      primaryColor: '#7c3aed',
      secondaryColor: '#f5f3ff',
      logo: '',
      headerImage: ''
    }),
    createdAt: new Date().toISOString()
  }
];

const insertTenant = db.prepare(`
  INSERT INTO tenants (
    id, businessName, slug, domain, ownerName, ownerEmail, phone, 
    plan, status, address, businessType, businessDescription, 
    monthlyRevenue, appointmentCount, customerCount, workingHours, theme, createdAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

tenants.forEach(tenant => {
  insertTenant.run(
    tenant.id,
    tenant.businessName,
    tenant.slug,
    tenant.domain,
    tenant.ownerName,
    tenant.ownerEmail,
    tenant.phone,
    tenant.plan,
    tenant.status,
    tenant.address,
    tenant.businessType,
    tenant.businessDescription,
    tenant.monthlyRevenue,
    tenant.appointmentCount,
    tenant.customerCount,
    tenant.workingHours,
    tenant.theme,
    tenant.createdAt
  );
});

console.log('✅ SQLite database seeded successfully!');
console.log(`Added ${tenants.length} tenants`);

// Verify the data
const count = db.prepare('SELECT COUNT(*) as count FROM tenants').get() as { count: number };
console.log(`Total tenants in database: ${count.count}`);

db.close();
