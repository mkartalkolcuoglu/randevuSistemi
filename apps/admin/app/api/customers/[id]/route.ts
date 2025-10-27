import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../lib/prisma';
import { checkApiPermission } from '../../../../lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü
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

    const { id } = await params;
    
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId
      }
    });
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Calculate statistics
    const appointments = await prisma.appointment.findMany({
      where: {
        customerId: id,
        tenantId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalAppointments = appointments.length;
    
    // Calculate total spent (only completed/confirmed appointments, exclude package usage)
    const totalSpent = appointments
      .filter(app => 
        (app.status === 'confirmed' || app.status === 'completed') && 
        !app.packageInfo
      )
      .reduce((sum, app) => sum + (Number(app.price) || 0), 0);

    // Get last visit (most recent completed appointment)
    const lastCompletedAppointment = appointments.find(
      app => app.status === 'confirmed' || app.status === 'completed'
    );
    const lastVisit = lastCompletedAppointment 
      ? lastCompletedAppointment.date 
      : null;

    // Get upcoming appointments count
    const today = new Date().toISOString().split('T')[0];
    const upcomingAppointments = appointments.filter(
      app => app.date >= today && app.status === 'scheduled'
    ).length;

    // Get completed appointments count
    const completedAppointments = appointments.filter(
      app => app.status === 'confirmed' || app.status === 'completed'
    ).length;

    // Get cancelled appointments count
    const cancelledAppointments = appointments.filter(
      app => app.status === 'cancelled'
    ).length;

    // Enrich customer data with statistics
    const enrichedCustomer = {
      ...customer,
      totalAppointments,
      totalSpent,
      lastVisit,
      upcomingAppointments,
      completedAppointments,
      cancelledAppointments,
      registrationDate: customer.createdAt
    };

    return NextResponse.json({
      success: true,
      data: enrichedCustomer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permission
    const permissionCheck = await checkApiPermission(request, 'customers', 'update');
    if (!permissionCheck.authorized) {
      return permissionCheck.error!;
    }

    // Session kontrolü
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

    const { id } = await params;
    const data = await request.json();
    
    try {
      const updatedCustomer = await prisma.customer.update({
        where: {
          id,
          tenantId
        },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          gender: data.gender || null,
          address: data.address || null,
          notes: data.notes,
          status: data.status
        }
      });

      return NextResponse.json({
        success: true,
        data: updatedCustomer
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update customer' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in PUT /api/customers/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permission
    const permissionCheck = await checkApiPermission(request, 'customers', 'delete');
    if (!permissionCheck.authorized) {
      return permissionCheck.error!;
    }

    // Session kontrolü
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

    const { id } = await params;
    
    try {
      await prisma.customer.delete({
        where: {
          id,
          tenantId
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Customer deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete customer' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in DELETE /api/customers/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}