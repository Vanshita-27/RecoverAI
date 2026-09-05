import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { paymentsRouter } from './routes/payments.js';
import { recoveryRouter } from './routes/recovery.js';
import { customersRouter } from './routes/customers.js';
import { activityRouter } from './routes/activity.js';
import { aiRouter } from './routes/ai.js';
import { analyticsRouter } from './routes/analytics.js';

const app = express();

app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/health', healthRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/recovery', recoveryRouter);
app.use('/api/customers', customersRouter);
app.use('/api/activity', activityRouter);
app.use('/api/ai', aiRouter);
app.use('/api/analytics', analyticsRouter);

// Fallback route for unknown endpoints
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`[RecoverAI] Backend server running on http://0.0.0.0:${config.port}`);
  console.log(`[RecoverAI] Health check available at http://0.0.0.0:${config.port}/api/health`);
});

export default app;
