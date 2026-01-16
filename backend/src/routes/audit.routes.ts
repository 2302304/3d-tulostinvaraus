import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware.js';
import { auditService, EntityType, AuditAction } from '../services/audit.service.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

// Kaikki audit-reitit vaativat ADMIN-roolin
router.use(authenticate, authorize('ADMIN'));

/**
 * GET /api/audit
 * Hae audit-lokit (admin)
 */
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      entityType,
      entityId,
      userId,
      action,
      startDate,
      endDate,
      limit,
      offset,
    } = req.query;

    const filters = {
      entityType: entityType as EntityType | undefined,
      entityId: entityId as string | undefined,
      userId: userId as string | undefined,
      action: action as AuditAction | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    };

    const result = await auditService.getAll(filters);

    res.json({
      success: true,
      data: result.logs,
      meta: {
        total: result.total,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      },
    });
  })
);

/**
 * GET /api/audit/entity/:entityType/:entityId
 * Hae tietyn entiteetin historia (admin)
 */
router.get(
  '/entity/:entityType/:entityId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { entityType, entityId } = req.params;

    const logs = await auditService.getEntityHistory(
      entityType as EntityType,
      entityId
    );

    res.json({
      success: true,
      data: logs,
    });
  })
);

export default router;
