import { prisma } from './prisma';

/**
 * Check if a date falls within any blocked date range for the tenant (or specific staff).
 * Returns the blocking record if blocked, or null if available.
 */
export async function getBlockingDate(
  tenantId: string,
  date: string,
  staffId?: string
): Promise<{ title: string } | null> {
  const blockedDate = await prisma.blockedDate.findFirst({
    where: {
      tenantId,
      startDate: { lte: date },
      endDate: { gte: date },
      OR: [
        { staffId: null },
        ...(staffId ? [{ staffId }] : []),
      ],
    },
    select: { title: true },
  });
  return blockedDate;
}
