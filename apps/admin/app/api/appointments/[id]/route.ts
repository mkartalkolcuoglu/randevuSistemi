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
    
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone || '',
        customerEmail: data.customerEmail || '',
        serviceName: data.serviceName,
        staffName: data.staffName,
        staffId: data.staffId,
        date: data.date,
        time: data.time,
        status: data.status,
        notes: data.notes || '',
        price: data.price || 0,
        duration: data.duration || 60,
        paymentType: data.paymentType || 'cash'
      }
    });

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
