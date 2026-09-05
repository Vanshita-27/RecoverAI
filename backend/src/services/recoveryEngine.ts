export type RecoveryAction =
  | 'IMMEDIATE_RETRY'
  | 'DELAYED_RETRY'
  | 'PAYMENT_METHOD_UPDATE'
  | 'SEND_REMINDER'
  | 'ALTERNATE_PAYMENT_METHOD';

export type RecoveryChannel = 'WHATSAPP' | 'SMS' | 'EMAIL' | 'PAYMENT_PAGE';

export interface RecoveryScoringInput {
  payment: {
    id: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    failureReason: string | null;
    retryCount: number;
    createdAt: Date | string;
  };
  customer: {
    id: string;
    name: string;
    lifetimeValue: number;
    successfulPayments: number;
    failedPayments: number;
    customerSegment: string;
  };
}

export interface PriorityFactors {
  amountScore: number;         // 0 to 35
  probabilityScore: number;    // 0 to 30
  customerValueScore: number;  // 0 to 20
  urgencyScore: number;        // 0 to 15
  retryPenalty: number;        // 0 to 20 (deduction)
  explanation: {
    amountFactor: string;
    probabilityFactor: string;
    customerFactor: string;
    urgencyFactor: string;
    retryFactor: string;
  };
}

export interface RecoveryAnalysisResult {
  recoveryProbability: number; // 0.00 to 1.00
  priorityScore: number;       // 0 to 100
  recommendedAction: RecoveryAction;
  recommendedChannel: RecoveryChannel;
  recommendedDelayMinutes: number;
  reason: string;
  factors: PriorityFactors;
}

/**
 * Calculates deterministic recovery metrics for a payment based on failure attributes,
 * customer history, transaction amount, and temporal urgency.
 */
