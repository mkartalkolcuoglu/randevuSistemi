import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/sqlite';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    // Get tenant ID from session cookie (for admin panel)
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tenant-session');
    
    let sessionTenantId = null;
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        sessionTenantId = sessionData.tenantId;
      } catch (error) {
        // Session cookie is invalid, continue without tenant filter
      }
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const date = searchParams.get('date') || '';
    const tenantId = searchParams.get('tenantId') || sessionTenantId || '';

    let query = `
      SELECT 
        a.*,
        s.name as serviceName,
        s.duration as serviceDuration,
        st.firstName || ' ' || st.lastName as staffName
      FROM appointments a
      LEFT JOIN services s ON a.serviceId = s.id
      LEFT JOIN staff st ON a.staffId = st.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filter by tenant (from session or query param)
    if (tenantId) {
      query += ' AND a.tenantId = ?';
      params.push(tenantId);
    }

    if (search) {
      query += ' AND (a.customerName LIKE ? OR s.name LIKE ? OR (st.firstName || \' \' || st.lastName) LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status !== 'all') {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }

    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as count FROM');
    const totalResult = db.prepare(countQuery).get(...params) as { count: number };
    const total = totalResult.count;

    query += ' ORDER BY a.date DESC, a.time DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const appointments = db.prepare(query).all(...params);

    return NextResponse.json({
      success: true,
      data: appointments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointments' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Check if this is from web app (tenant appointment)
    if (data.tenantSlug) {
      // Handle tenant appointment from web - first find the actual tenant ID
      const tenant = db.prepare('SELECT id FROM tenants WHERE slug = ?').get(data.tenantSlug) as { id: string } | undefined;
      
      if (!tenant) {
        console.error('Tenant not found for slug:', data.tenantSlug);
        return NextResponse.json(
          { success: false, error: 'Tenant not found' },
          { status: 404, headers: corsHeaders }
        );
      }
      
      // Çakışma kontrolü yap
      const conflictCheck = db.prepare(`
        SELECT id FROM appointments 
        WHERE staffId = ? AND date = ? AND time = ? AND status != 'cancelled'
      `).get(data.staffId, data.date, data.time);
      
      if (conflictCheck) {
        return NextResponse.json(
          { success: false, error: 'Bu tarih ve saatte seçili personelin başka bir randevusu var' },
          { status: 409, headers: corsHeaders }
        );
      }
      
      // Staff bilgisini gerçek veritabanından al
      const staff = db.prepare('SELECT firstName, lastName FROM staff WHERE id = ?').get(data.staffId);
      const staffName = staff ? `${staff.firstName} ${staff.lastName}` : 'Bilinmeyen Personel';
      
      const appointmentId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const newAppointment = {
        id: appointmentId,
        tenantId: tenant.id, // Use actual tenant ID, not slug
        customerId: appointmentId + '-customer',
        customerName: data.customerName,
        customerPhone: data.customerPhone || '',
        customerEmail: data.customerEmail || '',
        serviceId: appointmentId + '-service',
        serviceName: data.serviceName,
        staffId: data.staffId,
        staffName: staffName,
        date: data.date,
        time: data.time,
        status: data.status || 'pending',
        notes: data.notes || '',
        price: data.price || 0,
        duration: data.duration || 60,
        paymentType: data.paymentType || 'cash',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Insert into database
      const insert = db.prepare(`
        INSERT INTO appointments (
          id, tenantId, customerId, customerName, customerPhone, customerEmail, serviceId, serviceName,
          staffId, staffName, date, time, status, notes, price, duration, paymentType, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insert.run(
        newAppointment.id, newAppointment.tenantId, newAppointment.customerId,
        newAppointment.customerName, newAppointment.customerPhone, newAppointment.customerEmail,
        newAppointment.serviceId, newAppointment.serviceName,
        newAppointment.staffId, newAppointment.staffName, newAppointment.date,
        newAppointment.time, newAppointment.status, newAppointment.notes,
        newAppointment.price, newAppointment.duration, newAppointment.paymentType, 
        newAppointment.createdAt, newAppointment.updatedAt
      );

      // Also create customer if email provided
      if (data.customerEmail) {
        const customerInsert = db.prepare(`
          INSERT OR IGNORE INTO customers (
            id, tenantId, firstName, lastName, email, phone, status, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const nameParts = data.customerName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        customerInsert.run(
          newAppointment.customerId, newAppointment.tenantId, firstName, lastName,
          data.customerEmail, data.customerPhone || '', 'active',
          newAppointment.createdAt, newAppointment.updatedAt
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Appointment created successfully',
        data: {
          id: newAppointment.id,
          staffName: newAppointment.staffName,
          customerName: newAppointment.customerName,
          serviceName: newAppointment.serviceName,
          date: newAppointment.date,
          time: newAppointment.time,
          status: newAppointment.status
        },
      }, { headers: corsHeaders });
    }

    // Original admin panel appointment creation - SQLite version
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(data.serviceId);
    const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(data.staffId);
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(data.customerId);

    if (!service || !staff || !customer) {
      return NextResponse.json(
        { success: false, error: 'Service, staff, or customer not found' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Admin paneli için de çakışma kontrolü
    const conflictCheck = db.prepare(`
      SELECT id FROM appointments 
      WHERE staffId = ? AND date = ? AND time = ? AND status != 'cancelled'
    `).get(data.staffId, data.date, data.time);
    
    if (conflictCheck) {
      return NextResponse.json(
        { success: false, error: 'Bu tarih ve saatte seçili personelin başka bir randevusu var' },
        { status: 409, headers: corsHeaders }
      );
    }

    const appointmentId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const newAppointment = {
      id: appointmentId,
      tenantId: (customer as any).tenantId,
      customerId: data.customerId,
      customerName: `${(customer as any).firstName} ${(customer as any).lastName}`,
      serviceId: data.serviceId,
      serviceName: (service as any).name,
      staffId: data.staffId,
      staffName: `${(staff as any).firstName} ${(staff as any).lastName}`,
      date: data.date,
      time: data.time,
      status: data.status || 'scheduled',
      notes: data.notes || '',
      price: (service as any).price,
      duration: (service as any).duration,
      paymentType: data.paymentType || 'cash',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const insert = db.prepare(`
      INSERT INTO appointments (
        id, tenantId, customerId, customerName, serviceId, serviceName,
        staffId, staffName, date, time, status, notes, price, duration, paymentType, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      newAppointment.id, newAppointment.tenantId, newAppointment.customerId,
      newAppointment.customerName, newAppointment.serviceId, newAppointment.serviceName,
      newAppointment.staffId, newAppointment.staffName, newAppointment.date,
      newAppointment.time, newAppointment.status, newAppointment.notes,
      newAppointment.price, newAppointment.duration, newAppointment.paymentType,
      newAppointment.createdAt, newAppointment.updatedAt
    );

    return NextResponse.json({
      success: true,
      message: 'Appointment created successfully',
      data: newAppointment,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create appointment' },
      { status: 400, headers: corsHeaders }
    );
  }
}