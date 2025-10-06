// Global store for Project Admin mock data
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'tenants.json');

declare global {
  var mockTenants: any[] | undefined;
  var mockIntegrations: any[] | undefined;
  var mockSupportTickets: any[] | undefined;
  var mockSlaMetrics: any[] | undefined;
  var mockPlatformReports: any[] | undefined;
}

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load from file or create initial data
function loadTenantsFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('Error loading tenants from file, using default data');
  }
  return null;
}

// Save to file
function saveTenantsToFile(tenants: any[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tenants, null, 2));
  } catch (error) {
    console.error('Error saving tenants to file:', error);
  }
}

// Initialize mock tenants (subscribers/aboneler)
if (!global.mockTenants) {
  const savedTenants = loadTenantsFromFile();
  global.mockTenants = savedTenants || [
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
      createdAt: "2024-01-15T10:00:00Z",
      lastLogin: "2024-09-25T14:30:00Z",
      monthlyRevenue: 450,
      appointmentCount: 125,
      customerCount: 89,
      address: "Beşiktaş Mahallesi, Güzellik Sokak No:123, 34357 Beşiktaş/İstanbul"
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
      createdAt: "2024-02-20T12:00:00Z",
      lastLogin: "2024-09-24T16:45:00Z",
      monthlyRevenue: 350,
      appointmentCount: 98,
      customerCount: 67,
      address: "Kadıköy Mahallesi, Berber Caddesi No:45, 34710 Kadıköy/İstanbul"
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
      createdAt: "2024-03-10T08:00:00Z",
      lastLogin: "2024-09-25T09:15:00Z",
      monthlyRevenue: 750,
      appointmentCount: 156,
      customerCount: 112,
      address: "Şişli Mahallesi, Sağlık Sokak No:78, 34380 Şişli/İstanbul"
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
      createdAt: "2024-04-05T15:30:00Z",
      lastLogin: "2024-09-20T11:20:00Z",
      monthlyRevenue: 0,
      appointmentCount: 45,
      customerCount: 34,
      address: "Beyoğlu Mahallesi, Spor Caddesi No:12, 34440 Beyoğlu/İstanbul"
    }
  ];
}

// Initialize mock integrations
if (!global.mockIntegrations) {
  global.mockIntegrations = [
    {
      id: "1",
      name: "Iyzico Payment",
      type: "payment", 
      status: "active",
      description: "Kredi kartı ödemeleri",
      tenantCount: 85,
      lastUpdate: "2024-09-20T10:00:00Z"
    },
    {
      id: "2",
      name: "PayTR Payment",
      type: "payment",
      status: "active", 
      description: "Alternatif ödeme yöntemleri",
      tenantCount: 23,
      lastUpdate: "2024-09-18T14:30:00Z"
    },
    {
      id: "3",
      name: "Twilio SMS",
      type: "sms",
      status: "maintenance",
      description: "SMS bildirimleri",
      tenantCount: 92,
      lastUpdate: "2024-09-25T09:15:00Z"
    }
  ];
}

// Initialize mock support tickets
if (!global.mockSupportTickets) {
  global.mockSupportTickets = [
    {
      id: "1",
      tenantId: "1",
      tenantName: "Demo Güzellik Salonu",
      subject: "Ödeme entegrasyonu sorunu",
      description: "Kredi kartı ödemeleri alınamıyor",
      priority: "high",
      status: "open",
      assignedTo: "Destek Ekibi",
      createdAt: "2024-09-25T10:30:00Z",
      updatedAt: "2024-09-25T11:45:00Z"
    },
    {
      id: "2", 
      tenantId: "2",
      tenantName: "Modern Berber",
      subject: "SMS bildirimleri çalışmıyor",
      description: "Müşterilere randevu hatırlatması gitmiyor",
      priority: "medium",
      status: "in_progress", 
      assignedTo: "Teknik Ekip",
      createdAt: "2024-09-24T14:20:00Z",
      updatedAt: "2024-09-25T08:30:00Z"
    }
  ];
}

// Initialize mock SLA metrics
if (!global.mockSlaMetrics) {
  global.mockSlaMetrics = [
    {
      id: "1",
      tenantId: "1",
      tenantName: "Demo Güzellik Salonu",
      uptime: 99.8,
      responseTime: 245,
      ticketResolutionTime: 4.2,
      month: "2024-09"
    },
    {
      id: "2", 
      tenantId: "2",
      tenantName: "Modern Berber", 
      uptime: 99.5,
      responseTime: 312,
      ticketResolutionTime: 6.1,
      month: "2024-09"
    }
  ];
}

// Getter and setter functions
export function getTenantsData() {
  return global.mockTenants || [];
}

export function setTenantsData(data: any[]) {
  global.mockTenants = data;
  saveTenantsToFile(data);
}

export function getIntegrationsData() {
  return global.mockIntegrations || [];
}

export function setIntegrationsData(data: any[]) {
  global.mockIntegrations = data;
}

export function getSupportTicketsData() {
  return global.mockSupportTickets || [];
}

export function setSupportTicketsData(data: any[]) {
  global.mockSupportTickets = data;
}

export function getSlaMetricsData() {
  return global.mockSlaMetrics || [];
}

export function setSlaMetricsData(data: any[]) {
  global.mockSlaMetrics = data;
}

export function getNextId(data: any[]): string {
  const maxId = data.reduce((max, item) => {
    const id = parseInt(item.id);
    return id > max ? id : max;
  }, 0);
  return (maxId + 1).toString();
}
