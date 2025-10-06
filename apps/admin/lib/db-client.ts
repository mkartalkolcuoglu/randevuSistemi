// Simple database client for admin panel
// This will work with SQLite database directly
import Database from 'better-sqlite3';
import path from 'path';

// Database path
const dbPath = path.join(process.cwd(), '../../server/prisma/dev.db');

export class DatabaseClient {
  private db: Database.Database;

  constructor() {
    this.db = new Database(dbPath);
  }

  // Customers
  async getCustomers(page = 1, limit = 20, search?: string, status?: string) {
    let query = 'SELECT * FROM Customer';
    const params: any[] = [];

    if (search) {
      query += ' WHERE (firstName LIKE ? OR lastName LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const customers = this.db.prepare(query).all(...params);
    const total = this.db.prepare('SELECT COUNT(*) as count FROM Customer').get() as { count: number };

    return {
      data: customers.map((customer: any) => ({
        ...customer,
        status: 'active', // Default status
        totalAppointments: 0, // Would need JOIN query
        totalSpent: 0, // Would need JOIN query
        favoriteServices: [], // Would need JOIN query
      })),
      total: total.count,
      page,
      limit,
      totalPages: Math.ceil(total.count / limit)
    };
  }

  async createCustomer(data: any) {
    const stmt = this.db.prepare(`
      INSERT INTO Customer (firstName, lastName, email, phone, dateOfBirth, address, notes, tenantId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const result = stmt.run(
      data.firstName,
      data.lastName,
      data.email,
      data.phone,
      data.dateOfBirth || null,
      data.address || null,
      data.notes || null,
      'demo-tenant-1', // Default tenant
      now,
      now
    );

    return { id: result.lastInsertRowid, ...data };
  }

  // Services
  async getServices(page = 1, limit = 20, search?: string, category?: string) {
    let query = 'SELECT * FROM Service';
    const params: any[] = [];

    if (search) {
      query += ' WHERE (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category && category !== 'all') {
      query += search ? ' AND category = ?' : ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const services = this.db.prepare(query).all(...params);
    const total = this.db.prepare('SELECT COUNT(*) as count FROM Service').get() as { count: number };

    return {
      data: services.map((service: any) => ({
        ...service,
        isActive: true, // Default
        popularity: 85, // Mock
        monthlyBookings: 45, // Mock
        totalRevenue: service.price * 45, // Mock
        staff: ['Demo Staff'], // Mock
      })),
      total: total.count,
      page,
      limit,
      totalPages: Math.ceil(total.count / limit)
    };
  }

  async createService(data: any) {
    const stmt = this.db.prepare(`
      INSERT INTO Service (name, description, price, durationMinutes, category, tenantId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const result = stmt.run(
      data.name,
      data.description || null,
      data.price,
      data.duration || 60,
      data.category || 'Genel',
      'demo-tenant-1', // Default tenant
      now,
      now
    );

    return { id: result.lastInsertRowid, ...data };
  }

  // Appointments
  async getAppointments(page = 1, limit = 20, search?: string, status?: string, date?: string) {
    let query = `
      SELECT 
        a.*,
        c.firstName as customerFirstName,
        c.lastName as customerLastName,
        c.email as customerEmail,
        c.phone as customerPhone,
        s.name as serviceName,
        s.price as servicePrice,
        s.durationMinutes as serviceDuration
      FROM Appointment a
      LEFT JOIN Customer c ON a.customerId = c.id
      LEFT JOIN Service s ON a.serviceId = s.id
    `;
    const params: any[] = [];

    if (search) {
      query += ' WHERE (c.firstName LIKE ? OR c.lastName LIKE ? OR s.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status && status !== 'all') {
      query += search ? ' AND a.status = ?' : ' WHERE a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY a.startAt DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const appointments = this.db.prepare(query).all(...params);
    const total = this.db.prepare('SELECT COUNT(*) as count FROM Appointment').get() as { count: number };

    return {
      data: appointments.map((appointment: any) => ({
        id: appointment.id,
        customer: {
          name: `${appointment.customerFirstName} ${appointment.customerLastName}`.trim(),
          email: appointment.customerEmail,
          phone: appointment.customerPhone
        },
        service: {
          name: appointment.serviceName,
          duration: appointment.serviceDuration,
          price: appointment.servicePrice
        },
        staff: 'Demo Staff', // Mock
        date: appointment.startAt?.split('T')[0] || '',
        time: appointment.startAt?.split('T')[1]?.split(':').slice(0, 2).join(':') || '',
        status: appointment.status,
        notes: appointment.notes,
        createdAt: appointment.createdAt
      })),
      total: total.count,
      page,
      limit,
      totalPages: Math.ceil(total.count / limit)
    };
  }

  async createAppointment(data: any) {
    // First create customer if new
    let customerId = data.customerId;
    if (!customerId && data.customerName) {
      const customerResult = await this.createCustomer({
        firstName: data.customerName.split(' ')[0] || '',
        lastName: data.customerName.split(' ').slice(1).join(' ') || '',
        email: data.customerEmail || '',
        phone: data.customerPhone || '',
      });
      customerId = customerResult.id;
    }

    const stmt = this.db.prepare(`
      INSERT INTO Appointment (customerId, serviceId, startAt, status, notes, tenantId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const startAt = `${data.date}T${data.time}:00.000Z`;
    const now = new Date().toISOString();
    
    const result = stmt.run(
      customerId,
      data.serviceId,
      startAt,
      data.status || 'pending',
      data.notes || null,
      'demo-tenant-1', // Default tenant
      now,
      now
    );

    return { id: result.lastInsertRowid, ...data };
  }

  // Staff
  async getStaff(page = 1, limit = 20, search?: string, status?: string) {
    let query = `
      SELECT 
        s.*,
        u.firstName,
        u.lastName,
        u.email
      FROM Staff s
      LEFT JOIN User u ON s.userId = u.id
    `;
    const params: any[] = [];

    if (search) {
      query += ' WHERE (u.firstName LIKE ? OR u.lastName LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY u.firstName ASC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const staff = this.db.prepare(query).all(...params);
    const total = this.db.prepare('SELECT COUNT(*) as count FROM Staff').get() as { count: number };

    return {
      data: staff.map((member: any) => ({
        id: member.id,
        firstName: member.firstName || 'Demo',
        lastName: member.lastName || 'Staff',
        email: member.email || 'demo@staff.com',
        phone: '+90 555 000 0000', // Mock
        position: member.position || 'Uzman',
        specializations: ['Demo Hizmet'], // Mock
        experience: 3, // Mock
        rating: 4.5, // Mock
        status: 'active', // Mock
        salary: 5000, // Mock
        monthlyAppointments: 30, // Mock
        monthlyRevenue: 4500, // Mock
      })),
      total: total.count,
      page,
      limit,
      totalPages: Math.ceil(total.count / limit)
    };
  }

  // Dashboard Stats
  async getDashboardStats() {
    const totalCustomers = this.db.prepare('SELECT COUNT(*) as count FROM Customer').get() as { count: number };
    const totalServices = this.db.prepare('SELECT COUNT(*) as count FROM Service').get() as { count: number };
    const totalAppointments = this.db.prepare('SELECT COUNT(*) as count FROM Appointment').get() as { count: number };
    
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = this.db.prepare(
      'SELECT COUNT(*) as count FROM Appointment WHERE DATE(startAt) = ?'
    ).get(today) as { count: number };

    return {
      totalCustomers: totalCustomers.count,
      totalServices: totalServices.count,
      totalAppointments: totalAppointments.count,
      todayAppointments: todayAppointments.count,
      pendingAppointments: 3, // Mock
      monthlyRevenue: 15000, // Mock
    };
  }

  close() {
    this.db.close();
  }
}

export const dbClient = new DatabaseClient();
