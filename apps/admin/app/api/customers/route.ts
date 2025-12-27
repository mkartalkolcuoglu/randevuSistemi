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
    
    try {
      // Müşteri oluştur
      const newCustomer = await prisma.customer.create({
        data: {
          tenantId,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
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

    } catch (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create customer' },
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