import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';

export const paymentsRouter = Router();

// GET /api/payments
paymentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status,
      paymentMethod,
      failureReason,
      minAmount,
      maxAmount,
      search,
      limit = '100',
      offset = '0',
    } = req.query;

    const where: any = {};

    if (status && typeof status === 'string') {
      where.status = status.toUpperCase();
    }

    if (paymentMethod && typeof paymentMethod === 'string') {
      where.paymentMethod = paymentMethod.toUpperCase();
    }

    if (failureReason && typeof failureReason === 'string') {
      where.failureReason = failureReason;
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount as string);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount as string);
    }

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { id: { contains: q } },
        { orderId: { contains: q } },
        { customer: { name: { contains: q } } },
        { customer: { email: { contains: q } } },
      ];
    }

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        include: {
          customer: true,
          recoveryOpportunity: true,
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
      }),
    ]);

    res.json({
      total,
      count: payments.length,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      data: payments,
    });
  } catch (error: any) {
    console.error('[PaymentsAPI] Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to retrieve payments', message: error?.message });
  }
});

// GET /api/payments/:id
paymentsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ id }, { orderId: id }],
      },
      include: {
        customer: true,
        recoveryOpportunity: true,
        recoveryAttempts: { orderBy: { attemptedAt: 'desc' } },
        messages: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    res.json(payment);
  } catch (error: any) {
    console.error(`[PaymentsAPI] Error fetching payment ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve payment', message: error?.message });
  }
});
