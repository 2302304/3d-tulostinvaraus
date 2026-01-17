import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import printerRoutes from './routes/printer.routes.js';
import reservationRoutes from './routes/reservation.routes.js';
import auditRoutes from './routes/audit.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Rate limiting (testeissä ohitetaan)
if (process.env.NODE_ENV !== 'test') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Liian monta pyyntöä, yritä myöhemmin uudelleen' }
  });
  app.use(limiter);

  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 10 : 50,
    message: { error: 'Liian monta kirjautumisyritystä, yritä myöhemmin uudelleen' }
  });
  app.use('/api/auth', authLimiter);
}

// Reitit
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/printers', printerRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/audit', auditRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404-käsittelijä
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { message: 'Reittiä ei löydy', code: 'NOT_FOUND' } });
});

// Keskitetty virheenkäsittelijä
app.use(errorHandler);

export default app;
