import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
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
      staffId?: string;
      ownerId?: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET - Get tenant settings
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only owners can view settings
    if (auth.userType !== 'owner') {
      return NextResponse.json(
        { success: false, message: 'Sadece işletme sahipleri ayarları görüntüleyebilir' },
        { status: 403 }
      );
    }

    // Fetch tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'İşletme bulunamadı' },
        { status: 404 }
      );
    }

    // Fetch settings
    const settings = await prisma.settings.findUnique({
      where: { tenantId: auth.tenantId },
    });

    // Parse theme JSON
    let themeData: any = {};
    if (tenant.theme) {
      try {
        themeData = typeof tenant.theme === 'string' ? JSON.parse(tenant.theme) : tenant.theme;
      } catch (e) {
        console.error('Error parsing theme:', e);
      }
    }

    // Parse workingHours JSON
    let workingHoursData: any = {
      monday: { start: '09:00', end: '18:00', closed: false },
      tuesday: { start: '09:00', end: '18:00', closed: false },
      wednesday: { start: '09:00', end: '18:00', closed: false },
      thursday: { start: '09:00', end: '18:00', closed: false },
      friday: { start: '09:00', end: '18:00', closed: false },
      saturday: { start: '09:00', end: '17:00', closed: false },
      sunday: { start: '10:00', end: '16:00', closed: true },
    };

    if (tenant.workingHours) {
      try {
        workingHoursData = typeof tenant.workingHours === 'string'
          ? JSON.parse(tenant.workingHours)
          : tenant.workingHours;
      } catch (e) {
        console.error('Error parsing workingHours:', e);
      }
    }

    // Prepare response data
    const responseData = {
      // Business Info
      businessName: tenant.businessName,
      businessType: tenant.businessType || 'salon',
      businessDescription: tenant.businessDescription || '',
      address: tenant.address || '',
      slug: tenant.slug,

      // Owner Info
      ownerName: tenant.ownerName,
      ownerEmail: tenant.ownerEmail,
      phone: tenant.phone || '',
      username: tenant.username,

      // Theme Settings
      theme: {
        primaryColor: themeData.primaryColor || tenant.primaryColor || '#163974',
        secondaryColor: themeData.secondaryColor || '#0F2A52',
        logo: themeData.logo || tenant.logo || '',
        headerImage: themeData.headerImage || '',
      },

      // Location
      location: themeData.location || {
        latitude: '41.0082',
        longitude: '28.9784',
        address: '',
      },

      // Documents
      documents: themeData.documents || {
        identityDocument: null,
        taxDocument: null,
        iban: '',
        signatureDocument: null,
      },

      // Working Hours
      workingHours: workingHoursData,

      // Appointment Settings
      appointmentTimeInterval: settings?.appointmentTimeInterval || 30,
      blacklistThreshold: settings?.blacklistThreshold || 3,
      reminderMinutes: settings?.reminderMinutes || 120,

      // Payment Settings
      cardPaymentEnabled: tenant.cardPaymentEnabled !== false,

      // Subscription Info
      plan: tenant.plan || 'Standard',
      status: tenant.status || 'active',
      subscriptionStart: tenant.subscriptionStart?.toISOString() || null,
      subscriptionEnd: tenant.subscriptionEnd?.toISOString() || null,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    console.error('Get settings error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Update tenant settings
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only owners can update settings
    if (auth.userType !== 'owner') {
      return NextResponse.json(
        { success: false, message: 'Sadece işletme sahipleri ayarları güncelleyebilir' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      // Business Info
      businessName,
      businessType,
      businessDescription,
      address,
      // Owner Info
      ownerName,
      ownerEmail,
      phone,
      password,
      // Theme
      theme,
      // Location
      location,
      // Documents
      documents,
      // Working Hours
      workingHours,
      // Appointment Settings
      appointmentTimeInterval,
      blacklistThreshold,
      reminderMinutes,
      // Payment
      cardPaymentEnabled,
    } = body;

    // Prepare tenant update data
    const tenantUpdateData: any = {};

    // Business Info
    if (businessName !== undefined) tenantUpdateData.businessName = businessName;
    if (businessType !== undefined) tenantUpdateData.businessType = businessType;
    if (businessDescription !== undefined) tenantUpdateData.businessDescription = businessDescription;
    if (address !== undefined) tenantUpdateData.address = address;

    // Owner Info
    if (ownerName !== undefined) tenantUpdateData.ownerName = ownerName;
    if (ownerEmail !== undefined) tenantUpdateData.ownerEmail = ownerEmail;
    if (phone !== undefined) tenantUpdateData.phone = phone;

    // Password (only if provided)
    if (password && password.trim() !== '') {
      tenantUpdateData.password = password;
    }

    // Payment
    if (cardPaymentEnabled !== undefined) {
      tenantUpdateData.cardPaymentEnabled = cardPaymentEnabled;
    }

    // Working Hours
    if (workingHours) {
      tenantUpdateData.workingHours = JSON.stringify(workingHours);
    }

    // Theme, Location, Documents - combine into theme JSON
    if (theme || location || documents) {
      // Get existing theme data
      const existingTenant = await prisma.tenant.findUnique({
        where: { id: auth.tenantId },
        select: { theme: true },
      });

      let existingThemeData: any = {};
      if (existingTenant?.theme) {
        try {
          existingThemeData = typeof existingTenant.theme === 'string'
            ? JSON.parse(existingTenant.theme)
            : existingTenant.theme;
        } catch (e) {
          console.error('Error parsing existing theme:', e);
        }
      }

      // Merge new data
      if (theme) {
        existingThemeData.primaryColor = theme.primaryColor || existingThemeData.primaryColor;
        existingThemeData.secondaryColor = theme.secondaryColor || existingThemeData.secondaryColor;
        if (theme.logo !== undefined) existingThemeData.logo = theme.logo;
        if (theme.headerImage !== undefined) existingThemeData.headerImage = theme.headerImage;

        // Also update separate fields for compatibility
        if (theme.primaryColor) tenantUpdateData.primaryColor = theme.primaryColor;
        if (theme.logo) tenantUpdateData.logo = theme.logo;
      }

      if (location) {
        existingThemeData.location = location;
      }

      if (documents) {
        existingThemeData.documents = {
          ...existingThemeData.documents,
          ...documents,
        };
      }

      tenantUpdateData.theme = JSON.stringify(existingThemeData);
    }

    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: auth.tenantId },
      data: tenantUpdateData,
    });

    // Update or create settings
    const settingsUpdateData: any = {};

    if (businessName) settingsUpdateData.businessName = businessName;
    if (phone) settingsUpdateData.businessPhone = phone;
    if (address) settingsUpdateData.businessAddress = address;
    if (ownerEmail) settingsUpdateData.businessEmail = ownerEmail;
    if (appointmentTimeInterval !== undefined) {
      settingsUpdateData.appointmentTimeInterval = parseInt(appointmentTimeInterval);
    }
    if (blacklistThreshold !== undefined) {
      settingsUpdateData.blacklistThreshold = parseInt(blacklistThreshold);
    }
    if (reminderMinutes !== undefined) {
      settingsUpdateData.reminderMinutes = parseInt(reminderMinutes);
    }
    if (workingHours) {
      settingsUpdateData.workingHours = JSON.stringify(workingHours);
    }

    const existingSettings = await prisma.settings.findUnique({
      where: { tenantId: auth.tenantId },
    });

    if (existingSettings) {
      await prisma.settings.update({
        where: { tenantId: auth.tenantId },
        data: settingsUpdateData,
      });
    } else if (Object.keys(settingsUpdateData).length > 0) {
      await prisma.settings.create({
        data: {
          tenantId: auth.tenantId,
          businessName: businessName || updatedTenant.businessName,
          ...settingsUpdateData,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Ayarlar güncellendi',
    });
  } catch (error: any) {
    console.error('Update settings error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Ayarlar güncellenirken bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
