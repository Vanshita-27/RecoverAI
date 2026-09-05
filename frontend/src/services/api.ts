import {
  AnalyticsOverview,
  Payment,
  RecoveryOpportunity,
  Customer,
  ActivityLog,
  AIAnalysisResponse,
  AIMessageResponse,
  AIQueryResponse,
} from '../types';

const BASE_URL = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Analytics Overview
  getAnalyticsOverview: (range = '30d') =>
    request<AnalyticsOverview>(`/analytics/overview?range=${range}`),

  // Recovery Opportunities
  getOpportunities: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<{ total: number; count: number; data: RecoveryOpportunity[] }>(
      `/recovery/opportunities${qs ? `?${qs}` : ''}`
    );
  },

  getOpportunityById: (id: string) =>
    request<RecoveryOpportunity>(`/recovery/opportunities/${id}`),

  // Payments
  getPayments: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<{ total: number; count: number; data: Payment[] }>(
      `/payments${qs ? `?${qs}` : ''}`
    );
  },

  getPaymentById: (id: string) => request<Payment>(`/payments/${id}`),

  // Customers
  getCustomers: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<{ total: number; count: number; data: Customer[] }>(
      `/customers${qs ? `?${qs}` : ''}`
    );
  },

  getCustomerById: (id: string) => request<Customer>(`/customers/${id}`),

  // Activity Logs
  getActivityLogs: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<{ total: number; count: number; data: ActivityLog[] }>(
      `/activity${qs ? `?${qs}` : ''}`
    );
  },

  // AI Endpoints
  analyzePayment: (paymentId: string) =>
    request<AIAnalysisResponse>('/ai/analyze-payment', {
      method: 'POST',
      body: JSON.stringify({ paymentId }),
    }),

  generateMessage: (params: {
    paymentId?: string;
    customerName?: string;
    paymentAmount?: number;
    failureReason?: string;
    recommendedAction?: string;
    channel?: string;
    tone?: string;
  }) =>
    request<AIMessageResponse>('/ai/generate-message', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  queryAIAgent: (query: string) =>
    request<AIQueryResponse>('/ai/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  // Simulation Endpoints
  simulateAction: (params: {
    paymentId: string;
    channel?: string;
    action?: string;
    messageContent?: string;
  }) =>
    request<{
      success: boolean;
      message: string;
      payment: Payment;
      opportunity: RecoveryOpportunity;
    }>('/recovery/simulate-action', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  simulateRetry: (params: { paymentId: string; outcome: 'SUCCESS' | 'FAILED' }) =>
    request<{
      success: boolean;
      outcome: 'SUCCESS' | 'FAILED';
      recoveredAmount?: number;
      retryCount?: number;
      payment: Payment;
      opportunity: RecoveryOpportunity;
    }>('/recovery/simulate-retry', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};
