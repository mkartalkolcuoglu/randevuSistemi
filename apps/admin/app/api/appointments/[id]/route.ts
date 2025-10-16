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
        // Note: packageInfo is NOT updated - it's set only at creation
      }
    });

    console.log('📦 Updated appointment packageInfo:', updatedAppointment.packageInfo);

    // If status changed to "confirmed", deduct from package if applicable
    if (data.status === 'confirmed' && oldAppointment?.status !== 'confirmed') {
      console.log('✅ Status changed to confirmed - checking for package deduction');
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
