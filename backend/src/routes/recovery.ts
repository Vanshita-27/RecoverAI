import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { analyzePaymentRecovery } from '../services/recoveryEngine.js';

export const recoveryRouter = Router();

// GET /api/recovery/opportunities
recoveryRouter.get('/opportunities', async (req: Request, res: Response) => {
  try {
    const {
      status,
      minPriority,
      recommendedAction,
      recommendedChannel,
      limit = '100',
      offset = '0',
    } = req.query;

    const where: any = {};

    if (status && typeof status === 'string') {
      where.status = status.toUpperCase();
    }

    if (recommendedAction && typeof recommendedAction === 'string') {
      where.recommendedAction = recommendedAction;
    }

    if (recommendedChannel && typeof recommendedChannel === 'string') {
      where.recommendedChannel = recommendedChannel;
    }

    if (minPriority) {
      where.priorityScore = { gte: parseFloat(minPriority as string) };
    }

    const [total, opportunities] = await Promise.all([
      prisma.recoveryOpportunity.count({ where }),
      prisma.recoveryOpportunity.findMany({
        where,
        include: {
          payment: {
            include: {
              customer: true,
            },
          },
        },
        orderBy: { priorityScore: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
      }),
    ]);

    res.json({
      total,
      count: opportunities.length,
      data: opportunities,
    });
  } catch (error: any) {
    console.error('[RecoveryAPI] Error fetching recovery opportunities:', error);
    res.status(500).json({ error: 'Failed to retrieve recovery opportunities', message: error?.message });
  }
});

// GET /api/recovery/opportunities/:id
recoveryRouter.get('/opportunities/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const opportunity = await prisma.recoveryOpportunity.findFirst({
      where: {
        OR: [{ id }, { paymentId: id }],
      },
      include: {
        payment: {
          include: {
            customer: true,
            recoveryAttempts: true,
            messages: true,
          },
        },
      },
    });

    if (!opportunity) {
      res.status(404).json({ error: 'Recovery opportunity not found' });
      return;
    }

    res.json(opportunity);
  } catch (error: any) {
    console.error(`[RecoveryAPI] Error fetching opportunity ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve opportunity', message: error?.message });
  }
});

// POST /api/recovery/analyze/:paymentId
recoveryRouter.post('/analyze/:paymentId', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    // 1. Load payment
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ id: paymentId }, { orderId: paymentId }],
      },
      include: {
        customer: true,
      },
    });

    if (!payment) {
      res.status(404).json({ error: 'Payment not found for analysis' });
      return;
    }

    // 2. Load customer
    const customer = payment.customer;

    // 3. Analyze payment history & 4-9. Run deterministic recovery scoring engine
    const analysis = analyzePaymentRecovery({
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        failureReason: payment.failureReason,
        retryCount: payment.retryCount,
        createdAt: payment.createdAt,
      },
      customer: {
        id: customer.id,
        name: customer.name,
        lifetimeValue: customer.lifetimeValue,
        successfulPayments: customer.successfulPayments,
        failedPayments: customer.failedPayments,
        customerSegment: customer.customerSegment,
      },
    });

    // 10. Create or update the RecoveryOpportunity
    const opportunity = await prisma.recoveryOpportunity.upsert({
      where: { paymentId: payment.id },
      create: {
        paymentId: payment.id,
        recoveryProbability: analysis.recoveryProbability,
        priorityScore: analysis.priorityScore,
        recommendedAction: analysis.recommendedAction,
        recommendedChannel: analysis.recommendedChannel,
        recommendedDelayMinutes: analysis.recommendedDelayMinutes,
        reason: analysis.reason,
        status: 'OPEN',
      },
      update: {
        recoveryProbability: analysis.recoveryProbability,
        priorityScore: analysis.priorityScore,
        recommendedAction: analysis.recommendedAction,
        recommendedChannel: analysis.recommendedChannel,
        recommendedDelayMinutes: analysis.recommendedDelayMinutes,
        reason: analysis.reason,
        updatedAt: new Date(),
      },
    });

    // Record in ActivityLog
    await prisma.activityLog.create({
      data: {
        action: 'RECOVERY_ANALYSIS_EXECUTED',
        entityType: 'Payment',
        entityId: payment.id,
        description: `Analysis completed for payment ${payment.orderId} (₹${payment.amount.toLocaleString()}): Score ${analysis.priorityScore}/100, Action: ${analysis.recommendedAction} via ${analysis.recommendedChannel}`,
      },
    });

    // 11. Return the complete analysis
    res.json({
      success: true,
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        segment: customer.customerSegment,
        ltv: customer.lifetimeValue,
      },
      analysis,
      opportunity,
    });
  } catch (error: any) {
    console.error(`[RecoveryAPI] Error analyzing payment ${req.params.paymentId}:`, error);
    res.status(500).json({ error: 'Failed to analyze payment recovery', message: error?.message });
  }
});

// POST /api/recovery/simulate-action
recoveryRouter.post('/simulate-action', async (req: Request, res: Response) => {
  try {
    const { paymentId, channel = 'WHATSAPP', action = 'IMMEDIATE_RETRY', messageContent } = req.body;

    if (!paymentId) {
      res.status(400).json({ error: 'paymentId is required' });
      return;
    }

    const payment = await prisma.payment.findFirst({
      where: { OR: [{ id: paymentId }, { orderId: paymentId }] },
      include: { customer: true, recoveryOpportunity: true },
    });

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    // 1. Create simulated message record
    const message = await prisma.message.create({
      data: {
        paymentId: payment.id,
        channel,
        tone: 'FRIENDLY',
        content: messageContent || `Hi ${payment.customer.name}, your payment of ₹${payment.amount.toLocaleString()} was interrupted. Retry here: https://rzp.io/l/rec_${payment.orderId}`,
        status: 'SENT - SIMULATED',
        sentAt: new Date(),
      },
    });

    // 2. Create recovery attempt
    const attempt = await prisma.recoveryAttempt.create({
      data: {
        paymentId: payment.id,
        action,
        channel,
        status: 'PENDING',
        result: 'Customer notification dispatched (Simulation)',
      },
    });

    // 3. Update recovery opportunity status to IN_PROGRESS
    const opportunity = await prisma.recoveryOpportunity.upsert({
      where: { paymentId: payment.id },
      create: {
        paymentId: payment.id,
        recoveryProbability: 0.85,
        priorityScore: 85,
        recommendedAction: action,
        recommendedChannel: channel,
        recommendedDelayMinutes: 0,
        reason: 'Automated recovery action launched by merchant.',
        status: 'IN_PROGRESS',
      },
      update: {
        status: 'IN_PROGRESS',
        updatedAt: new Date(),
      },
    });

    // 4. Log to ActivityLog
    await prisma.activityLog.create({
      data: {
        action: 'RECOVERY_ACTION_INITIATED',
        entityType: 'Payment',
        entityId: payment.id,
        description: `Recovery outreach initiated for order ${payment.orderId} (₹${payment.amount.toLocaleString()}) via ${channel} [DEMO SIMULATION]`,
      },
    });

    res.json({
      success: true,
      message: 'Recovery workflow initiated successfully (Simulation)',
      payment,
      opportunity,
      recoveryAttempt: attempt,
      sentMessage: message,
    });
  } catch (error: any) {
    console.error('[RecoveryAPI] Error in simulate-action:', error);
    res.status(500).json({ error: 'Failed to simulate recovery action', message: error?.message });
  }
});

