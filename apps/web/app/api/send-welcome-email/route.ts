import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface WelcomeEmailData {
  businessName: string;
  slug: string;
  username: string;
  password: string;
  ownerName: string;
  ownerEmail: string;
  adminPanelUrl: string;
  landingPageUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: WelcomeEmailData = await request.json();

    const emailHtml = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Net Randevu'ya Hoş Geldiniz</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #163974 0%, #1e4b8f 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <img src="https://i.hizliresim.com/4a00l8g.png" alt="Net Randevu" style="height: 50px; margin-bottom: 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Hoş Geldiniz!</h1>
              <p style="color: #e5e7eb; margin: 10px 0 0 0; font-size: 16px;">Kayıt işleminiz başarıyla tamamlandı</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Merhaba <strong>${data.ownerName}</strong>,
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                <strong>${data.businessName}</strong> işletmeniz için Net Randevu sistemine kaydınız başarıyla oluşturuldu. Aşağıda giriş bilgilerinizi ve önemli bağlantılarınızı bulabilirsiniz.
              </p>
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-left: 4px solid #163974; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="color: #163974; font-size: 18px; margin: 0 0 15px 0;">📋 Giriş Bilgileriniz</h2>
                    
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 8px 0;"><strong>İşletme Adı:</strong></td>
                        <td style="color: #111827; font-size: 14px; padding: 8px 0;">${data.businessName}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 8px 0;"><strong>Kullanıcı Adı:</strong></td>
                        <td style="color: #111827; font-size: 14px; padding: 8px 0;"><code style="background-color: #f9fafb; padding: 4px 8px; border-radius: 4px;">${data.username}</code></td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 8px 0;"><strong>Şifre:</strong></td>
                        <td style="color: #111827; font-size: 14px; padding: 8px 0;"><code style="background-color: #f9fafb; padding: 4px 8px; border-radius: 4px;">${data.password}</code></td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 8px 0;"><strong>URL Slug:</strong></td>
                        <td style="color: #111827; font-size: 14px; padding: 8px 0;"><code style="background-color: #f9fafb; padding: 4px 8px; border-radius: 4px;">${data.slug}</code></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Action Buttons -->
              <h2 style="color: #111827; font-size: 18px; margin: 0 0 15px 0;">🚀 Hemen Başlayın</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding: 10px 0;">
                    <a href="${data.adminPanelUrl}" style="display: inline-block; background-color: #163974; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      🔐 Admin Panele Giriş Yap
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <a href="${data.landingPageUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      🌐 Randevu Sayfanızı Görün
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Important Note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin-top: 30px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                      <strong>⚠️ Önemli:</strong> Bu e-postayı güvenli bir yerde saklayın. Giriş bilgilerinizi içermektedir. Şifrenizi admin panelden dilediğiniz zaman değiştirebilirsiniz.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.
              </p>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
                İyi çalışmalar dileriz! 🎉<br>
                <strong>Net Randevu Ekibi</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Net Randevu. Tüm hakları saklıdır.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">
                <a href="https://netrandevu.com" style="color: #163974; text-decoration: none;">netrandevu.com</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    if (!resend) {
      console.warn('⚠️ Resend API key not configured, skipping email');
      return NextResponse.json({
        success: true,
        message: 'Email service not configured'
      });
    }

    const { data: emailData, error } = await resend.emails.send({
      from: 'Net Randevu <bilgi@netrandevu.com>',
      to: [data.ownerEmail],
      subject: `Hoş Geldiniz ${data.businessName} - Net Randevu Giriş Bilgileriniz`,
      html: emailHtml,
    });

    if (error) {
      console.error('❌ Email send error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Welcome email sent:', emailData);
    return NextResponse.json({ success: true, data: emailData });
  } catch (error: any) {
    console.error('❌ Email API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

