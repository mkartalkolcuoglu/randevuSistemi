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
      phone: string;
      userType: string;
      tenantId: string;
      staffId?: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET - Get single service by ID
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

    const service = await prisma.service.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Hizmet bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: service.id,
        tenantId: service.tenantId,
        name: service.name,
        description: service.description,
        price: service.price,
        duration: service.duration,
        category: service.category,
        status: service.status,
        isActive: service.status === 'active',
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get service error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT - Update service
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

    // Only staff and owners can update services
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if service exists and belongs to tenant
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingService) {
      return NextResponse.json(
        { success: false, message: 'Hizmet bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, price, duration, category, isActive, status } = body;

    if (!name || price === undefined || !duration) {
      return NextResponse.json(
        { success: false, message: 'Hizmet adı, fiyat ve süre zorunludur' },
        { status: 400 }
      );
    }

    // Validate price and duration
    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz fiyat değeri' },
        { status: 400 }
      );
    }

    if (typeof duration !== 'number' || duration < 5) {
      return NextResponse.json(
        { success: false, message: 'Süre en az 5 dakika olmalıdır' },
        { status: 400 }
      );
    }

    // Determine status - support both isActive boolean and status string
    let newStatus = existingService.status;
    if (status !== undefined) {
      newStatus = status;
    } else if (isActive !== undefined) {
      newStatus = isActive ? 'active' : 'inactive';
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price,
        duration,
        category: category?.trim() || null,
        status: newStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Hizmet güncellendi',
      data: {
        id: updatedService.id,
        name: updatedService.name,
        price: updatedService.price,
        duration: updatedService.duration,
        category: updatedService.category,
        status: updatedService.status,
        isActive: updatedService.status === 'active',
      },
    });
  } catch (error: any) {
    console.error('Update service error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Toggle service status (quick active/inactive toggle)
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

    // Only staff and owners can toggle service status
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if service exists and belongs to tenant
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingService) {
      return NextResponse.json(
        { success: false, message: 'Hizmet bulunamadı' },
        { status: 404 }
      );
    }

    // Toggle status
    const newStatus = existingService.status === 'active' ? 'inactive' : 'active';

    const updatedService = await prisma.service.update({
      where: { id },
      data: { status: newStatus },
    });

    return NextResponse.json({
      success: true,
      message: newStatus === 'active' ? 'Hizmet aktif edildi' : 'Hizmet pasif yapıldı',
      data: {
        id: updatedService.id,
        status: updatedService.status,
        isActive: updatedService.status === 'active',
      },
    });
  } catch (error: any) {
    console.error('Toggle service status error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete service
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

    // Only staff and owners can delete services
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if service exists and belongs to tenant
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingService) {
      return NextResponse.json(
        { success: false, message: 'Hizmet bulunamadı' },
        { status: 404 }
      );
    }

    // Check if service has any appointments
    const appointmentCount = await prisma.appointment.count({
      where: {
        serviceId: id,
      },
    });

    if (appointmentCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Bu hizmetin ${appointmentCount} randevusu var. Önce randevuları silmeniz veya hizmeti pasif yapmanız gerekiyor.`
        },
        { status: 400 }
      );
    }

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Hizmet silindi',
    });
  } catch (error: any) {
    console.error('Delete service error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
