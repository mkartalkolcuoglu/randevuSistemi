import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';


/**
 * PUT /api/customers/[id]/blacklist
 * Remove customer from blacklist (keep no-show count)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('🟢 [BLACKLIST] Removing customer from blacklist:', id);

    // Update customer - remove from blacklist but keep no-show count
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        isBlacklisted: false,
        blacklistedAt: null
      }
    });

    console.log(`✅ [BLACKLIST] Customer ${customer.firstName} ${customer.lastName} removed from blacklist`);
    console.log(`ℹ️ [BLACKLIST] No-show count remains: ${customer.noShowCount}`);

    return NextResponse.json({
      success: true,
      message: 'Müşteri kara listeden çıkarıldı',
      data: customer
    });

  } catch (error) {
    console.error('❌ [BLACKLIST] Error removing from blacklist:', error);
    return NextResponse.json(
      { success: false, error: 'Kara listeden çıkarılırken hata oluştu' },
      { status: 500 }
    );
  } finally {
  }
}

/**
 * DELETE /api/customers/[id]/blacklist
 * Remove customer from blacklist (keep no-show count)
 * Alias for PUT for backward compatibility
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}

