import { prisma } from './db';

export async function logAudit({
  userId,
  userRole,
  action,
  entity,
  entityId,
  details,
}: {
  userId: string;
  userRole: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any> | string;
}) {
  try {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;
    await prisma.auditLog.create({
      data: {
        userId,
        userRole: userRole.toString(),
        action,
        entity,
        entityId,
        details: detailsStr,
      },
    });
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}
