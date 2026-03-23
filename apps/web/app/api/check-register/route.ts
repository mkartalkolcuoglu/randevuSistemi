import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

const ALLOWED_FIELDS = ['email', 'phone', 'businessName'] as const;
type CheckField = (typeof ALLOWED_FIELDS)[number];

/**
 * Check if a registration field value already exists
 *
 * GET /api/check-register?field=email&value=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const field = searchParams.get('field') as CheckField | null;
    const value = searchParams.get('value');

    if (!field || !ALLOWED_FIELDS.includes(field) || !value) {
      return NextResponse.json(
        { success: false, error: 'field and value are required' },
        { status: 400 }
      );
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return NextResponse.json({ success: true, available: true });
    }

    let where: Record<string, unknown>;

    switch (field) {
      case 'email':
        where = { ownerEmail: trimmed.toLowerCase() };
        break;
      case 'phone': {
        // Normalize: remove non-digits, strip leading 0
        const digits = trimmed.replace(/\D/g, '');
        const normalized = digits.startsWith('0') ? digits.slice(1) : digits;
        where = { phone: normalized };
        break;
      }
      case 'businessName':
        where = { businessName: trimmed };
        break;
    }

    const existing = await prisma.tenant.findFirst({
      where,
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      available: !existing,
    });
  } catch (error) {
    console.error('❌ [CHECK REGISTER] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Kontrol sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}
