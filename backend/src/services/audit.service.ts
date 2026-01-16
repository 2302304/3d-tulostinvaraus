import { Prisma } from '@prisma/client';
import { prisma } from '../index.js';

// Audit-toimintojen tyypit
export type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'REGISTER'
  | 'RESERVATION_CREATE'
  | 'RESERVATION_UPDATE'
  | 'RESERVATION_CANCEL'
  | 'RESERVATION_DELETE'
  | 'PRINTER_CREATE'
  | 'PRINTER_UPDATE'
  | 'PRINTER_DELETE'
  | 'USER_ROLE_CHANGE'
  | 'USER_STATUS_CHANGE';

export type EntityType = 'USER' | 'RESERVATION' | 'PRINTER' | 'SYSTEM';

interface AuditLogInput {
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  userId?: string | null;
  oldValues?: Prisma.InputJsonValue | null;
  newValues?: Prisma.InputJsonValue | null;
}

export class AuditService {
  /**
   * Kirjaa tapahtuma audit-lokiin
   */
  async log(input: AuditLogInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          userId: input.userId,
          oldValues: input.oldValues ?? undefined,
          newValues: input.newValues ?? undefined,
        },
      });
    } catch (error) {
      // Audit-lokituksen epäonnistuminen ei saa kaataa pääoperaatiota
      console.error('Audit-lokitus epäonnistui:', error);
    }
  }

  /**
   * Hae audit-lokit (admin-toiminto)
   */
  async getAll(filters?: {
    entityType?: EntityType;
    entityId?: string;
    userId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: Record<string, unknown> = {};

    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }
    if (filters?.entityId) {
      where.entityId = filters.entityId;
    }
    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.action) {
      where.action = filters.action;
    }
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters?.startDate) {
        (where.createdAt as Record<string, Date>).gte = filters.startDate;
      }
      if (filters?.endDate) {
        (where.createdAt as Record<string, Date>).lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Hae tietyn entiteetin historia
   */
  async getEntityHistory(entityType: EntityType, entityId: string) {
    return prisma.auditLog.findMany({
      where: { entityType, entityId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const auditService = new AuditService();
