import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  businessName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tenant-session');
    
    if (!sessionCookie) {
      return null;
    }

    const sessionData = JSON.parse(sessionCookie.value);
    
    if (!sessionData.tenantId) {
      return null;
    }

    // Verify user still exists and is active
    const prisma = new PrismaClient();
    try {
      const tenant = await prisma.tenant.findFirst({
        where: {
          id: sessionData.tenantId,
          status: 'active'
        },
        select: {
          id: true,
          businessName: true,
          slug: true,
          ownerName: true,
          ownerEmail: true
        }
      });

      if (!tenant) {
        return null;
      }

      return {
        id: tenant.id,
        businessName: tenant.businessName,
        slug: tenant.slug,
        ownerName: tenant.ownerName,
        ownerEmail: tenant.ownerEmail
      };
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}
