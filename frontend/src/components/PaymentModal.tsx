import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Bot,
  Zap,
  Clock,
  Sparkles,
  Copy,
  Check,
  Send,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { Payment, RecoveryOpportunity, RecoveryChannel } from '../types';
import { api } from '../services/api';
import { useToast } from './Toast';

interface PaymentModalProps {
  paymentId: string | null;
  onClose: () => void;
  onPaymentUpdated?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  paymentId,
  onClose,
  onPaymentUpdated,
}) => {
  const { showToast } = useToast();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [opportunity, setOpportunity] = useState<RecoveryOpportunity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // AI Analysis state
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
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
  } | null>(null);

  // Message Generation state
  const [channel, setChannel] = useState<RecoveryChannel>('WHATSAPP');
  const [tone, setTone] = useState<'FRIENDLY' | 'URGENT' | 'PROFESSIONAL' | 'MINIMAL'>('FRIENDLY');
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [messageSubject, setMessageSubject] = useState<string | undefined>();
  const [generatingMessage, setGeneratingMessage] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Simulation workflow states
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [recoveryStep, setRecoveryStep] = useState<number>(1); // 1: Failed, 2: Analyzed, 3: Action Launched, 4: Message Sent, 5: Awaiting, 6: Recovered
  const [isSimulatingRetry, setIsSimulatingRetry] = useState<boolean>(false);

  const loadPaymentDetails = useCallback(async () => {
    if (!paymentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPaymentById(paymentId);
      setPayment(data);
      if (data.recoveryOpportunity) {
        setOpportunity(data.recoveryOpportunity);
        setChannel(data.recoveryOpportunity.recommendedChannel);

        if (data.recoveryOpportunity.status === 'RECOVERED') {
          setRecoveryStep(6);
        } else if (data.recoveryOpportunity.status === 'IN_PROGRESS') {
          setRecoveryStep(5);
        } else {
          setRecoveryStep(2);
        }
      } else {
        setRecoveryStep(1);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    loadPaymentDetails();
  }, [loadPaymentDetails]);

  // Run AI Analysis
  const handleRunAnalysis = async () => {
    if (!payment) return;
    setAnalyzing(true);
    try {
      const res = await api.analyzePayment(payment.id);
      setAiAnalysis(res.analysis);
      setOpportunity(res.opportunity);
      setRecoveryStep(2);
      showToast('success', 'AI Analysis Complete', `Identified ${Math.round(res.analysis.recoveryProbability * 100)}% recovery probability`);
      if (onPaymentUpdated) onPaymentUpdated();
    } catch (err: any) {
      showToast('error', 'Analysis Failed', err?.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Generate Personalized Message
  const handleGenerateMessage = async () => {
    if (!payment) return;
    setGeneratingMessage(true);
    try {
      const res = await api.generateMessage({
        paymentId: payment.id,
        customerName: payment.customer?.name,
        paymentAmount: payment.amount,
        failureReason: payment.failureReason || undefined,
        recommendedAction: opportunity?.recommendedAction || aiAnalysis?.recommendedAction,
        channel,
        tone,
      });

      setGeneratedMessage(res.result.message);
      setMessageSubject(res.result.subject);
      showToast('info', 'Message Generated', `Prepared personalized ${channel} draft (${res.result.engine})`);
    } catch (err: any) {
      showToast('error', 'Generation Failed', err?.message);
    } finally {
      setGeneratingMessage(false);
    }
  };

  // Auto-generate initial message when opportunity or channel changes
  useEffect(() => {
    if (payment && !generatedMessage && !generatingMessage) {
      handleGenerateMessage();
    }
  }, [payment, channel, tone]);

  // Primary Demo Action: Recover Now (Simulate Action)
  const handleRecoverNow = async () => {
    if (!payment) return;
    setIsRecovering(true);
    try {
      setRecoveryStep(3);
      await new Promise((r) => setTimeout(r, 600)); // Smooth UX transition
      setRecoveryStep(4);

      const res = await api.simulateAction({
        paymentId: payment.id,
        channel: opportunity?.recommendedChannel || channel,
        action: opportunity?.recommendedAction || 'IMMEDIATE_RETRY',
        messageContent: generatedMessage || undefined,
      });

      setOpportunity(res.opportunity);
      setRecoveryStep(5);
      showToast('success', 'Recovery Workflow Launched (DEMO)', `Simulated ${channel} notification dispatched to ${payment.customer?.name}`);
      if (onPaymentUpdated) onPaymentUpdated();
    } catch (err: any) {
      showToast('error', 'Action Failed', err?.message);
    } finally {
      setIsRecovering(false);
    }
  };

  // Primary Demo Action: Simulate Successful Retry
  const handleSimulateSuccessfulRetry = async () => {
    if (!payment) return;
    setIsSimulatingRetry(true);
    try {
      const res = await api.simulateRetry({
        paymentId: payment.id,
        outcome: 'SUCCESS',
      });

      setPayment(res.payment);
      setOpportunity(res.opportunity);
      setRecoveryStep(6);
      showToast(
        'success',
        'Payment Recovered! 🎉',
        `₹${payment.amount.toLocaleString()} was successfully retrieved via simulated customer retry.`
      );
      if (onPaymentUpdated) onPaymentUpdated();
    } catch (err: any) {
      showToast('error', 'Retry Simulation Failed', err?.message);
    } finally {
      setIsSimulatingRetry(false);
    }
  };

  // Simulate Failed Retry
  const handleSimulateFailedRetry = async () => {
    if (!payment) return;
    setIsSimulatingRetry(true);
    try {
      const res = await api.simulateRetry({
        paymentId: payment.id,
        outcome: 'FAILED',
      });

      setPayment(res.payment);
      setOpportunity(res.opportunity);
      showToast(
        'warning',
        'Retry Failed (Simulation)',
        `Retry count incremented to ${res.retryCount}. Priority score updated.`
      );
      if (onPaymentUpdated) onPaymentUpdated();
    } catch (err: any) {
      showToast('error', 'Retry Simulation Failed', err?.message);
    } finally {
      setIsSimulatingRetry(false);
    }
  };

  const handleCopyMessage = () => {
    if (!generatedMessage) return;
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    showToast('info', 'Copied to Clipboard', 'Message text copied.');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!paymentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl my-8 overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white">Payment Recovery Hub</span>
                {payment && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      payment.status === 'SUCCESS'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : payment.status === 'FAILED'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {payment.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Order: {payment?.orderId || paymentId}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading && (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-slate-400">Loading payment intelligence...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {payment && (
            <>
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Transaction Card */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
                  <span className="text-xs text-slate-400 font-medium">Transaction Amount</span>
                  <div className="text-2xl font-bold text-white">
                    ₹{payment.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Method: {payment.paymentMethod}</span>
                    <span>Retries: {payment.retryCount}</span>
                  </div>
                </div>

                {/* Failure Reason Card */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
                  <span className="text-xs text-slate-400 font-medium">Failure Diagnostics</span>
                  <div className="text-base font-bold text-rose-400 truncate" title={payment.failureReason || 'N/A'}>
                    {payment.failureReason ? payment.failureReason.replace(/_/g, ' ') : 'None / Success'}
                  </div>
                  <div className="text-xs text-slate-400">
                    Code: <code className="text-slate-300 font-mono">{payment.failureCode || 'NONE'}</code>
                  </div>
                </div>

                {/* Customer Profile Card */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Customer Profile</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400">
                      {payment.customer?.customerSegment || 'REGULAR'}
                    </span>
                  </div>
                  <div className="text-base font-bold text-white truncate">
                    {payment.customer?.name}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    LTV: ₹{(payment.customer?.lifetimeValue || 0).toLocaleString()} • {payment.customer?.phone}
                  </div>
                </div>
              </div>

              {/* Primary Demo Simulation Timeline Banner */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Recovery Progression Timeline
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    DEMO SIMULATION
                  </span>
                </div>

                {/* Interactive Steps */}
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  <div className={`p-2 rounded-lg border ${recoveryStep >= 1 ? 'bg-slate-800 border-rose-500/40 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    <span className="block font-bold">1. Failed</span>
                    <span className="text-[10px] opacity-70">Drop Detected</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${recoveryStep >= 2 ? 'bg-slate-800 border-sky-500/40 text-sky-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    <span className="block font-bold">2. Analyzed</span>
                    <span className="text-[10px] opacity-70">AI Scored</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${recoveryStep >= 4 ? 'bg-slate-800 border-amber-500/40 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    <span className="block font-bold">3. Notified</span>
                    <span className="text-[10px] opacity-70">Message Sent</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${recoveryStep >= 5 ? 'bg-slate-800 border-indigo-500/40 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    <span className="block font-bold">4. Awaiting</span>
                    <span className="text-[10px] opacity-70">Customer Retry</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${recoveryStep >= 6 ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    <span className="block font-bold">5. Recovered</span>
                    <span className="text-[10px] opacity-70">Revenue Saved</span>
                  </div>
                </div>
              </div>

              {/* AI RECOVERY RECOMMENDATION PANEL */}
              <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-b from-slate-850 to-slate-900 p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        AI Recovery Recommendation
                      </h3>
                      <p className="text-xs text-slate-400">
                        Synthesized through multi-factor failure telemetry
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Engine Attribution Badge */}
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      {aiAnalysis?.engine === 'openai' ? 'AI Generated (OpenAI)' : 'Deterministic Fallback Engine'}
                    </span>

                    <button
                      onClick={handleRunAnalysis}
                      disabled={analyzing}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3 h-3 ${analyzing ? 'animate-spin' : ''}`} />
                      Re-Analyze
                    </button>
                  </div>
                </div>

                {/* Score Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Recovery Probability</span>
                    <span className="text-xl font-bold text-emerald-400">
                      {Math.round(((opportunity?.recoveryProbability ?? aiAnalysis?.recoveryProbability) ?? 0.85) * 100)}%
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Priority Score</span>
                    <span className="text-xl font-bold text-white">
                      {(opportunity?.priorityScore ?? aiAnalysis?.priorityScore) ?? 85}
                      <span className="text-xs font-normal text-slate-400">/100</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Recommended Action</span>
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wide block truncate" title={opportunity?.recommendedAction || aiAnalysis?.recommendedAction || 'IMMEDIATE_RETRY'}>
                      {(opportunity?.recommendedAction || aiAnalysis?.recommendedAction || 'IMMEDIATE_RETRY').replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Recommended Timing</span>
                    <span className="text-xs font-bold text-amber-300 block">
                      {(opportunity?.recommendedDelayMinutes ?? aiAnalysis?.recommendedDelayMinutes) === 0
                        ? 'Immediate (<15m)'
                        : `Wait ${opportunity?.recommendedDelayMinutes ?? aiAnalysis?.recommendedDelayMinutes} mins`}
                    </span>
                  </div>
                </div>

                {/* AI Rationale */}
                <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-sm space-y-1">
                  <span className="text-xs font-semibold text-slate-400 block">Reasoning & Customer Behavioral Context:</span>
                  <p className="text-slate-200 text-xs leading-relaxed">
                    {opportunity?.reason || aiAnalysis?.reason || 'Transient network timeout detected. Instant retry via WhatsApp payment link has peak recovery probability.'}
                  </p>
                </div>

                {/* Positive Signals & Risk Factors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Positive Signals
                    </span>
                    <ul className="space-y-1 text-slate-300">
                      {(aiAnalysis?.positiveSignals || [
                        `${payment.customer?.successfulPayments || 1} prior successful purchases on record`,
                        'Temporary failure reason; customer intent remains high',
                        'Zero historical chargebacks detected',
                      ]).map((sig, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400">•</span>
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 space-y-1.5">
                    <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Risk Factors
                    </span>
                    <ul className="space-y-1 text-slate-300">
                      {(aiAnalysis?.riskFactors || [
                        payment.retryCount > 0 ? `Payment has already been retried ${payment.retryCount} times` : 'Cart abandonment risk if not reached within 2 hours',
                        'High-value ticket requires explicit customer verification',
                      ]).map((rf, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-400">•</span>
                          <span>{rf}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* PERSONALIZED MESSAGE GENERATION PANEL */}
              <div className="rounded-xl border border-slate-700/80 bg-slate-850 p-5 space-y-4 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-sky-400" />
                      Personalized Recovery Communication
                    </h3>
                    <p className="text-xs text-slate-400">
                      Customized customer dunning copy with simulated payment links
                    </p>
                  </div>

                  {/* Channel Selector */}
                  <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-700">
                    {(['WHATSAPP', 'SMS', 'EMAIL'] as RecoveryChannel[]).map((ch) => (
                      <button
                        key={ch}
                        onClick={() => setChannel(ch)}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                          channel === ch
                            ? 'bg-sky-500 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {ch === 'WHATSAPP' && <Smartphone className="w-3 h-3" />}
                        {ch === 'SMS' && <MessageSquare className="w-3 h-3" />}
                        {ch === 'EMAIL' && <Mail className="w-3 h-3" />}
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone Selector */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-slate-400 font-medium">Tone:</span>
                  {(['FRIENDLY', 'PROFESSIONAL', 'URGENT', 'MINIMAL'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-2.5 py-1 rounded-md border text-xs transition ${
                        tone === t
                          ? 'bg-slate-700 border-sky-400 text-sky-300 font-semibold'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                  <button
                    onClick={handleGenerateMessage}
                    disabled={generatingMessage}
                    className="ml-auto text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1 disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3 h-3 ${generatingMessage ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                </div>

                {/* Message Preview Box */}
                <div className="relative">
                  {messageSubject && (
                    <div className="p-2.5 bg-slate-900/90 rounded-t-lg border-t border-x border-slate-700/80 text-xs font-semibold text-slate-300">
                      <span className="text-slate-500">Subject: </span>
                      {messageSubject}
                    </div>
                  )}
                  <div
                    className={`p-4 bg-slate-950/80 text-xs font-mono text-slate-200 border border-slate-700/80 whitespace-pre-wrap leading-relaxed ${
                      messageSubject ? 'rounded-b-lg' : 'rounded-lg'
                    }`}
                  >
                    {generatingMessage ? 'Drafting personalized recovery message...' : generatedMessage}
                  </div>

                  <button
                    onClick={handleCopyMessage}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    title="Copy message to clipboard"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Guardrails Verification Notice */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Security verified: Never asks for OTP, CVV, passwords, or PINs. Only simulated retry link included.</span>
                </div>
              </div>

              {/* ACTION FOOTER: PRIMARY DEMO SIMULATION FLOW */}
              <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">Execute Primary Demo Action</h4>
                    <p className="text-xs text-slate-400">
                      Launch recovery workflow and simulate end-to-end customer resolution
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Recover Now Button */}
                    {payment.status !== 'SUCCESS' && (
                      <button
                        onClick={handleRecoverNow}
                        disabled={isRecovering}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transition flex items-center gap-2 disabled:opacity-50"
                      >
                        <Send className={`w-4 h-4 ${isRecovering ? 'animate-bounce' : ''}`} />
                        {isRecovering ? 'Dispatching...' : 'Recover Now'}
                      </button>
                    )}

                    {/* Simulate Successful Retry Button */}
                    {payment.status !== 'SUCCESS' && (
                      <button
                        onClick={handleSimulateSuccessfulRetry}
                        disabled={isSimulatingRetry}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold text-sm transition flex items-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Simulate Successful Retry
                      </button>
                    )}

                    {/* Simulate Failed Retry Button */}
                    {payment.status !== 'SUCCESS' && (
                      <button
                        onClick={handleSimulateFailedRetry}
                        disabled={isSimulatingRetry}
                        className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition disabled:opacity-50"
                      >
                        Simulate Failed Retry
                      </button>
                    )}

                    {payment.status === 'SUCCESS' && (
                      <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ₹{payment.amount.toLocaleString()} Recovered Successfully!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
