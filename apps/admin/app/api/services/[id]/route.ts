import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { checkApiPermission } from '../../../../lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const service = await prisma.service.findUnique({
      where: { id }
    });
    
    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service' },
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
    const permissionCheck = await checkApiPermission(request, 'services', 'update');
    if (!permissionCheck.authorized) {
      return permissionCheck.error!;
    }

    const { id } = await params;
    const data = await request.json();
    
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        duration: parseInt(data.duration),
        category: data.category || '',
        status: data.status
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Service updated successfully',
      data: updatedService
    });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update service' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permission
    const permissionCheck = await checkApiPermission(request, 'services', 'delete');
    if (!permissionCheck.authorized) {
      return permissionCheck.error!;
    }

    const { id } = await params;
    
    // Check if service has any appointments
    const appointmentCount = await prisma.appointment.count({
      where: { serviceId: id }
    });

    if (appointmentCount > 0) {
      // Soft delete - just mark as inactive
      await prisma.service.update({
        where: { id },
        data: { status: 'inactive' }
      });

      return NextResponse.json({
        success: true,
        message: `Hizmet deaktif edildi. ${appointmentCount} randevusu olduğu için tamamen silinemedi.`,
        softDeleted: true
      });
    } else {
      // Hard delete if no appointments
      await prisma.service.delete({
        where: { id }
      });

      return NextResponse.json({
        success: true,
        message: 'Hizmet başarıyla silindi',
        softDeleted: false
      });
    }
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { success: false, error: 'Silme işlemi başarısız' },
      { status: 400 }
    );
  }
}