import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to verify token and get user info
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userType: string;
      tenantId: string;
      customerId?: string;
      staffId?: string;
      ownerId?: string;
      phone?: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET - Get single appointment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        service: {
          select: {
            name: true,
            duration: true,
            price: true,
          },
        },
        staff: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Randevu bulunamadı' },
        { status: 404 }
      );
    }

    // Check access
    if (appointment.tenantId !== auth.tenantId) {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    if (auth.userType === 'customer' && appointment.customerId !== auth.customerId) {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: appointment.id,
        tenantId: appointment.tenantId,
        customerId: appointment.customerId,
        customerName: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
        customerPhone: appointment.customer.phone,
        customerEmail: appointment.customer.email,
        serviceId: appointment.serviceId,
        serviceName: appointment.service.name,
        staffId: appointment.staffId,
        staffName: `${appointment.staff.firstName} ${appointment.staff.lastName}`,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.service.duration,
        status: appointment.status,
        notes: appointment.notes,
        price: appointment.service.price,
        paymentType: appointment.paymentType,
        createdAt: appointment.createdAt.toISOString(),
        updatedAt: appointment.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT - Full update appointment (staff/owner)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff/owner can do full updates
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { serviceId, staffId, date, time, customerName, customerPhone, notes } = body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Randevu bulunamadı' },
        { status: 404 }
      );
    }

    // Check access
    if (appointment.tenantId !== auth.tenantId) {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const updateData: any = {};

    if (serviceId) updateData.serviceId = serviceId;
    if (staffId) updateData.staffId = staffId;
    if (date) updateData.date = date;
    if (time) updateData.time = time;
    if (notes !== undefined) updateData.notes = notes;

    // Update customer info if provided
    if (customerName || customerPhone) {
      await prisma.customer.update({
        where: { id: appointment.customerId },
        data: {
          ...(customerName && {
            firstName: customerName.split(' ')[0] || customerName,
            lastName: customerName.split(' ').slice(1).join(' ') || ''
          }),
          ...(customerPhone && { phone: customerPhone }),
        },
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        service: {
          select: {
            name: true,
            duration: true,
            price: true,
          },
        },
        staff: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Randevu güncellendi',
      data: {
        id: updatedAppointment.id,
        tenantId: updatedAppointment.tenantId,
        customerId: updatedAppointment.customerId,
        customerName: `${updatedAppointment.customer.firstName} ${updatedAppointment.customer.lastName}`,
        customerPhone: updatedAppointment.customer.phone,
        serviceId: updatedAppointment.serviceId,
        serviceName: updatedAppointment.service.name,
        staffId: updatedAppointment.staffId,
        staffName: `${updatedAppointment.staff.firstName} ${updatedAppointment.staff.lastName}`,
        date: updatedAppointment.date,
        time: updatedAppointment.time,
        duration: updatedAppointment.service.duration,
        status: updatedAppointment.status,
        notes: updatedAppointment.notes,
        price: updatedAppointment.service.price,
      },
    });
  } catch (error) {
    console.error('Full update appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PATCH - Update appointment status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Randevu bulunamadı' },
        { status: 404 }
      );
    }

    // Check access based on user type
    if (auth.userType === 'customer') {
      // Customers can only cancel their own appointments
      // Find customer by phone in the appointment's tenant
      const originalCustomer = await prisma.customer.findUnique({
        where: { id: auth.customerId },
        select: { phone: true }
      });

      if (!originalCustomer?.phone) {
        return NextResponse.json(
          { success: false, message: 'Müşteri bilgisi bulunamadı' },
          { status: 403 }
        );
      }

      // Find customer in appointment's tenant
      const customerInTenant = await prisma.customer.findFirst({
        where: {
          phone: originalCustomer.phone,
          tenantId: appointment.tenantId
        }
      });

      if (!customerInTenant || appointment.customerId !== customerInTenant.id) {
        return NextResponse.json(
          { success: false, message: 'Bu randevuya erişim yetkiniz yok' },
          { status: 403 }
        );
      }

      if (status !== 'cancelled') {
        return NextResponse.json(
          { success: false, message: 'Sadece iptal işlemi yapabilirsiniz' },
          { status: 400 }
        );
      }
    } else {
      // Staff/Owner - must be from the same tenant
      if (appointment.tenantId !== auth.tenantId) {
        return NextResponse.json(
          { success: false, message: 'Erişim yetkisi yok' },
          { status: 403 }
        );
      }

      // Staff can only update their own appointments (unless owner)
      if (auth.userType === 'staff' && appointment.staffId !== auth.staffId) {
        return NextResponse.json(
          { success: false, message: 'Sadece kendi randevularınızı güncelleyebilirsiniz' },
          { status: 403 }
        );
      }
    }

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz durum' },
        { status: 400 }
      );
    }

    // Store old status for comparison
    const oldStatus = appointment.status;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
    });

    // Handle status change side effects
    const isCompleted = status === 'confirmed' || status === 'completed';
    const wasCompleted = oldStatus === 'confirmed' || oldStatus === 'completed';

    // If status changed to "confirmed" or "completed", handle package and transaction
    if (isCompleted && !wasCompleted) {
      console.log(`✅ [MOBILE] Status changed to ${status} - processing package and transaction`);
      await deductFromPackage(updatedAppointment);
      await createAppointmentTransaction(updatedAppointment);
    }

    // If status changed to "no_show", handle blacklist
    if (status === 'no_show' && oldStatus !== 'no_show' && updatedAppointment.customerPhone) {
      console.log(`🚫 [MOBILE] Status changed to no_show - checking blacklist`);
      await handleNoShowBlacklist(updatedAppointment);
    }

    // If status changed to "cancelled" from completed/confirmed, refund package
    if (status === 'cancelled' && oldStatus !== 'cancelled' && wasCompleted) {
      console.log(`🔄 [MOBILE] Status changed to cancelled - refunding package usage`);
      await refundPackageUsage(updatedAppointment);
    }

    return NextResponse.json({
      success: true,
      message: 'Randevu güncellendi',
      data: {
        id: updatedAppointment.id,
        status: updatedAppointment.status,
      },
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Helper: Deduct from package when appointment is completed
async function deductFromPackage(appointment: any) {
  try {
    if (!appointment.packageInfo) {
      console.log('ℹ️ [MOBILE] No package info - skipping deduction');
      return;
    }

    let packageInfo;
    try {
      packageInfo = typeof appointment.packageInfo === 'string'
        ? JSON.parse(appointment.packageInfo)
        : appointment.packageInfo;
    } catch (e) {
      console.error('❌ [MOBILE] Failed to parse packageInfo:', e);
      return;
    }

    const usage = await prisma.customerPackageUsage.findUnique({
      where: { id: packageInfo.usageId }
    });

    if (!usage || usage.remainingQuantity <= 0) {
      console.log('⚠️ [MOBILE] Package usage not found or depleted');
      return;
    }

    await prisma.customerPackageUsage.update({
      where: { id: usage.id },
      data: {
        usedQuantity: usage.usedQuantity + 1,
        remainingQuantity: usage.remainingQuantity - 1
      }
    });

    console.log('✅ [MOBILE] Package usage updated');

    // Check if all usages depleted
    const allUsages = await prisma.customerPackageUsage.findMany({
      where: { customerPackageId: packageInfo.customerPackageId }
    });

    const allDepleted = allUsages.every(u =>
      u.id === usage.id ? usage.remainingQuantity - 1 <= 0 : u.remainingQuantity <= 0
    );

    if (allDepleted) {
      await prisma.customerPackage.update({
        where: { id: packageInfo.customerPackageId },
        data: { status: 'completed' }
      });
      console.log('🎉 [MOBILE] Package marked as completed');
    }
  } catch (error) {
    console.error('❌ [MOBILE] Error deducting from package:', error);
  }
}

// Helper: Create transaction for completed appointment
async function createAppointmentTransaction(appointment: any) {
  try {
    // Skip if package was used
    if (appointment.packageInfo) {
      console.log('⚠️ [MOBILE] Skipping transaction - package used');
      return;
    }

    // Skip if no price
    if (!appointment.price || appointment.price <= 0) {
      console.log('⚠️ [MOBILE] Skipping transaction - no price');
      return;
    }

    // Check for existing transaction
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        appointmentId: appointment.id,
        type: 'appointment'
      }
    });

    if (existingTransaction) {
      console.log('ℹ️ [MOBILE] Transaction already exists');
      return;
    }

    // Create transaction with today's date
    const today = new Date();
    const transactionDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const transaction = await prisma.transaction.create({
      data: {
        tenantId: appointment.tenantId,
        type: 'appointment',
        amount: appointment.price,
        description: `Randevu: ${appointment.serviceName} - ${appointment.customerName}`,
        paymentType: appointment.paymentType || 'cash',
        customerId: appointment.customerId,
        customerName: appointment.customerName,
        appointmentId: appointment.id,
        date: transactionDate,
        profit: 0
      }
    });

    console.log('✅ [MOBILE] Transaction created:', transaction.id, 'Amount:', transaction.amount);
  } catch (error) {
    console.error('❌ [MOBILE] Error creating transaction:', error);
  }
}

