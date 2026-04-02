import { prisma } from './prisma';

interface AuditParams {
  tenantId: string;
  userId?: string;
  userName?: string;
  userType?: string; // owner, staff, customer
  action: string; // create, update, delete, cancel, status_change
  entity: string; // appointment, transaction, customer, service, staff, settings, package, product
  entityId?: string;
  summary: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  source?: string; // web, mobile, admin
}

export async function createAuditLog(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        userName: params.userName,
        userType: params.userType,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        summary: params.summary,
        oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
        newValues: params.newValues ? JSON.stringify(params.newValues) : null,
        ipAddress: params.ipAddress,
        source: params.source,
      },
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

export function getIpFromRequest(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
