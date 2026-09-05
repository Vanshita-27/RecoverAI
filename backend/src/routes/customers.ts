import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';

export const customersRouter = Router();

// GET /api/customers
customersRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { segment, search, limit = '100', offset = '0' } = req.query;

    const where: any = {};

    if (segment && typeof segment === 'string') {
      where.customerSegment = segment.toUpperCase();
    }

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: { payments: true },
          },
        },
        orderBy: { lifetimeValue: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
      }),
    ]);

    res.json({
      total,
      count: customers.length,
      data: customers,
    });
  } catch (error: any) {
    console.error('[CustomersAPI] Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to retrieve customers', message: error?.message });
  }
});

// GET /api/customers/:id
customersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        payments: {
          include: {
            recoveryOpportunity: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    res.json(customer);
  } catch (error: any) {
    console.error(`[CustomersAPI] Error fetching customer ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve customer', message: error?.message });
  }
});