// Helper: Handle no-show blacklist
async function handleNoShowBlacklist(appointment: any) {
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        tenantId: appointment.tenantId,
        phone: appointment.customerPhone
      }
    });

    if (!customer) {
      console.log('⚠️ [MOBILE] Customer not found for blacklist check');
      return;
    }

    const newNoShowCount = customer.noShowCount + 1;

    const settings = await prisma.settings.findUnique({
      where: { tenantId: appointment.tenantId }
    });

    const threshold = settings?.blacklistThreshold || 3;
    const shouldBlacklist = newNoShowCount >= threshold;

    const updateData: any = { noShowCount: newNoShowCount };

    if (shouldBlacklist && !customer.isBlacklisted) {
      updateData.isBlacklisted = true;
      updateData.blacklistedAt = new Date();
      console.log('🚨 [MOBILE] Customer blacklisted');
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: updateData
    });

    console.log(`✅ [MOBILE] No-show count updated to ${newNoShowCount}`);
  } catch (error) {
    console.error('❌ [MOBILE] Error handling no-show:', error);
  }
}

// Helper: Refund package usage when cancelled
async function refundPackageUsage(appointment: any) {
  try {
    if (!appointment.packageInfo) {
      console.log('ℹ️ [MOBILE] No package info - nothing to refund');
      return;
    }

    let packageInfo;
    try {
      packageInfo = typeof appointment.packageInfo === 'string'
        ? JSON.parse(appointment.packageInfo)
        : appointment.packageInfo;
    } catch (e) {
      console.error('❌ [MOBILE] Failed to parse packageInfo:', e);
      return;
    }

    const usage = await prisma.customerPackageUsage.findUnique({
      where: { id: packageInfo.usageId }
    });

    if (!usage || usage.usedQuantity <= 0) {
      console.log('⚠️ [MOBILE] Nothing to refund');
      return;
    }

    await prisma.customerPackageUsage.update({
      where: { id: usage.id },
      data: {
        usedQuantity: usage.usedQuantity - 1,
        remainingQuantity: usage.remainingQuantity + 1
      }
    });

    console.log('✅ [MOBILE] Package usage refunded');

    const customerPackage = await prisma.customerPackage.findUnique({
      where: { id: packageInfo.customerPackageId }
    });

    if (customerPackage?.status === 'completed') {
      await prisma.customerPackage.update({
        where: { id: packageInfo.customerPackageId },
        data: { status: 'active' }
      });
      console.log('🔓 [MOBILE] Package reactivated');
    }
  } catch (error) {
    console.error('❌ [MOBILE] Error refunding package:', error);
  }
}

