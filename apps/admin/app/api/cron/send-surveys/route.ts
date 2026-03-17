import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all tenants with autoSendSurvey enabled
    const allSettings = await prisma.settings.findMany({
      where: {
        notificationSettings: { not: null },
      },
      select: {
        tenantId: true,
        notificationSettings: true,
      },
    });

    let totalSent = 0;
    let totalErrors = 0;

    for (const setting of allSettings) {
      let notifSettings: any = {};
      try {
        notifSettings = setting.notificationSettings ? JSON.parse(setting.notificationSettings) : {};
      } catch { continue; }

      if (!notifSettings.autoSendSurvey) continue;
      if (notifSettings.surveyChannel === 'off') continue;

      const delayMinutes = notifSettings.surveyDelayMinutes || 0;
      if (delayMinutes === 0) continue; // Immediate sends are handled in PUT handler

      // Find completed appointments that haven't had survey sent
      const appointments = await prisma.appointment.findMany({
        where: {
          tenantId: setting.tenantId,
          status: 'completed',
          feedbackSent: false,
          completedAt: { not: null },
        },
      });

      for (const apt of appointments) {
        // Check if enough time has passed since completion
        if (!apt.completedAt) continue;
        const completedAt = new Date(apt.completedAt);
        const sendAfter = new Date(completedAt.getTime() + delayMinutes * 60 * 1000);

        if (new Date() < sendAfter) continue;

        // Check if feedback already exists
        const existingFeedback = await prisma.feedback.findUnique({
          where: { appointmentId: apt.id },
        });
        if (existingFeedback) {
          // Mark as sent so we don't check again
          await prisma.appointment.update({
            where: { id: apt.id },
            data: { feedbackSent: true },
          });
          continue;
        }

        // Send survey
        try {
          const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.netrandevu.com';
          const res = await fetch(`${adminUrl}/api/whatsapp/send-survey`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appointmentId: apt.id }),
          });
          const result = await res.json();
          if (result.success) {
            totalSent++;
          } else {
            totalErrors++;
            console.error(`Survey send failed for ${apt.id}:`, result.error);
          }
        } catch (err) {
          totalErrors++;
          console.error(`Survey send error for ${apt.id}:`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: totalSent,
      errors: totalErrors,
    });
  } catch (error) {
    console.error('Cron send-surveys error:', error);
    return NextResponse.json(
      { success: false, error: 'Cron job failed' },
      { status: 500 }
    );
  }
}
