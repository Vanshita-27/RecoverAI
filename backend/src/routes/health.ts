import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { aiService } from '../services/ai.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  let dbError: string | null = null;

  try {
    // Quick probe to verify SQLite connection
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err: any) {
    dbError = err?.message || 'Database query error';
  }

  const aiMode = aiService.getMode();

  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    project: 'RecoverAI',
    track: 'Razorpay AI Buildathon — Track 3 (AI Revenue Recovery)',
    timestamp: new Date().toISOString(),
    database: {
      provider: 'sqlite',
      status: dbStatus,
      error: dbError,
    },
    aiEngine: {
      mode: aiMode,
      configured: aiService.isConfigured(),
    },
    uptimeSeconds: Math.floor(process.uptime()),
  });
});
