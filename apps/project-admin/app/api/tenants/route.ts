import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { ownerName: { contains: search } },
        { ownerEmail: { contains: search } },
        { slug: { contains: search } }
      ];
    }
    
    if (status !== 'all') {
      where.status = status;
    }

    // Get total count
    const total = await prisma.tenant.count({ where });

    // Get paginated data
    const tenants = await prisma.tenant.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    // Enrich tenants with real appointment and customer counts
    const enrichedTenants = await Promise.all(
      tenants.map(async (tenant) => {
        // Get real appointment count
        const appointmentCount = await prisma.appointment.count({
          where: { tenantId: tenant.id }
        });

        // Get real customer count
        const customerCount = await prisma.customer.count({
          where: { tenantId: tenant.id }
        });

        // Calculate real monthly revenue (from completed appointments)
        const completedAppointments = await prisma.appointment.findMany({
          where: {
            tenantId: tenant.id,
            status: { in: ['completed', 'confirmed'] },
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // Start of current month
            }
          },
          select: { price: true }
        });

        const monthlyRevenue = completedAppointments.reduce(
          (sum, app) => sum + (app.price || 0),
          0
        );

        return {
          ...tenant,
          appointmentCount,
          customerCount,
          monthlyRevenue: Math.round(monthlyRevenue)
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedTenants,
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

    // Default values
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
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      logo: '',
      headerImage: ''
    };

    // Merge theme data with defaults, ensuring non-empty values are used
    const mergedTheme = {
      primaryColor: (data.theme?.primaryColor && data.theme.primaryColor !== '') ? data.theme.primaryColor : defaultTheme.primaryColor,
      secondaryColor: (data.theme?.secondaryColor && data.theme.secondaryColor !== '') ? data.theme.secondaryColor : defaultTheme.secondaryColor,
      logo: (data.theme?.logo && data.theme.logo !== '') ? data.theme.logo : defaultTheme.logo,
      headerImage: (data.theme?.headerImage && data.theme.headerImage !== '') ? data.theme.headerImage : defaultTheme.headerImage
    };

    // Merge working hours data with defaults, ensuring proper structure
    const mergedWorkingHours = {
      monday: data.workingHours?.monday || defaultWorkingHours.monday,
      tuesday: data.workingHours?.tuesday || defaultWorkingHours.tuesday,
      wednesday: data.workingHours?.wednesday || defaultWorkingHours.wednesday,
      thursday: data.workingHours?.thursday || defaultWorkingHours.thursday,
      friday: data.workingHours?.friday || defaultWorkingHours.friday,
      saturday: data.workingHours?.saturday || defaultWorkingHours.saturday,
      sunday: data.workingHours?.sunday || defaultWorkingHours.sunday
    };



    try {
      // Create tenant using Prisma
      const newTenant = await prisma.tenant.create({
        data: {
          businessName: data.businessName,
          slug: data.slug,
          domain: process.env.WEB_APP_URL ? `${process.env.WEB_APP_URL}/${data.slug}` : `${data.slug}.randevu.com`,
          username: data.username,
          password: data.password, // In production, this should be hashed
          ownerName: data.ownerName,
          ownerEmail: data.ownerEmail,
          phone: data.phone || '',
          plan: data.plan || 'Standard',
          status: data.status || 'active',
          address: data.address || '',
          businessType: data.businessType || 'other',
          businessDescription: data.businessDescription || '',
          monthlyRevenue: 0,
          appointmentCount: 0,
          customerCount: 0,
          workingHours: JSON.stringify(mergedWorkingHours),
          theme: JSON.stringify(mergedTheme)
        }
      });

      return NextResponse.json({
        success: true,
        data: newTenant,
        message: 'Tenant created successfully'
      });

    } catch (error) {
      console.error('Error creating tenant:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      return NextResponse.json(
        { success: false, error: `Failed to create tenant: ${error.message}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/tenants:', error);
    console.error('Error details:', error.message);
    return NextResponse.json(
      { success: false, error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}