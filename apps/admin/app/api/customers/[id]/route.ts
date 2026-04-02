import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../lib/prisma';
import { checkApiPermission } from '../../../../lib/api-auth';
import { createAuditLog, getIpFromRequest } from '../../../../lib/audit';

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

    // Check for duplicate phone (same tenant, different customer)
    if (data.phone && data.phone.trim()) {
      const phoneDigits = data.phone.replace(/\D/g, '');
      const existingByPhone = await prisma.customer.findFirst({
        where: {
          tenantId,
          phone: data.phone,
          id: { not: id }
        }
      });
      if (existingByPhone) {
        return NextResponse.json(
          { success: false, error: 'Bu telefon numarası ile kayıtlı başka bir müşteri zaten mevcut' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate email (same tenant, different customer)
    if (data.email && data.email.trim() && !data.email.includes('@placeholder.local')) {
      const existingByEmail = await prisma.customer.findFirst({
        where: {
          tenantId,
          email: data.email.trim(),
          id: { not: id }
        }
      });
      if (existingByEmail) {
        return NextResponse.json(
          { success: false, error: 'Bu e-posta adresi ile kayıtlı başka bir müşteri zaten mevcut' },
          { status: 400 }
        );
      }
    }

    try {
      // Read old customer for audit log
      const oldCustomer = await prisma.customer.findFirst({
        where: { id, tenantId }
      });

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

      // Audit log
      let ownerName = 'Bilinmiyor';
      try {
        const sd = JSON.parse(tenantSession!.value);
        ownerName = sd.ownerName || ownerName;
      } catch {}
      await createAuditLog({
        tenantId,
        userName: ownerName,
        userType: 'owner',
        action: 'update',
        entity: 'customer',
        entityId: id,
        summary: `Müşteri güncellendi: ${updatedCustomer.firstName} ${updatedCustomer.lastName}`,
        oldValues: oldCustomer ? { firstName: oldCustomer.firstName, lastName: oldCustomer.lastName, email: oldCustomer.email, phone: oldCustomer.phone, status: oldCustomer.status } : undefined,
        newValues: { firstName: updatedCustomer.firstName, lastName: updatedCustomer.lastName, email: updatedCustomer.email, phone: updatedCustomer.phone, status: updatedCustomer.status },
        ipAddress: getIpFromRequest(request),
        source: 'admin',
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
      // Check if customer has active appointments
      const activeAppointments = await prisma.appointment.findMany({
        where: {
          customerId: id,
          tenantId,
          status: {
            in: ['scheduled', 'confirmed']
          }
        }
      });

      if (activeAppointments.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Bu müşterinin aktif randevuları bulunmaktadır',
            details: `${activeAppointments.length} adet aktif randevu var. Müşteri silinmeden önce randevuları iptal etmeniz gerekmektedir.`,
            activeAppointmentsCount: activeAppointments.length
          },
          { status: 409 } // 409 Conflict
        );
      }

      // Read customer before delete for audit log
      const customerToDelete = await prisma.customer.findFirst({
        where: { id, tenantId }
      });

      await prisma.customer.delete({
        where: {
          id,
          tenantId
        }
      });

      // Audit log
      let ownerName = 'Bilinmiyor';
      try {
        const sd = JSON.parse(tenantSession!.value);
        ownerName = sd.ownerName || ownerName;
      } catch {}
      await createAuditLog({
        tenantId,
        userName: ownerName,
        userType: 'owner',
        action: 'delete',
        entity: 'customer',
        entityId: id,
        summary: `Müşteri silindi: ${customerToDelete?.firstName || ''} ${customerToDelete?.lastName || ''}`,
        oldValues: customerToDelete ? { firstName: customerToDelete.firstName, lastName: customerToDelete.lastName, email: customerToDelete.email, phone: customerToDelete.phone } : undefined,
        ipAddress: getIpFromRequest(request),
        source: 'admin',
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