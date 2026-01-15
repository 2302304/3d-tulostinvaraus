import { Router, Request, Response } from 'express';
import { reservationService } from '../services/reservation.service.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware.js';
import { createReservationSchema } from '../utils/validation.js';
import { Role } from '@prisma/client';
import { ZodError } from 'zod';

const router = Router();

// GET /api/reservations - Hae kaikki varaukset
router.get('/', async (req: Request, res: Response) => {
  try {
    const { printerId, startDate, endDate } = req.query;

    const filters: {
      printerId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {};

    if (printerId) filters.printerId = printerId as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const reservations = await reservationService.getAll(filters);
    res.json({ success: true, data: reservations });
  } catch (error) {
    console.error('Virhe haettaessa varauksia:', error);
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

// GET /api/reservations/:id - Hae yksittäinen varaus
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const reservation = await reservationService.getById(req.params.id);
    if (!reservation) {
      res.status(404).json({ success: false, error: 'Varausta ei löydy' });
      return;
    }
    res.json({ success: true, data: reservation });
  } catch (error) {
    console.error('Virhe haettaessa varausta:', error);
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

// POST /api/reservations - Luo uusi varaus
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Autentikointi vaaditaan' });
      return;
    }

    const data = createReservationSchema.parse(req.body);
    const reservation = await reservationService.create(req.user.userId, data);
    res.status(201).json({ success: true, data: reservation });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    console.error('Virhe luotaessa varausta:', error);
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

// PATCH /api/reservations/:id - Päivitä varaus
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Autentikointi vaaditaan' });
      return;
    }

    const { startTime, endTime, description } = req.body;
    const reservation = await reservationService.update(
      req.params.id,
      req.user.userId,
      req.user.role,
      { startTime, endTime, description }
    );
    res.json({ success: true, data: reservation });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    console.error('Virhe päivittäessä varausta:', error);
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

// POST /api/reservations/:id/cancel - Peruuta varaus
router.post('/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Autentikointi vaaditaan' });
      return;
    }

    const reservation = await reservationService.cancel(
      req.params.id,
      req.user.userId,
      req.user.role
    );
    res.json({ success: true, data: reservation, message: 'Varaus peruutettu' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    console.error('Virhe peruuttaessa varausta:', error);
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

// DELETE /api/reservations/:id - Poista varaus (admin)
router.delete('/:id', authenticate, authorize(Role.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    await reservationService.delete(req.params.id);
    res.json({ success: true, message: 'Varaus poistettu' });
  } catch (error) {
    console.error('Virhe poistettaessa varausta:', error);
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

export default router;
