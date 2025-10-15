import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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
      }
    });

    // If status changed to "confirmed", deduct from package if applicable
    if (data.status === 'confirmed' && oldAppointment?.status !== 'confirmed') {
      await deductFromPackage(updatedAppointment);
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

async function deductFromPackage(appointment: any) {
  try {
    console.log('🎁 Checking for package usage:', appointment.customerId, appointment.serviceId);
    
    // Find customer by phone
    const customer = await prisma.customer.findFirst({
      where: {
        phone: appointment.customerPhone,
        tenantId: appointment.tenantId
      }
    });

    if (!customer) {
      console.log('❌ Customer not found for package deduction');
      return;
    }

    // Find active customer packages with remaining service usage
    const customerPackages = await prisma.customerPackage.findMany({
      where: {
        customerId: customer.id,
        tenantId: appointment.tenantId,
        status: 'active'
      },
      include: {
        usages: {
          where: {
            itemType: 'service',
            itemId: appointment.serviceId,
            remainingQuantity: {
              gt: 0
            }
          }
        }
      }
    });

    // Find first package with available service
    const packageWithService = customerPackages.find(cp => cp.usages.length > 0);

    if (packageWithService && packageWithService.usages.length > 0) {
      const usage = packageWithService.usages[0];
      
      console.log(`✅ Deducting from package: ${usage.itemName}, remaining: ${usage.remainingQuantity}`);
      
      // Update usage
      await prisma.customerPackageUsage.update({
        where: { id: usage.id },
        data: {
          usedQuantity: usage.usedQuantity + 1,
          remainingQuantity: usage.remainingQuantity - 1
        }
      });

      // If all usages are depleted, mark package as completed
      const allUsages = await prisma.customerPackageUsage.findMany({
        where: { customerPackageId: packageWithService.id }
      });

      const allDepleted = allUsages.every(u => 
        u.id === usage.id ? u.remainingQuantity - 1 <= 0 : u.remainingQuantity <= 0
      );

      if (allDepleted) {
        await prisma.customerPackage.update({
          where: { id: packageWithService.id },
          data: { status: 'completed' }
        });
        console.log('🎉 Package completed!');
      }

      console.log('✅ Package usage updated successfully');
    } else {
      console.log('ℹ️ No applicable package found for this service');
    }
  } catch (error) {
    console.error('Error deducting from package:', error);
    // Don't throw error - package deduction failure shouldn't fail appointment update
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🗑️ Deleting appointment:', id);
    
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