// POST /api/recovery/simulate-retry
recoveryRouter.post('/simulate-retry', async (req: Request, res: Response) => {
  try {
    const { paymentId, outcome = 'SUCCESS' } = req.body;

    if (!paymentId) {
      res.status(400).json({ error: 'paymentId is required' });
      return;
    }

    const payment = await prisma.payment.findFirst({
      where: { OR: [{ id: paymentId }, { orderId: paymentId }] },
      include: { customer: true, recoveryOpportunity: true },
    });

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    if (outcome === 'SUCCESS') {
      // 1. Mark payment as SUCCESS and set recoveredAmount
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          recoveredAmount: payment.amount,
          updatedAt: new Date(),
        },
      });

      // 2. Update customer metrics
      await prisma.customer.update({
        where: { id: payment.customerId },
        data: {
          lifetimeValue: { increment: payment.amount },
          successfulPayments: { increment: 1 },
          failedPayments: Math.max(0, payment.customer.failedPayments - 1),
        },
      });

      // 3. Update recovery opportunity to RECOVERED
      const updatedOpportunity = await prisma.recoveryOpportunity.update({
        where: { paymentId: payment.id },
        data: {
          status: 'RECOVERED',
          updatedAt: new Date(),
        },
      });

      // 4. Update latest recovery attempt if exists
      const latestAttempt = await prisma.recoveryAttempt.findFirst({
        where: { paymentId: payment.id },
        orderBy: { attemptedAt: 'desc' },
      });

      if (latestAttempt) {
        await prisma.recoveryAttempt.update({
          where: { id: latestAttempt.id },
          data: {
            status: 'SUCCESS',
            completedAt: new Date(),
            result: 'Payment completed successfully via customer retry link',
          },
        });
      } else {
        await prisma.recoveryAttempt.create({
          data: {
            paymentId: payment.id,
            action: 'IMMEDIATE_RETRY',
            channel: 'PAYMENT_PAGE',
            status: 'SUCCESS',
            completedAt: new Date(),
            result: 'Payment completed successfully via customer retry link',
          },
        });
      }

      // 5. Create ActivityLog
      await prisma.activityLog.create({
        data: {
          action: 'PAYMENT_RECOVERED',
          entityType: 'Payment',
          entityId: payment.id,
          description: `₹${payment.amount.toLocaleString()} successfully recovered for order ${payment.orderId}! [DEMO SIMULATION]`,
        },
      });

      res.json({
        success: true,
        outcome: 'SUCCESS',
        recoveredAmount: payment.amount,
        payment: updatedPayment,
        opportunity: updatedOpportunity,
      });
    } else {
      // Retry failed
      const newRetryCount = payment.retryCount + 1;
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          retryCount: newRetryCount,
          lastRetryAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Recalculate priority & probability
      const analysis = analyzePaymentRecovery({
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          failureReason: payment.failureReason,
          retryCount: newRetryCount,
          createdAt: payment.createdAt,
        },
        customer: payment.customer,
      });

      const updatedOpportunity = await prisma.recoveryOpportunity.update({
        where: { paymentId: payment.id },
        data: {
          recoveryProbability: analysis.recoveryProbability,
          priorityScore: analysis.priorityScore,
          reason: `Retry failed. Probability decayed to ${(analysis.recoveryProbability * 100).toFixed(0)}%.`,
          status: newRetryCount >= 3 ? 'UNRECOVERABLE' : 'OPEN',
          updatedAt: new Date(),
        },
      });

      // Update latest attempt to FAILED
      const latestAttempt = await prisma.recoveryAttempt.findFirst({
        where: { paymentId: payment.id },
        orderBy: { attemptedAt: 'desc' },
      });

      if (latestAttempt) {
        await prisma.recoveryAttempt.update({
          where: { id: latestAttempt.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            result: 'Customer retry attempt failed or declined',
          },
        });
      }

      // Create ActivityLog
      await prisma.activityLog.create({
        data: {
          action: 'RETRY_FAILED',
          entityType: 'Payment',
          entityId: payment.id,
          description: `Customer retry failed for order ${payment.orderId}. Priority adjusted to ${analysis.priorityScore}/100. [DEMO SIMULATION]`,
        },
      });

      res.json({
        success: true,
        outcome: 'FAILED',
        retryCount: newRetryCount,
        payment: updatedPayment,
        opportunity: updatedOpportunity,
      });
    }
  } catch (error: any) {
    console.error('[RecoveryAPI] Error in simulate-retry:', error);
    res.status(500).json({ error: 'Failed to simulate payment retry', message: error?.message });
  }
});
