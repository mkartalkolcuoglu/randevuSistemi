import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/sqlite';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // Build WHERE clause
    let whereClause = '';
    let params: any[] = [];
    
    if (search || status !== 'all') {
      whereClause = 'WHERE ';
      const conditions = [];
      
      if (search) {
        conditions.push('(businessName LIKE ? OR ownerName LIKE ? OR ownerEmail LIKE ? OR slug LIKE ?)');
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam, searchParam);
      }
      
      if (status !== 'all') {
        conditions.push('status = ?');
        params.push(status);
      }
      
      whereClause += conditions.join(' AND ');
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM tenants ${whereClause}`;
    const { total } = db.prepare(countQuery).get(params) as { total: number };

    // Get paginated data
    const offset = (page - 1) * limit;
    const query = `SELECT * FROM tenants ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    const tenants = db.prepare(query).all([...params, limit, offset]);

    // Transform data to include parsed JSON fields and real counts
    const transformedTenants = tenants.map((tenant: any) => {
      // Get real appointment count for this tenant
      const appointmentCount = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE tenantId = ?').get(tenant.id)?.count || 0;
      
      // Get real customer count for this tenant
      const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers WHERE tenantId = ?').get(tenant.id)?.count || 0;
      
      // Calculate monthly revenue based on appointments this month
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const monthlyRevenue = db.prepare(`
        SELECT COALESCE(SUM(price), 0) as revenue 
        FROM appointments 
        WHERE tenantId = ? AND createdAt >= ? AND status != 'cancelled'
      `).get(tenant.id, firstDayOfMonth)?.revenue || 0;

      return {
        ...tenant,
        appointmentCount,
        customerCount,
        monthlyRevenue,
        workingHours: tenant.workingHours ? JSON.parse(tenant.workingHours) : null,
        theme: tenant.theme ? JSON.parse(tenant.theme) : null
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedTenants,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('POST /api/tenants - Received data:', data);
    
    const defaultWorkingHours = {
      monday: { start: '09:00', end: '18:00', closed: false },
      tuesday: { start: '09:00', end: '18:00', closed: false },
      wednesday: { start: '09:00', end: '18:00', closed: false },
      thursday: { start: '09:00', end: '18:00', closed: false },
      friday: { start: '09:00', end: '18:00', closed: false },
      saturday: { start: '09:00', end: '17:00', closed: false },
      sunday: { start: '10:00', end: '16:00', closed: true }
    };

    const defaultTheme = {
      primaryColor: '#EC4899', // LOBAAAA RENK TEMASI
      secondaryColor: '#BE185D', // LOBAAAA RENK TEMASI
      logo: '',
      headerImage: ''
    };

    const id = crypto.randomBytes(12).toString('hex');
    const workingHours = JSON.stringify(data.workingHours || defaultWorkingHours);
    const theme = JSON.stringify(data.theme || defaultTheme);

    const insert = db.prepare(`
      INSERT INTO tenants (
        id, businessName, slug, domain, username, password, ownerName, ownerEmail, phone, 
        plan, status, address, businessType, businessDescription, 
        workingHours, theme, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      id,
      data.businessName,
      data.slug,
      `${data.slug}.randevu.com`,
      data.username,
      data.password,
      data.ownerName,
      data.ownerEmail,
      data.phone,
      data.plan || 'Standard',
      data.status || 'active',
      data.address || '',
      data.businessType || 'other',
      data.businessDescription || '',
      workingHours,
      theme,
      new Date().toISOString()
    );

    // Get the created tenant
    const newTenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(id);
    
    // Transform response data
    const responseData = {
      ...newTenant,
      workingHours: JSON.parse((newTenant as any).workingHours || '{}'),
      theme: JSON.parse((newTenant as any).theme || '{}')
    };

    return NextResponse.json({
      success: true,
      message: 'Tenant created successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tenant', details: (error as Error).message },
      { status: 400 }
    );
  }
}