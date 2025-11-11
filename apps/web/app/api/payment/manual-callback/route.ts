import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Manual Callback Endpoint for Test Mode
 *
 * PayTR test modunda callback göndermediği için, success sayfasından manuel tetiklenir
 *
 * POST /api/payment/manual-callback?merchant_oid=XXX
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [MANUAL CALLBACK] Manual callback triggered');

    const { searchParams } = new URL(request.url);
    const merchantOid = searchParams.get('merchant_oid');

    if (!merchantOid) {
      return NextResponse.json({
        success: false,
        error: 'merchant_oid required'
      }, { status: 400 });
    }

    console.log('🔍 [MANUAL CALLBACK] Looking for payment:', merchantOid);

    // Payment kaydını bul
    const payment = await prisma.payment.findUnique({
      where: { merchantOid }
    });

    if (!payment) {
      console.error('❌ [MANUAL CALLBACK] Payment not found:', merchantOid);
      return NextResponse.json({
        success: false,
        error: 'Payment not found'
      }, { status: 404 });
    }

    console.log('📦 [MANUAL CALLBACK] Payment found:', {
      id: payment.id,
      status: payment.status,
      hasBasket: !!payment.userBasket
    });

    // Eğer zaten işlenmişse VE tenant varsa, tekrar işleme
    if (payment.status !== 'pending' && payment.tenantId) {
      console.log('⚠️ [MANUAL CALLBACK] Payment already processed and tenant exists:', payment.status);
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        status: payment.status,
        tenantId: payment.tenantId
      });
    }

    // Eğer payment success ama tenant yoksa, yine de tenant oluştur
    if (payment.status === 'success' && !payment.tenantId) {
      console.log('🔄 [MANUAL CALLBACK] Payment is success but no tenant, will create tenant...');
    }

    // Payment'i success yap (sadece pending ise)
    if (payment.status === 'pending') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'success',
          paymentType: 'card',
          paidAt: new Date()
        }
      });
      console.log('✅ [MANUAL CALLBACK] Payment marked as success');
    } else {
      console.log('ℹ️ [MANUAL CALLBACK] Payment already marked as:', payment.status);
    }

    // userBasket'i işle
    if (payment.userBasket) {
      try {
        const basketData = JSON.parse(payment.userBasket);
        console.log('📝 [MANUAL CALLBACK] Basket data:', basketData);

        if (basketData.type === 'business_registration') {
          console.log('🏢 [MANUAL CALLBACK] Processing business registration...');

          // Hash password
          const hashedPassword = await bcrypt.hash(basketData.password, 10);

          // Slug oluştur
          const generateSlug = (name: string): string => {
            return name
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim();
          };

          let slug = generateSlug(basketData.businessName);

          // Benzersiz slug
          let slugExists = await prisma.tenant.findUnique({ where: { slug } });
          let counter = 1;
          while (slugExists) {
            slug = `${generateSlug(basketData.businessName)}-${counter}`;
            slugExists = await prisma.tenant.findUnique({ where: { slug } });
            counter++;
          }

          console.log('📝 [MANUAL CALLBACK] Generated slug:', slug);

          const domain = `${slug}.netrandevu.com`;
          const username = basketData.username;

          // Subscription tarihlerini hesapla (paket süresine göre)
          const subscriptionStart = new Date();
          const durationDays = basketData.packageDurationDays || 30; // Default 30 gün
          const subscriptionEnd = new Date(subscriptionStart.getTime() + durationDays * 24 * 60 * 60 * 1000);

          console.log('📅 [MANUAL CALLBACK] Subscription dates:', {
            start: subscriptionStart.toISOString(),
            end: subscriptionEnd.toISOString(),
            durationDays
          });

          // Tenant oluştur
          const tenant = await prisma.tenant.create({
            data: {
              id: `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              businessName: basketData.businessName,
              slug: slug,
              domain: domain,
              username: username,
              password: hashedPassword,
              ownerName: basketData.ownerName,
              ownerEmail: basketData.ownerEmail,
              phone: basketData.phone || null,
              plan: basketData.subscriptionPlan || 'Standard',
              status: 'active',
              address: basketData.address || null,
              businessType: basketData.businessType || 'other',
              businessDescription: basketData.businessDescription || null,
              subscriptionStart: subscriptionStart,
              subscriptionEnd: subscriptionEnd,
              monthlyRevenue: 0,
              appointmentCount: 0,
              customerCount: 0,
              createdAt: new Date()
            }
          });

          console.log('✅ [MANUAL CALLBACK] Tenant created:', tenant.id);

          // Payment'ı tenant ile ilişkilendir
          await prisma.payment.update({
            where: { id: payment.id },
            data: { tenantId: tenant.id }
          });

          console.log('✅ [MANUAL CALLBACK] Business registration completed');

          // Send welcome email (non-blocking)
          console.log('📧 [MANUAL CALLBACK] Sending welcome email...');
          fetch(`${process.env.NEXT_PUBLIC_WEB_URL || 'https://netrandevu.com'}/api/send-welcome-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessName: basketData.businessName,
              slug: slug,
              username: username,
              password: basketData.password,
              ownerName: basketData.ownerName,
              ownerEmail: basketData.ownerEmail,
              adminPanelUrl: 'https://admin.netrandevu.com/login',
              landingPageUrl: `https://netrandevu.com/${slug}`
            })
          }).then(async res => {
            const responseText = await res.text();
            if (res.ok) {
              console.log('✅ [MANUAL CALLBACK] Welcome email sent successfully');
            } else {
              console.error('❌ [MANUAL CALLBACK] Welcome email error:', res.status, responseText);
            }
          }).catch(err => {
            console.error('❌ [MANUAL CALLBACK] Welcome email call failed:', err);
          });

          return NextResponse.json({
            success: true,
            message: 'Business registration completed',
            tenant: {
              id: tenant.id,
              slug: tenant.slug,
              domain: tenant.domain
            }
          });
        }

      } catch (error) {
        console.error('❌ [MANUAL CALLBACK] Error processing basket:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
          console.error('Stack:', error.stack);
        }
        return NextResponse.json({
          success: false,
          error: 'Failed to process registration',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment processed'
    });

  } catch (error) {
    console.error('❌ [MANUAL CALLBACK] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
