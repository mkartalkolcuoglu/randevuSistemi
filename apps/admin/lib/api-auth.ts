import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, hasPermission } from './auth-utils';
import type { StaffPermissions } from './permissions';

/**
 * Check if the authenticated user has permission for a specific action on a page
 * Use this in API routes to protect endpoints
 */
export async function checkApiPermission(
  request: NextRequest,
  page: keyof StaffPermissions,
  action: 'read' | 'create' | 'update' | 'delete'
): Promise<{ authorized: boolean; user: any; error?: NextResponse }> {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return {
        authorized: false,
        user: null,
        error: NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      };
    }

    // Check permission
    if (!hasPermission(user, page, action)) {
      console.log(`🚫 Permission denied: ${user.ownerName} tried ${action} on ${page}`);
      return {
        authorized: false,
        user,
        error: NextResponse.json(
          { success: false, error: 'Permission denied', code: 'INSUFFICIENT_PERMISSIONS' },
          { status: 403 }
        )
      };
    }

    // Permission granted
    return {
      authorized: true,
      user
    };
  } catch (error) {
    console.error('Error checking API permission:', error);
    return {
      authorized: false,
      user: null,
      error: NextResponse.json(
        { success: false, error: 'Authentication error' },
        { status: 500 }
      )
    };
  }
}

