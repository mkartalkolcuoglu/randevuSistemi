import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    // Get tenant ID from cookies
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tenant-session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    let tenantId;
    try {
      const sessionData = JSON.parse(sessionCookie.value);
      tenantId = sessionData.tenantId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz oturum' },
        { status: 401 }
      );
    }

    // Get settings for this tenant
    let settings = await prisma.settings.findUnique({
      where: { tenantId: tenantId }
    });
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          tenantId: tenantId,
          businessName: "Güzellik Merkezi",
          businessAddress: "",
          businessPhone: "",
          businessEmail: "",
          workingHours: JSON.stringify({
            monday: { start: "09:00", end: "18:00", closed: false },
            tuesday: { start: "09:00", end: "18:00", closed: false },
            wednesday: { start: "09:00", end: "18:00", closed: false },
            thursday: { start: "09:00", end: "18:00", closed: false },
            friday: { start: "09:00", end: "18:00", closed: false },
            saturday: { start: "09:00", end: "17:00", closed: false },
            sunday: { start: "10:00", end: "16:00", closed: true }
          }),
          notificationSettings: JSON.stringify({
            emailNotifications: true,
            smsNotifications: true,
            appointmentReminders: true,
            marketingEmails: false
          }),
          paymentSettings: JSON.stringify({
            acceptCash: true,
            acceptCard: true,
            acceptDigital: true,
            taxRate: 18
          }),
          themeSettings: JSON.stringify({
            primaryColor: '#163974',
            secondaryColor: '#0F2A52',
            accentColor: '#F97316',
            fontFamily: 'Inter',
            borderRadius: 'medium'
          })
        }
      });
    }

    // Parse JSON fields for response
    const responseData = {
      ...settings,
      workingHours: settings.workingHours ? JSON.parse(settings.workingHours) : {},
      notificationSettings: settings.notificationSettings ? JSON.parse(settings.notificationSettings) : {},
      paymentSettings: settings.paymentSettings ? JSON.parse(settings.paymentSettings) : {},
      themeSettings: settings.themeSettings ? JSON.parse(settings.themeSettings) : {}
    };

    return NextResponse.json({ 
      success: true, 
      data: responseData 
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Get tenant ID from cookies
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tenant-session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    let tenantId;
    try {
      const sessionData = JSON.parse(sessionCookie.value);
      tenantId = sessionData.tenantId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz oturum' },
        { status: 401 }
      );
    }
    
    // Get existing settings for this tenant
    let settings = await prisma.settings.findUnique({
      where: { tenantId: tenantId }
    });
    
    const settingsData = {
      tenantId: tenantId,
      businessName: data.businessName,
      businessAddress: data.businessAddress,
      businessPhone: data.businessPhone,
      businessEmail: data.businessEmail,
      workingHours: JSON.stringify(data.workingHours),
      notificationSettings: JSON.stringify(data.notificationSettings),
      paymentSettings: JSON.stringify(data.paymentSettings),
      themeSettings: data.themeSettings ? JSON.stringify(data.themeSettings) : null
    };

    if (settings) {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { tenantId: tenantId },
        data: settingsData
      });
    } else {
      // Create new settings
      settings = await prisma.settings.create({
        data: settingsData
      });
    }

    // Parse JSON fields for response
    const responseData = {
      ...settings,
      workingHours: JSON.parse(settings.workingHours || '{}'),
      notificationSettings: JSON.parse(settings.notificationSettings || '{}'),
      paymentSettings: JSON.parse(settings.paymentSettings || '{}'),
      themeSettings: JSON.parse(settings.themeSettings || '{}')
    };

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 400 }
    );
  }
}