export function analyzePaymentRecovery(input: RecoveryScoringInput): RecoveryAnalysisResult {
  const { payment, customer } = input;
  const reasonCode = payment.failureReason || 'UNKNOWN';
  const paymentDate = new Date(payment.createdAt);
  const now = new Date();
  const hoursSinceFailure = Math.max(0, (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60));

  // --- 1. Base Probability by Failure Reason ---
  let baseProb = 0.40;
  let action: RecoveryAction = 'SEND_REMINDER';
  let channel: RecoveryChannel = 'WHATSAPP';
  let delayMinutes = 15;
  let explanation = '';

  switch (reasonCode) {
    case 'NETWORK_ERROR':
      baseProb = 0.90;
      action = 'IMMEDIATE_RETRY';
      channel = 'PAYMENT_PAGE';
      delayMinutes = 0;
      explanation = 'Transient network handshake failure. Customer is actively waiting; immediate retry has peak success probability.';
      break;

    case 'UPI_TIMEOUT':
      baseProb = 0.88;
      action = 'IMMEDIATE_RETRY';
      channel = 'WHATSAPP';
      delayMinutes = 0;
      explanation = 'UPI server or PSP latency expired session. Instant WhatsApp prompt with 1-click Razorpay retry link recommended.';
      break;

    case 'PAYMENT_SESSION_EXPIRED':
      baseProb = 0.72;
      action = 'SEND_REMINDER';
      channel = 'WHATSAPP';
      delayMinutes = 15;
      explanation = 'Customer abandoned checkout session. Send a warm reminder containing a fresh pre-filled checkout session.';
      break;

    case 'INSUFFICIENT_FUNDS':
      baseProb = 0.55;
      action = 'DELAYED_RETRY';
      channel = 'WHATSAPP';
      delayMinutes = 180; // 3 hours cooldown
      explanation = 'Insufficient bank balance. Allow a 3-hour buffer for account reload before triggering a discreet retry prompt.';
      break;

    case 'LIMIT_EXCEEDED':
      baseProb = 0.50;
      action = 'ALTERNATE_PAYMENT_METHOD';
      channel = 'WHATSAPP';
      delayMinutes = 60;
      explanation = 'Daily UPI/card transaction limit exceeded. Recommend switching to Netbanking or No-Cost EMI options.';
      break;

    case 'BANK_DECLINED':
      baseProb = 0.45;
      action = 'ALTERNATE_PAYMENT_METHOD';
      channel = 'WHATSAPP';
      delayMinutes = 30;
      explanation = 'Issuer bank flagged or declined payment. Prompt user to switch to an alternate card or UPI.';
      break;

    case 'INCORRECT_DETAILS':
      baseProb = 0.42;
      action = 'PAYMENT_METHOD_UPDATE';
      channel = 'PAYMENT_PAGE';
      delayMinutes = 0;
      explanation = 'Incorrect CVV or authentication credential entered. Redirect customer to update details securely.';
      break;

    case 'CARD_EXPIRED':
      baseProb = 0.35;
      action = 'PAYMENT_METHOD_UPDATE';
      channel = 'EMAIL';
      delayMinutes = 15;
      explanation = 'Card validity expired. Email a direct payment instrument update link with alternative options.';
      break;

    default:
      baseProb = 0.40;
      action = 'SEND_REMINDER';
      channel = 'EMAIL';
      delayMinutes = 60;
      explanation = 'Generic or unclassified payment failure. Follow up with proactive payment support link.';
      break;
  }

  // --- 2. Customer Historical Modifier ---
  const totalAttempts = customer.successfulPayments + customer.failedPayments;
  let successModifier = 0;
  if (totalAttempts > 0) {
    const successRatio = customer.successfulPayments / totalAttempts;
    successModifier = (successRatio - 0.5) * 0.12; // -0.06 to +0.06
  }

  // Customer segment modifier
  let segmentModifier = 0;
  if (customer.customerSegment === 'HIGH_VALUE') {
    segmentModifier = 0.06;
  } else if (customer.customerSegment === 'REGULAR') {
    segmentModifier = 0.02;
  }

  // --- 3. Retry Count Decay ---
  // Diminishing returns after multiple retries
  const retryPenaltyOnProb = payment.retryCount * 0.12;

  // --- 4. Age / Recency Decay ---
  let agePenaltyOnProb = 0;
  if (hoursSinceFailure > 24) {
    agePenaltyOnProb = 0.15;
  } else if (hoursSinceFailure > 6) {
    agePenaltyOnProb = 0.08;
  } else if (hoursSinceFailure > 1) {
    agePenaltyOnProb = 0.03;
  }

  // Final clamped probability
  let finalProb = baseProb + successModifier + segmentModifier - retryPenaltyOnProb - agePenaltyOnProb;
  finalProb = Math.max(0.05, Math.min(0.98, finalProb));
  finalProb = Math.round(finalProb * 100) / 100;

  // --- 5. Priority Score (0–100) Calculation ---
  // Factor A: Amount Score (max 35)
  let amountScore = 5;
  if (payment.amount >= 100000) {
    amountScore = 35;
  } else if (payment.amount >= 50000) {
    amountScore = 30;
  } else if (payment.amount >= 20000) {
    amountScore = 24;
  } else if (payment.amount >= 5000) {
    amountScore = 18;
  } else if (payment.amount >= 1500) {
    amountScore = 12;
  }

  // Factor B: Probability Score (max 30)
  const probabilityScore = Math.round(finalProb * 30);

  // Factor C: Customer Value Score (max 20)
  let customerValueScore = 6;
  if (customer.customerSegment === 'HIGH_VALUE' || customer.lifetimeValue >= 75000) {
    customerValueScore = 20;
  } else if (customer.customerSegment === 'REGULAR' || customer.lifetimeValue >= 15000) {
    customerValueScore = 14;
  }

  // Factor D: Urgency Score (max 15)
  let urgencyScore = 2;
  if (hoursSinceFailure <= 2) {
    urgencyScore = 15;
  } else if (hoursSinceFailure <= 6) {
    urgencyScore = 10;
  } else if (hoursSinceFailure <= 24) {
    urgencyScore = 6;
  }

  // Factor E: Retry Penalty (up to 20 deduction)
  const retryPenalty = Math.min(20, payment.retryCount * 7);

  const rawPriority = amountScore + probabilityScore + customerValueScore + urgencyScore - retryPenalty;
  const priorityScore = Math.max(0, Math.min(100, Math.round(rawPriority)));

  const factors: PriorityFactors = {
    amountScore,
    probabilityScore,
    customerValueScore,
    urgencyScore,
    retryPenalty,
    explanation: {
      amountFactor: `Amount ₹${payment.amount.toLocaleString()} contributes ${amountScore}/35 pts`,
      probabilityFactor: `Recovery probability ${(finalProb * 100).toFixed(0)}% contributes ${probabilityScore}/30 pts`,
      customerFactor: `Segment ${customer.customerSegment} (LTV ₹${customer.lifetimeValue.toLocaleString()}) contributes ${customerValueScore}/20 pts`,
      urgencyFactor: `Elapsed failure window (${hoursSinceFailure.toFixed(1)}h) contributes ${urgencyScore}/15 pts`,
      retryFactor: payment.retryCount > 0 ? `Penalty of -${retryPenalty} pts applied for ${payment.retryCount} prior retries` : 'No retry penalties applied',
    },
  };

  return {
    recoveryProbability: finalProb,
    priorityScore,
    recommendedAction: action,
    recommendedChannel: channel,
    recommendedDelayMinutes: delayMinutes,
    reason: explanation,
    factors,
  };
}
