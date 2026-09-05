import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { aiService } from '../services/ai.js';

export const aiRouter = Router();

/**
 * POST /api/ai/analyze-payment
 * Runs AI payment analysis (with deterministic fallback).
 */
aiRouter.post('/analyze-payment', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId || typeof paymentId !== 'string') {
      res.status(400).json({ error: 'paymentId is required in request body' });
      return;
    }

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ id: paymentId }, { orderId: paymentId }],
      },
      include: { customer: true, recoveryOpportunity: true },
    });

    if (!payment) {
      res.status(404).json({ error: `Payment not found for id: ${paymentId}` });
      return;
    }

    const analysis = await aiService.analyzePayment({
      payment: {
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        failureCode: payment.failureCode,
        failureReason: payment.failureReason,
        retryCount: payment.retryCount,
        createdAt: payment.createdAt,
      },
      customer: {
        id: payment.customer.id,
        name: payment.customer.name,
        email: payment.customer.email,
        lifetimeValue: payment.customer.lifetimeValue,
        successfulPayments: payment.customer.successfulPayments,
        failedPayments: payment.customer.failedPayments,
        customerSegment: payment.customer.customerSegment,
      },
    });

    // Sync / Upsert RecoveryOpportunity in DB with validated metrics
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

    // Record activity log
    await prisma.activityLog.create({
      data: {
        action: 'AI_PAYMENT_ANALYZED',
        entityType: 'Payment',
        entityId: payment.id,
        description: `AI analysis completed (${analysis.engine}): Score ${analysis.priorityScore}/100, Action: ${analysis.recommendedAction}`,
      },
    });

    res.json({
      success: true,
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      customer: {
        id: payment.customer.id,
        name: payment.customer.name,
        email: payment.customer.email,
        segment: payment.customer.customerSegment,
        ltv: payment.customer.lifetimeValue,
      },
      analysis,
      opportunity,
    });
  } catch (error: any) {
    console.error('[AIRouter] Error analyzing payment:', error);
    res.status(500).json({ error: 'Failed to analyze payment', message: error?.message });
  }
});

/**
 * POST /api/ai/generate-message
 * Generates personalized customer recovery communication with security guardrails.
 */
aiRouter.post('/generate-message', async (req: Request, res: Response) => {
  try {
    const {
      paymentId,
      customerName,
      paymentAmount,
      currency,
      failureReason,
      recommendedAction,
      channel,
      tone,
      retryLink,
    } = req.body;

    let targetCustomerName = customerName;
    let targetAmount = paymentAmount;
    let targetFailureReason = failureReason;
    let targetAction = recommendedAction;
    let orderId = 'rec_demo';

    // If paymentId is passed, hydrate from database
    if (paymentId && typeof paymentId === 'string') {
      const payment = await prisma.payment.findFirst({
        where: {
          OR: [{ id: paymentId }, { orderId: paymentId }],
        },
        include: { customer: true, recoveryOpportunity: true },
      });

      if (payment) {
        orderId = payment.orderId;
        targetCustomerName = targetCustomerName || payment.customer.name;
        targetAmount = targetAmount ?? payment.amount;
        targetFailureReason = targetFailureReason || payment.failureReason || 'temporary network glitch';
        targetAction = targetAction || payment.recoveryOpportunity?.recommendedAction || 'IMMEDIATE_RETRY';
      }
    }

    const result = await aiService.generateMessage({
      customerName: targetCustomerName || 'Valued Customer',
      paymentAmount: targetAmount || 4999,
      currency: currency || 'INR',
      failureReason: targetFailureReason || 'technical glitch',
      recommendedAction: targetAction || 'IMMEDIATE_RETRY',
      channel: channel || 'WHATSAPP',
      tone: tone || 'FRIENDLY',
      orderId,
      retryLink,
    });

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('[AIRouter] Error generating recovery message:', error);
    res.status(500).json({ error: 'Failed to generate message', message: error?.message });
  }
});

/**
 * POST /api/ai/query
 * Natural language merchant question answering.
 */
aiRouter.post('/query', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'query string is required in request body' });
      return;
    }

    const result = await aiService.answerMerchantQuery(query);

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('[AIRouter] Error answering merchant query:', error);
    res.status(500).json({ error: 'Failed to answer merchant query', message: error?.message });
  }
});

/**
 * POST /api/ai/insight
 * Generates live portfolio recovery insights.
 */
aiRouter.post('/insight', async (_req: Request, res: Response) => {
  try {
    const result = await aiService.generateInsight();

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('[AIRouter] Error generating recovery insights:', error);
    res.status(500).json({ error: 'Failed to generate recovery insights', message: error?.message });
  }
});
