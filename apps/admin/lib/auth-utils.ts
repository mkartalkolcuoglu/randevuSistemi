import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import type { StaffPermissions } from './permissions';
import { OWNER_PERMISSIONS, hasPermission as checkPermission, canAccessPage as checkPageAccess } from './permissions';

export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  businessName: string;
  slug: string;
  ownerName: string;
  ownerEmail?: string;
  userType: 'owner' | 'staff';
  staffId?: string;
  role: string;
  permissions: StaffPermissions | null;
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

    const userType = sessionData.userType || 'owner';
    const prisma = new PrismaClient();
    
    try {
      // If owner, verify tenant
      if (userType === 'owner') {
        const tenant = await prisma.tenant.findFirst({
          where: {
            id: sessionData.tenantId
            // Don't check status - middleware handles subscription
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
          tenantId: tenant.id,
          businessName: tenant.businessName,
          slug: tenant.slug,
          ownerName: tenant.ownerName,
          ownerEmail: tenant.ownerEmail,
          userType: 'owner',
          role: 'owner',
          permissions: OWNER_PERMISSIONS // Full permissions
        };
      }

      // If staff, verify staff member
      if (userType === 'staff' && sessionData.staffId) {
        const staff = await prisma.staff.findFirst({
          where: {
            id: sessionData.staffId,
            tenantId: sessionData.tenantId,
            status: 'active',
            canLogin: true
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            tenantId: true,
            permissions: true,
            role: true
          }
        });

        if (!staff) {
          return null;
        }

        // Get tenant info
        const tenant = await prisma.tenant.findUnique({
          where: { id: staff.tenantId },
          select: {
            businessName: true,
            slug: true
          }
        });

        if (!tenant) {
          return null;
        }

        // Parse permissions
        let permissions = null;
        if (staff.permissions) {
          try {
            permissions = JSON.parse(staff.permissions);
          } catch (e) {
            console.error('Error parsing permissions:', e);
          }
        }

        return {
          id: staff.id,
          tenantId: staff.tenantId,
          businessName: tenant.businessName,
          slug: tenant.slug,
          ownerName: `${staff.firstName} ${staff.lastName}`,
          userType: 'staff',
          staffId: staff.id,
          role: staff.role || 'staff',
          permissions: permissions
        };
      }

      return null;
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

// Permission check helpers
export function hasPermission(
  user: AuthenticatedUser | null,
  page: keyof StaffPermissions,
  action: 'read' | 'create' | 'update' | 'delete'
): boolean {
  if (!user) return false;
  if (user.userType === 'owner') return true; // Owners have all permissions
  return checkPermission(user.permissions, page, action);
}

export function canAccessPage(
  user: AuthenticatedUser | null,
  page: keyof StaffPermissions
): boolean {
  if (!user) return false;
  if (user.userType === 'owner') return true; // Owners can access all pages
  return checkPageAccess(user.permissions, page);
}

export async function requirePermission(
  page: keyof StaffPermissions,
  action: 'read' | 'create' | 'update' | 'delete'
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  if (!hasPermission(user, page, action)) {
    throw new Error('Permission denied');
  }
  
  return user;
}

export async function requirePageAccess(
  page: keyof StaffPermissions
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  if (!canAccessPage(user, page)) {
    throw new Error('Page access denied');
  }
  
  return user;
}
