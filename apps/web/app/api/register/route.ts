import { NextRequest, NextResponse } from 'next/server';

// Helper to generate slug from business name
function generateSlug(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper to check slug availability and generate unique slug
async function getUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  // Get project-admin URL from environment or use default
  const projectAdminUrl = process.env.PROJECT_ADMIN_URL || 'https://randevu-sistemi-project-admin.vercel.app';
  
  while (true) {
    // Check if slug exists in project-admin database
    try {
      const checkResponse = await fetch(`${projectAdminUrl}/api/tenants/check-slug?slug=${slug}`);
      const checkData = await checkResponse.json();
      
      if (!checkData.exists) {
        return slug;
      }
      
      // Slug exists, try with counter
      counter++;
      slug = `${baseSlug}-${counter}`;
    } catch (error) {
      console.error('Error checking slug:', error);
      // If check fails, return slug with timestamp to ensure uniqueness
      return `${baseSlug}-${Date.now()}`;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('📝 Registration request received:', {
      businessName: data.businessName,
      subscriptionPlan: data.subscriptionPlan
    });

    // Generate unique slug
    const baseSlug = generateSlug(data.businessName);
    const uniqueSlug = await getUniqueSlug(baseSlug);
    
    console.log('🔗 Generated slug:', uniqueSlug);

    // Calculate subscription dates
    const now = new Date();
    let daysToAdd = 15; // Default trial
    
    switch (data.subscriptionPlan) {
      case 'trial':
        daysToAdd = 15;
        break;
      case 'monthly':
        daysToAdd = 30;
        break;
      case 'yearly':
        daysToAdd = 365;
        break;
    }
    
    const subscriptionStart = now.toISOString();
    const subscriptionEnd = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

    console.log('📅 Subscription dates:', {
      start: subscriptionStart,
      end: subscriptionEnd,
      days: daysToAdd
    });

    // Create tenant in project-admin database
    const tenantData = {
      businessName: data.businessName,
      slug: uniqueSlug,
      domain: `${uniqueSlug}.randevu.com`,
      username: data.username,
      password: data.password,
      ownerName: data.ownerName,
      ownerEmail: data.ownerEmail,
      phone: data.phone,
      address: data.address || '',
      businessType: data.businessType || 'other',
      businessDescription: data.businessDescription || '',
      status: 'active',
      subscriptionPlan: data.subscriptionPlan,
      subscriptionStart: subscriptionStart,
      subscriptionEnd: subscriptionEnd,
      workingHours: {
        monday: { start: '09:00', end: '18:00', closed: false },
        tuesday: { start: '09:00', end: '18:00', closed: false },
        wednesday: { start: '09:00', end: '18:00', closed: false },
        thursday: { start: '09:00', end: '18:00', closed: false },
        friday: { start: '09:00', end: '18:00', closed: false },
        saturday: { start: '09:00', end: '17:00', closed: false },
        sunday: { start: '10:00', end: '16:00', closed: true }
      },
      theme: {
        primaryColor: '#163974',
        secondaryColor: '#0F2A52',
        logo: '',
        headerImage: ''
      }
    };

    console.log('📤 Creating tenant in project-admin...');

    // Get project-admin URL from environment or use default
    const projectAdminUrl = process.env.PROJECT_ADMIN_URL || 'https://randevu-sistemi-project-admin.vercel.app';

    // Call project-admin API to create tenant
    const createResponse = await fetch(`${projectAdminUrl}/api/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tenantData),
    });

    const createData = await createResponse.json();
    
    console.log('📥 Project-admin response:', {
      success: createData.success,
      tenantId: createData.data?.id
    });

    if (!createData.success) {
      return NextResponse.json(
        { success: false, error: createData.error || 'Tenant oluşturulurken hata oluştu' },
        { status: 400 }
      );
    }

    // Return success with credentials
    return NextResponse.json({
      success: true,
      data: {
        id: createData.data.id,
        businessName: data.businessName,
        username: data.username,
        slug: uniqueSlug,
        subscriptionPlan: data.subscriptionPlan,
        subscriptionStart: subscriptionStart,
        subscriptionEnd: subscriptionEnd
      },
      message: 'Kayıt başarılı!'
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Kayıt işlemi sırasında hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

