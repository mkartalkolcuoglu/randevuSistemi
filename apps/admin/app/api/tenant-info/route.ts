import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
const Database = require('better-sqlite3');
const path = require('path');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    // Session'dan tenant ID'yi al
    const cookieStore = await cookies();
    const tenantSession = cookieStore.get('tenant-session');
    
    if (!tenantSession) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    let tenantId;
    try {
      const sessionData = JSON.parse(tenantSession.value);
      tenantId = sessionData.tenantId;
    } catch (error) {
      // Fallback: assume direct tenant ID
      tenantId = tenantSession.value;
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Database bağlantısı
    const dbPath = path.join(process.cwd(), 'prisma', 'admin.db');
    const db = new Database(dbPath);

    try {
      // Tenant bilgilerini getir
      const tenant = db.prepare(`
        SELECT id, businessName, slug, username, ownerName, ownerEmail, phone, 
               address, businessType, businessDescription, workingHours, theme, location,
               createdAt, lastLogin
        FROM tenants 
        WHERE id = ?
      `).get(tenantId);

      if (!tenant) {
        return NextResponse.json(
          { success: false, error: 'Tenant not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      // JSON alanlarını parse et
      const responseData = {
        ...tenant,
        workingHours: tenant.workingHours ? JSON.parse(tenant.workingHours) : {
          monday: { start: '09:00', end: '18:00', closed: false },
          tuesday: { start: '09:00', end: '18:00', closed: false },
          wednesday: { start: '09:00', end: '18:00', closed: false },
          thursday: { start: '09:00', end: '18:00', closed: false },
          friday: { start: '09:00', end: '18:00', closed: false },
          saturday: { start: '09:00', end: '17:00', closed: false },
          sunday: { start: '10:00', end: '16:00', closed: true }
        },
        theme: tenant.theme ? JSON.parse(tenant.theme) : {
          primaryColor: '#EC4899',
          secondaryColor: '#BE185D',
          logo: '',
          headerImage: ''
        },
        location: tenant.location ? JSON.parse(tenant.location) : {
          latitude: '',
          longitude: '',
          address: ''
        }
      };

      return NextResponse.json({
        success: true,
        data: responseData
      }, { headers: corsHeaders });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Error fetching tenant info:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Session'dan tenant ID'yi al
    const cookieStore = await cookies();
    const tenantSession = cookieStore.get('tenant-session');
    
    if (!tenantSession) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    let tenantId;
    try {
      const sessionData = JSON.parse(tenantSession.value);
      tenantId = sessionData.tenantId;
    } catch (error) {
      // Fallback: assume direct tenant ID
      tenantId = tenantSession.value;
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401, headers: corsHeaders }
      );
    }
    const data = await request.json();

    // Database bağlantısı
    const dbPath = path.join(process.cwd(), 'prisma', 'admin.db');
    const db = new Database(dbPath);

    try {
      // Güncelleme verilerini hazırla
      const updateData: any = {
        businessName: data.businessName,
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        phone: data.phone || null,
        address: data.businessAddress || null,
        businessType: data.businessType || 'other',
        businessDescription: data.businessDescription || null,
        workingHours: JSON.stringify(data.workingHours),
        theme: JSON.stringify(data.themeSettings),
        location: JSON.stringify(data.location)
      };

      // Şifre varsa güncellenecek alanlar listesine ekle
      let updateQuery = `
        UPDATE tenants SET 
          businessName = ?, ownerName = ?, ownerEmail = ?, phone = ?, 
          address = ?, businessType = ?, businessDescription = ?, 
          workingHours = ?, theme = ?, location = ?
      `;
      let queryParams = [
        updateData.businessName, updateData.ownerName, updateData.ownerEmail, 
        updateData.phone, updateData.address, updateData.businessType, 
        updateData.businessDescription, updateData.workingHours, updateData.theme,
        updateData.location
      ];

      // Kullanıcı adı varsa ekle
      if (data.username) {
        updateQuery += `, username = ?`;
        queryParams.push(data.username);
      }

      // Şifre varsa ekle
      if (data.password && data.password.trim() !== '') {
        updateQuery += `, password = ?`;
        queryParams.push(data.password);
      }

      updateQuery += ` WHERE id = ?`;
      queryParams.push(tenantId);

      // Tenant'ı güncelle
      const updateResult = db.prepare(updateQuery).run(...queryParams);

      if (updateResult.changes === 0) {
        return NextResponse.json(
          { success: false, error: 'Tenant not found or no changes made' },
          { status: 404, headers: corsHeaders }
        );
      }

      // Güncellenmiş tenant bilgilerini getir
      const updatedTenant = db.prepare(`
        SELECT id, businessName, slug, username, ownerName, ownerEmail, phone, 
               address, businessType, businessDescription, workingHours, theme, location,
               createdAt, lastLogin
        FROM tenants 
        WHERE id = ?
      `).get(tenantId);

      // JSON alanlarını parse et
      const responseData = {
        ...updatedTenant,
        workingHours: JSON.parse(updatedTenant.workingHours),
        theme: JSON.parse(updatedTenant.theme),
        location: updatedTenant.location ? JSON.parse(updatedTenant.location) : {
          latitude: '',
          longitude: '',
          address: ''
        }
      };

      return NextResponse.json({
        success: true,
        message: 'Tenant bilgileri başarıyla güncellendi',
        data: responseData
      }, { headers: corsHeaders });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Error updating tenant info:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
