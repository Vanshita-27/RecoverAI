import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';

export const activityRouter = Router();

// GET /api/activity
activityRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { action, entityType, limit = '50', offset = '0' } = req.query;

    const where: any = {};

    if (action && typeof action === 'string') {
      where.action = action;
    }

    if (entityType && typeof entityType === 'string') {
      where.entityType = entityType;
    }

    const [total, activities] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
      }),
    ]);

    res.json({
      total,
      count: activities.length,
      data: activities,
    });
  } catch (error: any) {
    console.error('[ActivityAPI] Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to retrieve activity logs', message: error?.message });
  }
});
