import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import printerRoutes from './routes/printer.routes.js';
import reservationRoutes from './routes/reservation.routes.js';
import auditRoutes from './routes/audit.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

// Prisma client
export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuuttia
  max: 100, // max 100 pyyntöä per IP
  message: { error: 'Liian monta pyyntöä, yritä myöhemmin uudelleen' }
});
app.use(limiter);

// Tiukempi rate limit kirjautumiselle
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Liian monta kirjautumisyritystä, yritä myöhemmin uudelleen' }
});

// Reitit
app.use('/api/auth', authLimiter, authRoutes);
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

// Käynnistys
async function main() {
  try {
    await prisma.$connect();
    console.log('Tietokantayhteys muodostettu');

    app.listen(PORT, () => {
      console.log(`Palvelin käynnissä portissa ${PORT}`);
    });
  } catch (error) {
    console.error('Käynnistysvirhe:', error);
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