// DELETE - Cancel appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Randevu bulunamadı' },
        { status: 404 }
      );
    }

    // Check access based on user type
    if (auth.userType === 'customer') {
      // Find customer by phone in the appointment's tenant
      const originalCustomer = await prisma.customer.findUnique({
        where: { id: auth.customerId },
        select: { phone: true }
      });

      if (!originalCustomer?.phone) {
        return NextResponse.json(
          { success: false, message: 'Müşteri bilgisi bulunamadı' },
          { status: 403 }
        );
      }

      // Find customer in appointment's tenant
      const customerInTenant = await prisma.customer.findFirst({
        where: {
          phone: originalCustomer.phone,
          tenantId: appointment.tenantId
        }
      });

      if (!customerInTenant || appointment.customerId !== customerInTenant.id) {
        return NextResponse.json(
          { success: false, message: 'Bu randevuya erişim yetkiniz yok' },
          { status: 403 }
        );
      }
    } else {
      // Staff/Owner - must be from the same tenant
      if (appointment.tenantId !== auth.tenantId) {
        return NextResponse.json(
          { success: false, message: 'Erişim yetkisi yok' },
          { status: 403 }
        );
      }
    }

    // Cancel instead of delete
    await prisma.appointment.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({
      success: true,
      message: 'Randevu iptal edildi',
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
