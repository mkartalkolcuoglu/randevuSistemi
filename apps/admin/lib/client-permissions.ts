// Client-safe permission utilities
// This file can be imported in Client Components

import type { StaffPermissions } from './permissions';

export interface ClientUser {
  tenantId: string;
  ownerName: string;
  userType: 'owner' | 'staff';
  staffId?: string;
  role: string;
  permissions: StaffPermissions | null;
}

export type Action = 'read' | 'create' | 'update' | 'delete';

/**
 * Check if user has specific permission for a page/action
 * Works in both Client and Server Components
 */
export function hasPermission(
  user: ClientUser | null,
  page: keyof StaffPermissions,
  action: Action
): boolean {
  if (!user) return false;
  
  // Owners always have full permissions
  if (user.userType === 'owner') return true;
  
  // Staff users check their specific permissions
  if (!user.permissions) return false;
  return !!user.permissions[page]?.[action];
}

/**
 * Check if user can access a page (read permission)
 * Works in both Client and Server Components
 */
export function canAccessPage(
  user: ClientUser | null,
  page: keyof StaffPermissions
): boolean {
  return hasPermission(user, page, 'read');
}

/**
 * Get list of accessible pages for a user
 * Works in both Client and Server Components
 */
export function getAccessiblePages(user: ClientUser | null): (keyof StaffPermissions)[] {
  if (!user) return [];
  if (user.userType === 'owner') {
    return ['dashboard', 'appointments', 'customers', 'services', 'staff', 'packages', 'kasa', 'stock', 'reports', 'settings'];
  }
  if (!user.permissions) return [];
  return (Object.keys(user.permissions) as (keyof StaffPermissions)[]).filter(page =>
    canAccessPage(user, page)
  );
}

