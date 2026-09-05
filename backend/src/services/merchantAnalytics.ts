import { prisma } from '../db/prisma.js';

export interface RecoverySummaryStats {
  totalPayments: number;
  totalFailedPayments: number;
  totalPendingPayments: number;
  totalSuccessfulPayments: number;
  totalFailedRevenue: number;
  totalRecoveredRevenue: number;
  totalRecoverableRevenue: number; // probability >= 0.50
  highConfidenceRecoverableRevenue: number; // probability >= 0.70
  highPriorityCount: number; // priorityScore >= 75
}

export class MerchantAnalyticsService {
  /**
   * Computes live high-level recovery metrics from the SQLite database.
   */
  public async getSummaryStats(): Promise<RecoverySummaryStats> {
    const [allPayments, opportunities] = await Promise.all([
      prisma.payment.findMany({
        select: {
          status: true,
          amount: true,
          recoveredAmount: true,
        },
      }),
      prisma.recoveryOpportunity.findMany({
        select: {
          recoveryProbability: true,
          priorityScore: true,
          payment: { select: { amount: true, status: true } },
        },
      }),
    ]);

    let totalFailedPayments = 0;
    let totalPendingPayments = 0;
    let totalSuccessfulPayments = 0;
    let totalFailedRevenue = 0;
    let totalRecoveredRevenue = 0;

    for (const p of allPayments) {
      if (p.status === 'FAILED') {
        totalFailedPayments++;
        totalFailedRevenue += p.amount;
      } else if (p.status === 'PENDING') {
        totalPendingPayments++;
        totalFailedRevenue += p.amount;
      } else if (p.status === 'SUCCESS') {
        totalSuccessfulPayments++;
        totalRecoveredRevenue += p.recoveredAmount;
      }
    }

    let totalRecoverableRevenue = 0;
    let highConfidenceRecoverableRevenue = 0;
    let highPriorityCount = 0;

    for (const opp of opportunities) {
      const amt = opp.payment.amount;
      if (opp.recoveryProbability >= 0.50) {
        totalRecoverableRevenue += amt;
      }
      if (opp.recoveryProbability >= 0.70) {
        highConfidenceRecoverableRevenue += amt;
      }
      if (opp.priorityScore >= 75) {
        highPriorityCount++;
      }
    }

    return {
      totalPayments: allPayments.length,
      totalFailedPayments,
      totalPendingPayments,
      totalSuccessfulPayments,
      totalFailedRevenue: Math.round(totalFailedRevenue),
      totalRecoveredRevenue: Math.round(totalRecoveredRevenue),
      totalRecoverableRevenue: Math.round(totalRecoverableRevenue),
      highConfidenceRecoverableRevenue: Math.round(highConfidenceRecoverableRevenue),
      highPriorityCount,
    };
  }

  /**
   * Breakdown of failures by failure reason.
   */
  public async getFailureReasonBreakdown() {
    const failedPayments = await prisma.payment.findMany({
      where: { status: { in: ['FAILED', 'PENDING'] } },
      select: { failureReason: true, amount: true },
    });

    const breakdown: Record<string, { count: number; totalAmount: number }> = {};
    for (const p of failedPayments) {
      const reason = p.failureReason || 'UNKNOWN';
      if (!breakdown[reason]) {
        breakdown[reason] = { count: 0, totalAmount: 0 };
      }
      breakdown[reason].count++;
      breakdown[reason].totalAmount += p.amount;
    }

    return Object.entries(breakdown)
      .map(([reason, stats]) => ({
        reason,
        count: stats.count,
        totalAmount: Math.round(stats.totalAmount),
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  /**
   * Breakdown of failure rate by payment method.
   */
  public async getPaymentMethodBreakdown() {
    const payments = await prisma.payment.findMany({
      select: { paymentMethod: true, status: true, amount: true },
    });

    const stats: Record<string, { total: number; failed: number; failedAmount: number }> = {};
    for (const p of payments) {
      if (!stats[p.paymentMethod]) {
        stats[p.paymentMethod] = { total: 0, failed: 0, failedAmount: 0 };
      }
      stats[p.paymentMethod].total++;
      if (p.status === 'FAILED' || p.status === 'PENDING') {
        stats[p.paymentMethod].failed++;
        stats[p.paymentMethod].failedAmount += p.amount;
      }
    }

    return Object.entries(stats)
      .map(([method, data]) => ({
        paymentMethod: method,
        totalTransactions: data.total,
        failedTransactions: data.failed,
        failureRatePct: Math.round((data.failed / data.total) * 100),
        failedAmount: Math.round(data.failedAmount),
      }))
      .sort((a, b) => b.failedAmount - a.failedAmount);
  }

  /**
   * Top customers with highest failed payment values.
   */
  public async getTopCustomersWithFailedRevenue(limit = 5) {
    const customers = await prisma.customer.findMany({
      include: {
        payments: {
          where: { status: { in: ['FAILED', 'PENDING'] } },
          select: { amount: true, status: true, orderId: true },
        },
      },
    });

    return customers
      .map((c) => {
        const failedAmount = c.payments.reduce((sum, p) => sum + p.amount, 0);
        return {
          id: c.id,
          name: c.name,
          email: c.email,
          segment: c.customerSegment,
          lifetimeValue: c.lifetimeValue,
          failedPaymentsCount: c.payments.length,
          totalFailedAmount: Math.round(failedAmount),
        };
      })
      .filter((c) => c.totalFailedAmount > 0)
      .sort((a, b) => b.totalFailedAmount - a.totalFailedAmount)
      .slice(0, limit);
  }

  /**
   * Failed payments filtered by minimum amount.
   */
  public async getFailedPaymentsAbove(minAmount: number, limit = 10) {
    return prisma.payment.findMany({
      where: {
        status: { in: ['FAILED', 'PENDING'] },
        amount: { gte: minAmount },
      },
      include: {
        customer: true,
        recoveryOpportunity: true,
      },
      orderBy: { amount: 'desc' },
      take: limit,
    });
  }
}

export const merchantAnalyticsService = new MerchantAnalyticsService();
