import React, { useState } from 'react';
import { Bot, Send, Sparkles, Database, User } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  engine?: 'openai' | 'fallback';
  dataPoints?: Record<string, any>;
  suggestedAction?: string;
  timestamp: string;
}

export const AIAgentPage: React.FC = () => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial',
      sender: 'assistant',
      content:
        'Hello! I am your RecoverAI Assistant. Ask me anything about your lost revenue, high-priority opportunities, drop-off failure reasons, or recovery recommendations.',
      engine: 'openai',
      timestamp: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const samplePrompts = [
    'How much revenue can I recover?',
    'Which failure reason is most common?',
    'Which payment method fails most?',
    'Show failed payments above 5000',
    'Which customers have the highest recoverable revenue?',
    'How much revenue have we recovered?',
  ];

  const handleSendQuery = async (queryToSend?: string) => {
    const q = (queryToSend || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.queryAIAgent(q);
      const botMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'assistant',
        content: res.result.answer,
        engine: res.result.engine,
        dataPoints: res.result.dataPoints,
        suggestedAction: res.result.suggestedAction,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      showToast('error', 'Query Failed', err?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-sky-900/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              RecoverAI Merchant Copilot
            </h2>
            <p className="text-xs text-slate-400">
              Conversational recovery business intelligence grounded in live database telemetry
            </p>
          </div>
        </div>

        <span className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          Live SQLite State Connected
        </span>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isUser
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-sky-400 border border-slate-700'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs space-y-2.5 shadow-md ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.content}</p>

                {/* Structured Data Points if returned */}
                {m.dataPoints && Object.keys(m.dataPoints).length > 0 && (
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Telemetry Highlights:</span>
                    {m.dataPoints.totalRecoverable && (
                      <div>Recoverable Volume: ₹{m.dataPoints.totalRecoverable.toLocaleString()}</div>
                    )}
                    {m.dataPoints.topFailureReason && (
                      <div>Top Drop Reason: {m.dataPoints.topFailureReason} ({m.dataPoints.topReasonCount} orders)</div>
                    )}
                    {m.dataPoints.topMethod && (
                      <div>Failing Payment Method: {m.dataPoints.topMethod} (₹{m.dataPoints.failedAmount.toLocaleString()})</div>
                    )}
                  </div>
                )}

                {/* Suggested Action Pill */}
                {m.suggestedAction && (
                  <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    <span>Action: {m.suggestedAction}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>{m.timestamp}</span>
                  {m.engine && (
                    <span className="opacity-80">
                      Engine: {m.engine === 'openai' ? 'OpenAI LLM' : 'Fallback Engine'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-sky-400 border border-slate-700 flex items-center justify-center text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
              Synthesizing response from telemetry...
            </div>
          </div>
        )}
      </div>

      {/* Sample Quick Chips */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs">
        <span className="text-slate-500 text-[11px] font-semibold whitespace-nowrap">Suggested:</span>
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSendQuery(p)}
            className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] whitespace-nowrap transition"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Query Input Box */}
      <div className="relative">
        <input
          type="text"
          placeholder="Ask about your payment recovery, dropoffs, or customers..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
          disabled={loading}
          className="w-full pl-4 pr-24 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition shadow-lg"
        />
        <button
          onClick={() => handleSendQuery()}
          disabled={!inputQuery.trim() || loading}
          className="absolute right-2 top-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
