import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkApiPermission } from '../../../../lib/api-auth';

const prisma = new PrismaClient();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 Fetching appointment:', id);
    
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });
    
    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      data: appointment
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointment' },
      { status: 500, headers: corsHeaders }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    console.log('📝 Updating appointment:', id, data);
    
    // Check permission for updating appointments
    const permissionCheck = await checkApiPermission(request, 'appointments', 'update');
    if (!permissionCheck.authorized) {
      return permissionCheck.error!;
    }
    
    // Get the old appointment to check status change
    const oldAppointment = await prisma.appointment.findUnique({
      where: { id }
    });
    
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone || '',
        customerEmail: data.customerEmail || '',
        serviceName: data.serviceName,
        staffName: data.staffName,
        staffId: data.staffId,
        serviceId: data.serviceId,
        date: data.date,
        time: data.time,
        status: data.status,
        notes: data.notes || '',
        price: data.price || 0,
        duration: data.duration || 60,
        paymentType: data.paymentType || 'cash'
        // Note: packageInfo is NOT updated - it's set only at creation
      }
    });

    console.log('📦 Updated appointment packageInfo:', updatedAppointment.packageInfo);

    // If status changed to "confirmed" or "completed", deduct from package if applicable
    const isCompleted = data.status === 'confirmed' || data.status === 'completed';
    const wasCompleted = oldAppointment?.status === 'confirmed' || oldAppointment?.status === 'completed';
    
    if (isCompleted && !wasCompleted) {
      console.log(`✅ Status changed to ${data.status} - checking for package deduction`);
      await deductFromPackage(updatedAppointment);
      
      // Create transaction for cash register (kasa)
      console.log(`💰 Creating transaction for completed appointment: ${updatedAppointment.id}`);
      await createAppointmentTransaction(updatedAppointment);
    }

    // If status changed to "no_show", increment customer's no-show count and check blacklist
    const isNoShow = data.status === 'no_show';
    const wasNoShow = oldAppointment?.status === 'no_show';
    
    if (isNoShow && !wasNoShow && updatedAppointment.customerPhone) {
      console.log(`🚫 Status changed to no_show - checking blacklist for customer: ${updatedAppointment.customerPhone}`);
      await handleNoShowBlacklist(updatedAppointment);
    }

    // If status changed to "confirmed", send WhatsApp confirmation (non-blocking)
    const isConfirmed = data.status === 'confirmed';
    const wasConfirmed = oldAppointment?.status === 'confirmed';
    
    if (isConfirmed && !wasConfirmed && !updatedAppointment.whatsappSent) {
      console.log(`📱 Status changed to confirmed - sending WhatsApp notification`);
      // Send WhatsApp in background (don't wait for it)
      fetch(`${request.nextUrl.origin}/api/whatsapp/send-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id })
      }).catch(error => {
        console.error('⚠️ WhatsApp send failed (non-blocking):', error);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update appointment: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 400, headers: corsHeaders }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function handleNoShowBlacklist(appointment: any) {
  try {
    console.log('🚫 [BLACKLIST] Processing no-show for appointment:', appointment.id);
    console.log('🚫 [BLACKLIST] Customer phone:', appointment.customerPhone);
    console.log('🚫 [BLACKLIST] Tenant ID:', appointment.tenantId);

    // Find customer by phone and tenant (phone can be shared across tenants)
    const customer = await prisma.customer.findFirst({
      where: {
        tenantId: appointment.tenantId,
        phone: appointment.customerPhone
      }
    });

    if (!customer) {
      console.log('⚠️ [BLACKLIST] Customer not found - might be a walk-in or deleted customer');
      return;
    }

    console.log('👤 [BLACKLIST] Found customer:', customer.id, `(${customer.firstName} ${customer.lastName})`);
    console.log('📊 [BLACKLIST] Current no-show count:', customer.noShowCount);

    // Increment no-show count
    const newNoShowCount = customer.noShowCount + 1;
    console.log('📈 [BLACKLIST] New no-show count will be:', newNoShowCount);

    // Get blacklist threshold from settings
    const settings = await prisma.settings.findUnique({
      where: { tenantId: appointment.tenantId }
    });

    const threshold = settings?.blacklistThreshold || 3;
    console.log('⚙️ [BLACKLIST] Blacklist threshold:', threshold);

    // Check if should be blacklisted
    const shouldBlacklist = newNoShowCount >= threshold;
    console.log('🔍 [BLACKLIST] Should blacklist?', shouldBlacklist, `(${newNoShowCount} >= ${threshold})`);

    // Update customer
    const updateData: any = {
      noShowCount: newNoShowCount
    };

    if (shouldBlacklist && !customer.isBlacklisted) {
      updateData.isBlacklisted = true;
      updateData.blacklistedAt = new Date();
      console.log('🚨 [BLACKLIST] Customer will be BLACKLISTED!');
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: updateData
    });

    if (shouldBlacklist && !customer.isBlacklisted) {
      console.log('✅ [BLACKLIST] Customer successfully blacklisted:', customer.id);
      console.log(`🚨 [BLACKLIST] ${customer.firstName} ${customer.lastName} (${customer.phone}) has been blacklisted after ${newNoShowCount} no-shows`);
    } else {
      console.log(`✅ [BLACKLIST] No-show count updated to ${newNoShowCount} for ${customer.firstName} ${customer.lastName}`);
    }

  } catch (error) {
    console.error('❌ [BLACKLIST] Error handling no-show blacklist:', error);
    // Don't throw - we don't want to fail the appointment update if blacklist logic fails
  }
}

async function deductFromPackage(appointment: any) {
  try {
    console.log('🎁 Checking for package usage for appointment:', appointment.id);
    
    // Check if appointment has packageInfo (indicates customer chose to use package)
    if (!appointment.packageInfo) {
      console.log('ℹ️ No package info in appointment - customer chose not to use package or no package available');
      return;
    }

    let packageInfo;
    try {
      packageInfo = typeof appointment.packageInfo === 'string' 
        ? JSON.parse(appointment.packageInfo) 
        : appointment.packageInfo;
    } catch (e) {
      console.error('❌ Failed to parse packageInfo:', e);
      return;
    }

    console.log('📦 Package info found:', packageInfo);

    // Find the specific usage record
    const usage = await prisma.customerPackageUsage.findUnique({
      where: { id: packageInfo.usageId }
    });

    if (!usage) {
      console.log('❌ Package usage not found');
      return;
    }

    if (usage.remainingQuantity <= 0) {
      console.log('⚠️ Package usage already depleted');
      return;
    }

    // Update usage
    await prisma.customerPackageUsage.update({
      where: { id: usage.id },
      data: {
        usedQuantity: usage.usedQuantity + 1,
        remainingQuantity: usage.remainingQuantity - 1
      }
    });

    console.log('✅ Package usage updated successfully');

    // Check if all usages in this customer package are depleted
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
      console.log('🎉 All package usages depleted - Package marked as completed!');
    }
  } catch (error) {
    console.error('Error deducting from package:', error);
    // Don't throw error - package deduction failure shouldn't fail appointment update
  }
}

/**
 * Create transaction for completed appointment
 */
async function createAppointmentTransaction(appointment: any) {
  try {
    console.log('💰 Creating transaction for appointment:', appointment.id);
    
    // Skip if no price
    if (!appointment.price || appointment.price <= 0) {
      console.log('ℹ️ No price set for appointment - skipping transaction');
      return;
    }

    // Check if transaction already exists for this appointment
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        appointmentId: appointment.id,
        type: 'appointment'
      }
    });

    if (existingTransaction) {
      console.log('ℹ️ Transaction already exists for this appointment');
      return;
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        tenantId: appointment.tenantId,
        type: 'appointment',
        amount: appointment.price,
        description: `Randevu: ${appointment.serviceName} - ${appointment.customerName}`,
        paymentType: appointment.paymentType || 'cash',
        customerId: appointment.customerId || undefined,
        customerName: appointment.customerName,
        appointmentId: appointment.id,
        date: appointment.date,
        profit: 0 // Appointments don't have cost/profit calculation
      }
    });

    console.log('✅ Transaction created successfully:', transaction.id);
  } catch (error) {
    console.error('❌ Error creating appointment transaction:', error);
    // Don't throw error - transaction creation failure shouldn't fail appointment update
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🗑️ Deleting appointment:', id);
    
    // Check permission for deleting appointments
    const permissionCheck = await checkApiPermission(request, 'appointments', 'delete');
    if (!permissionCheck.authorized) {
      return permissionCheck.error!;
    }
    
    await prisma.appointment.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted successfully'
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete appointment: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 400, headers: corsHeaders }
    );
  } finally {
    await prisma.$disconnect();
  }
}
