import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const staff = await prisma.staff.findUnique({
      where: { id }
    });
    
    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Error fetching staff member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff member' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Prepare update data
    const updateData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      position: data.position,
      status: data.status,
      salary: data.salary ? parseFloat(data.salary) : null,
      hireDate: data.hireDate || null,
      specializations: data.specializations ? JSON.stringify(data.specializations) : null,
      experience: data.experience ? parseInt(data.experience) : null,
      rating: data.rating ? parseFloat(data.rating) : null,
      workingHours: data.workingHours ? JSON.stringify(data.workingHours) : null,
      notes: data.notes || null,
      // Auth fields
      canLogin: data.canLogin || false,
      username: data.canLogin ? data.username : null,
      permissions: data.canLogin && data.permissions ? JSON.stringify(data.permissions) : null
    };

    // Hash password if provided and changed
    if (data.canLogin && data.password && data.password.trim() !== '') {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    
    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Staff member updated successfully',
      data: updatedStaff
    });
  } catch (error) {
    console.error('Error updating staff member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update staff member' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if staff has any appointments
    const appointmentCount = await prisma.appointment.count({
      where: { staffId: id }
    });

    if (appointmentCount > 0) {
      // Soft delete - just mark as inactive
      await prisma.staff.update({
        where: { id },
        data: { status: 'inactive' }
      });

      return NextResponse.json({
        success: true,
        message: `Personel deaktif edildi. ${appointmentCount} randevusu olduğu için tamamen silinemedi.`,
        softDeleted: true
      });
    } else {
      // Hard delete if no appointments
      await prisma.staff.delete({
        where: { id }
      });

      return NextResponse.json({
        success: true,
        message: 'Personel başarıyla silindi',
        softDeleted: false
      });
    }
  } catch (error) {
    console.error('Error deleting staff member:', error);
    return NextResponse.json(
      { success: false, error: 'Silme işlemi başarısız' },
      { status: 400 }
    );
  }
}