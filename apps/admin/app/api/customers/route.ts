import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../lib/prisma';
import { checkApiPermission } from '../../../lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    // Session'dan tenant ID'yi al
    const cookieStore = await cookies();
    const tenantSession = cookieStore.get('tenant-session');
    
    if (!tenantSession) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let tenantId;
    try {
      const sessionData = JSON.parse(tenantSession.value);
      tenantId = sessionData.tenantId;
    } catch (error) {
      tenantId = tenantSession.value;
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const blacklisted = searchParams.get('blacklisted'); // 'true' for blacklisted only

    try {
      // Build where clause
      const where: any = { tenantId };
      
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (status !== 'all') {
        where.status = status;
      }

      // Filter by blacklist status
      if (blacklisted === 'true') {
        where.isBlacklisted = true;
      } else if (blacklisted === 'false') {
        where.isBlacklisted = false;
      }

      // Get total count
      const total = await prisma.customer.count({ where });

      // Get paginated data
      const customers = await prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({
        success: true,
        data: customers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });

    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permission
    const permissionCheck = await checkApiPermission(request, 'customers', 'create');
    if (!permissionCheck.authorized) {
      return permissionCheck.error!;
    }

    // Session'dan tenant ID'yi al
    const cookieStore = await cookies();
    const tenantSession = cookieStore.get('tenant-session');
    
    if (!tenantSession) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let tenantId;
    try {
      const sessionData = JSON.parse(tenantSession.value);
      tenantId = sessionData.tenantId;
    } catch (error) {
      tenantId = tenantSession.value;
    }

    const data = await request.json();

    // Check for duplicate phone (same tenant)
    if (data.phone && data.phone.trim()) {
      const existingByPhone = await prisma.customer.findFirst({
        where: { tenantId, phone: data.phone.trim() }
      });
      if (existingByPhone) {
        return NextResponse.json(
          { success: false, error: 'Bu telefon numarası ile kayıtlı müşteri zaten mevcut' },
          { status: 400 }
        );
      }
    }

    try {
      // Email unique constraint - generate placeholder if empty
      const email = data.email && data.email.trim() !== ''
        ? data.email.trim()
        : `noemail_${Date.now()}_${Math.random().toString(36).substring(7)}@placeholder.local`;

      // Müşteri oluştur
      const newCustomer = await prisma.customer.create({
        data: {
          tenantId,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email,
          phone: data.phone || '',
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          gender: data.gender || null,
          address: data.address || null,
          notes: data.notes || '',
          status: data.status || 'active'
        }
      });

      return NextResponse.json({
        success: true,
        data: newCustomer
      });

    } catch (error: any) {
      console.error('Error creating customer:', error);

      // Prisma unique constraint error
      if (error?.code === 'P2002') {
        const targets = error?.meta?.target || [];
        if (targets.includes('email') || targets.includes('tenantId')) {
          return NextResponse.json(
            { success: false, error: 'Bu e-posta adresi ile kayıtlı müşteri zaten mevcut' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { success: false, error: 'Bu bilgilerle kayıtlı müşteri zaten mevcut' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: error?.message || 'Müşteri oluşturulurken hata oluştu' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/customers:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}