import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası gerekli' },
        { status: 400 }
      );
    }

    // Format phone - remove leading 0 if exists
    const formattedPhone = phone.replace(/^0/, '').replace(/\s/g, '');

    // Find customer by phone across all tenants
    const customers = await prisma.customer.findMany({
      where: {
        phone: {
          contains: formattedPhone
        }
      },
      include: {
        tenant: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            address: true
          }
        }
      }
    });

    if (customers.length === 0) {
      return NextResponse.json({
        success: true,
        appointments: [],
        customer: null,
        message: 'Bu telefon numarasına ait kayıt bulunamadı'
      });
    }

    // Get all appointments for these customers
    const customerIds = customers.map(c => c.id);

    const appointments = await prisma.appointment.findMany({
      where: {
        customerId: {
          in: customerIds
        }
      },
      include: {
        service: {
          select: {
            name: true
          }
        },
        staff: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        customer: {
          include: {
            tenant: {
              select: {
                businessName: true,
                phone: true,
                address: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Format appointments for response
    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      date: apt.date.toISOString().split('T')[0],
      time: apt.time,
      status: apt.status,
      serviceName: apt.service?.name || 'Hizmet',
      staffName: apt.staff ? `${apt.staff.firstName} ${apt.staff.lastName}` : 'Personel',
      price: apt.price || 0,
      duration: apt.duration || 30,
      notes: apt.notes,
      businessName: apt.customer?.tenant?.businessName,
      businessPhone: apt.customer?.tenant?.phone,
      businessAddress: apt.customer?.tenant?.address
    }));

    // Get primary customer info
    const primaryCustomer = customers[0];

    return NextResponse.json({
      success: true,
      appointments: formattedAppointments,
      customer: {
        id: primaryCustomer.id,
        firstName: primaryCustomer.firstName,
        lastName: primaryCustomer.lastName,
        phone: primaryCustomer.phone,
        email: primaryCustomer.email
      }
    });

  } catch (error) {
    console.error('Customer appointments error:', error);
    return NextResponse.json(
      { success: false, error: 'Randevular yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}
