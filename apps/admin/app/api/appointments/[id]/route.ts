import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/sqlite';

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
    
    const appointment = db.prepare(`
      SELECT 
        a.*,
        s.name as serviceName,
        s.duration as serviceDuration,
        st.firstName || ' ' || st.lastName as staffName
      FROM appointments a
      LEFT JOIN services s ON a.serviceId = s.id
      LEFT JOIN staff st ON a.staffId = st.id
      WHERE a.id = ?
    `).get(id);
    
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
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Update customer information
    let updateData: any = {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      date: data.date,
      time: data.time,
      status: data.status,
      notes: data.notes,
      duration: data.duration,
      paymentType: data.paymentType,
      updatedAt: new Date().toISOString()
    };

    if (data.serviceId) {
      const service = db.prepare('SELECT * FROM services WHERE id = ?').get(data.serviceId) as any;
      if (service) {
        updateData.serviceId = data.serviceId;
        updateData.serviceName = service.name;
        updateData.price = service.price;
        updateData.duration = service.duration;
      }
    }

    if (data.staffId) {
      const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(data.staffId) as any;
      if (staff) {
        updateData.staffId = data.staffId;
        updateData.staffName = `${staff.firstName} ${staff.lastName}`;
      }
    }

    if (data.customerId) {
      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(data.customerId) as any;
      if (customer) {
        updateData.customerId = data.customerId;
        updateData.customerName = `${customer.firstName} ${customer.lastName}`;
      }
    }
    
    // Build update query
    const fields = Object.keys(updateData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = [...Object.values(updateData), id];
    
    db.prepare(`UPDATE appointments SET ${setClause} WHERE id = ?`).run(...values);
    
    // Get updated appointment
    const updatedAppointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);

    return NextResponse.json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update appointment' },
      { status: 400, headers: corsHeaders }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    db.prepare('DELETE FROM appointments WHERE id = ?').run(id);

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted successfully'
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete appointment' },
      { status: 400, headers: corsHeaders }
    );
  }
}