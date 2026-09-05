export type RecoveryAction =
  | 'IMMEDIATE_RETRY'
  | 'DELAYED_RETRY'
  | 'PAYMENT_METHOD_UPDATE'
  | 'SEND_REMINDER'
  | 'ALTERNATE_PAYMENT_METHOD';

export type RecoveryChannel = 'WHATSAPP' | 'SMS' | 'EMAIL' | 'PAYMENT_PAGE';

export interface Customer {
  id: string;
  merchantId?: string | null;
  name: string;
  email: string;
  phone: string;
  lifetimeValue: number;
  successfulPayments: number;
  failedPayments: number;
  customerSegment: 'HIGH_VALUE' | 'REGULAR' | 'NEW';
  createdAt: string;
  updatedAt: string;
  _count?: {
    payments: number;
  };
  payments?: Payment[];
}

export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  merchantId?: string | null;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED' | 'EXPIRED';
  paymentMethod: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' | 'EMI';
  failureCode?: string | null;
  failureReason?: string | null;
  retryCount: number;
  lastRetryAt?: string | null;
  recoveredAmount: number;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  recoveryOpportunity?: RecoveryOpportunity | null;
  recoveryAttempts?: RecoveryAttempt[];
  messages?: Message[];
}

export interface RecoveryOpportunity {
  id: string;
  paymentId: string;
  recoveryProbability: number;
  priorityScore: number;
  recommendedAction: RecoveryAction;
  recommendedChannel: RecoveryChannel;
  recommendedDelayMinutes: number;
  reason: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RECOVERED' | 'UNRECOVERABLE';
  createdAt: string;
  updatedAt: string;
  payment?: Payment;
}

export interface RecoveryAttempt {
  id: string;
  paymentId: string;
  action: string;
  channel: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  attemptedAt: string;
  completedAt?: string | null;
  result?: string | null;
}

export interface Message {
  id: string;
  paymentId: string;
  channel: string;
  tone: string;
  content: string;
  status: string;
  createdAt: string;
  sentAt?: string | null;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
}

export interface AnalyticsOverview {
  range: string;
  metrics: {
    totalProcessedRevenue: number;
    failedPaymentValue: number;
    recoverableRevenue: number;
    recoveredRevenue: number;
    recoveryRate: number;
    openOpportunitiesCount: number;
    highPriorityCount: number;
  };
  chartData: Array<{
    date: string;
    successful: number;
    failed: number;
    recovered: number;
  }>;
  failureReasons: Array<{
    reason: string;
    count: number;
    totalAmount: number;
  }>;
  paymentMethods: Array<{
    paymentMethod: string;
    totalTransactions: number;
    failedTransactions: number;
    failureRatePct: number;
    failedAmount: number;
  }>;
}

export interface AIAnalysisResponse {
  success: boolean;
  paymentId: string;
  orderId: string;
  amount: number;
  customer: {
    id: string;
    name: string;
    email: string;
    segment: string;
    ltv: number;
  };
  analysis: {
    recoveryProbability: number;
    priorityScore: number;
    recommendedAction: string;
    recommendedChannel: string;
    recommendedDelayMinutes: number;
    reason: string;
    customerInsight: string;
    riskFactors: string[];
    positiveSignals: string[];
    engine: 'openai' | 'fallback';
    factors?: any;
  };
  opportunity: RecoveryOpportunity;
}

export interface AIMessageResponse {
  success: boolean;
  result: {
    message: string;
    subject?: string;
    channel: string;
    tone: string;
    engine: 'openai' | 'fallback';
    guardrailsPassed: boolean;
  };
}

export interface AIQueryResponse {
  success: boolean;
  result: {
    query: string;
    answer: string;
    engine: 'openai' | 'fallback';
    dataPoints?: Record<string, any>;
    suggestedAction?: string;
  };
}
