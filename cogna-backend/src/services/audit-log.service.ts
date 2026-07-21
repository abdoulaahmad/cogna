import prisma from '@/config/database';
import type { AuditLog, Prisma } from '@prisma/client';

export interface AuditLogMetadata {
  reason: string;
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
  requestState?: string;
  approvalState?: string;
  [key: string]: unknown;
}

export const AuditLogService = {
  /**
   * Persists an immutable, structured admin activity log event.
   */
  async recordAuditEvent(
    userId: string | null,
    action: string,
    entity: string | null,
    entityId: string | null,
    ipAddress: string | null,
    metadata: AuditLogMetadata
  ): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        ipAddress,
        metadata: metadata as unknown as Prisma.InputJsonValue,
      },
    });
  },
};
