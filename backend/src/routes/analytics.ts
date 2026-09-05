import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { merchantAnalyticsService } from '../services/merchantAnalytics.js';

export const analyticsRouter = Router();

// GET /api/analytics/overview
analyticsRouter.get('/overview', async (req: Request, res: Response) => {
  try {
    const { range = '30d' } = req.query;

    let days = 30;
    if (range === '7d') days = 7;
    else if (range === '90d') days = 90;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [payments, opportunities, failureReasons, paymentMethods] = await Promise.all([
      prisma.payment.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          id: true,
          amount: true,
          status: true,
          recoveredAmount: true,
          createdAt: true,
        },
      }),
      prisma.recoveryOpportunity.findMany({
        include: { payment: { select: { amount: true, status: true } } },
      }),
      merchantAnalyticsService.getFailureReasonBreakdown(),
      merchantAnalyticsService.getPaymentMethodBreakdown(),
    ]);

    let totalProcessedRevenue = 0;
    let failedPaymentValue = 0;
    let recoveredRevenue = 0;

    for (const p of payments) {
      totalProcessedRevenue += p.amount;
      if (p.status === 'FAILED' || p.status === 'PENDING') {
        failedPaymentValue += p.amount;
      }
      if (p.status === 'SUCCESS') {
        recoveredRevenue += p.recoveredAmount;
      }
    }

    let recoverableRevenue = 0;
    let openOpportunitiesCount = 0;
    let highPriorityCount = 0;

    for (const opp of opportunities) {
      if (opp.status === 'OPEN' || opp.status === 'IN_PROGRESS') {
        openOpportunitiesCount++;
        recoverableRevenue += opp.payment.amount;
        if (opp.priorityScore >= 75) {
          highPriorityCount++;
        }
      }
    }

    // Recovery Rate %
    const totalLostOrRecovered = failedPaymentValue + recoveredRevenue;
    const recoveryRate = totalLostOrRecovered > 0
      ? Math.round((recoveredRevenue / totalLostOrRecovered) * 100)
      : 0;

    // Generate chart data based on time range
    const bucketCount = range === '7d' ? 7 : range === '30d' ? 6 : 12;
    const intervalMs = (days * 24 * 60 * 60 * 1000) / bucketCount;

    const chartData = [];
    for (let i = 0; i < bucketCount; i++) {
      const bucketStart = new Date(startDate.getTime() + i * intervalMs);
      const bucketEnd = new Date(startDate.getTime() + (i + 1) * intervalMs);

      let successfulVol = 0;
      let failedVol = 0;
      let recoveredVol = 0;

      for (const p of payments) {
        const d = new Date(p.createdAt);
        if (d >= bucketStart && d < bucketEnd) {
          if (p.status === 'SUCCESS') {
            successfulVol += p.amount;
            recoveredVol += p.recoveredAmount;
          } else if (p.status === 'FAILED' || p.status === 'PENDING') {
            failedVol += p.amount;
          }
        }
      }

      const label = range === '7d'
        ? bucketStart.toLocaleDateString('en-US', { weekday: 'short' })
        : `${bucketStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

      chartData.push({
        date: label,
        successful: Math.round(successfulVol),
        failed: Math.round(failedVol),
        recovered: Math.round(recoveredVol),
      });
    }

    res.json({
      range,
      metrics: {
        totalProcessedRevenue: Math.round(totalProcessedRevenue),
        failedPaymentValue: Math.round(failedPaymentValue),
        recoverableRevenue: Math.round(recoverableRevenue),
        recoveredRevenue: Math.round(recoveredRevenue),
        recoveryRate,
        openOpportunitiesCount,
        highPriorityCount,
      },
      chartData,
      failureReasons: failureReasons.slice(0, 5),
      paymentMethods,
    });
  } catch (error: any) {
    console.error('[AnalyticsAPI] Error fetching overview:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview', message: error?.message });
  }
});
